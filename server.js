const path = require('path');
const os = require('os');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const { questions, comments } = require('./questions');

const PORT = process.env.PORT || 3000;
const HOST_KEY = process.env.HOST_KEY || '7x';
const DEFAULT_TIME = Number(process.env.QUESTION_TIME || 20); // seconds
const NAMES = { megz: 'Megz', '3mora': '3mora' };

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/host', (req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/qr.svg', async (req, res) => {
  const fallback = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}/`;
  const url = String(req.query.url || fallback).slice(0, 300);
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#071552', light: '#ffffff' } });
  res.type('image/svg+xml').send(svg);
});

// ---------------- Game state (in memory — one room) ----------------
const players = new Map(); // playerId -> { name, online }
const game = {
  phase: 'lobby', // lobby | question | results | final
  qIndex: -1,
  endsAt: 0,
  votes: new Map(), // playerId -> 'megz' | '3mora'
  result: null,
  score: { megz: 0, '3mora': 0 },
  history: [],
};
let timer = null;

const durationOf = (i) => (questions[i]?.time || DEFAULT_TIME) * 1000;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Comments never repeat within a game. Only if a whole list runs out does that list start over.
const usedComments = new Set();
function pickComment(pool) {
  let fresh = pool.filter((c) => !usedComments.has(c));
  if (!fresh.length) {
    pool.forEach((c) => usedComments.delete(c));
    fresh = pool;
  }
  const c = pick(fresh);
  usedComments.add(c);
  return c;
}

function snapshot() {
  const q = questions[game.qIndex];
  return {
    phase: game.phase,
    qIndex: game.qIndex,
    total: questions.length,
    question: q ? q.text : null,
    emoji: q ? q.emoji : null,
    remaining: game.phase === 'question' ? Math.max(0, game.endsAt - Date.now()) : 0,
    duration: q ? durationOf(game.qIndex) : 0,
    votes: game.votes.size,
    players: [...players.values()].map((p) => ({ name: p.name, online: p.online > 0 })),
    result: game.phase === 'results' ? game.result : null,
    score: game.score,
    history: game.phase === 'final' ? game.history : [],
  };
}
const broadcast = () => io.emit('state', snapshot());

function startQuestion(i) {
  clearTimeout(timer);
  game.phase = 'question';
  game.qIndex = i;
  game.votes.clear();
  game.result = null;
  game.endsAt = Date.now() + durationOf(i);
  timer = setTimeout(reveal, durationOf(i) + 300);
  broadcast();
}

function reveal() {
  if (game.phase !== 'question') return;
  clearTimeout(timer);
  const voters = { megz: [], '3mora': [] };
  for (const [pid, choice] of game.votes) voters[choice].push(players.get(pid)?.name || '؟');
  const m = voters.megz.length;
  const a = voters['3mora'].length;
  const winner = m > a ? 'megz' : a > m ? '3mora' : 'tie';
  const loser = winner === 'megz' ? '3mora' : winner === '3mora' ? 'megz' : null;

  let comment;
  if (m + a === 0) comment = pickComment(comments.none);
  else if (winner === 'tie') comment = pickComment(comments.tie);
  else if (m + a >= 3 && Math.max(m, a) / (m + a) >= 0.8) comment = pickComment(comments.landslide);
  else comment = pickComment(comments[winner]);
  comment = comment.replace(/\{winner\}/g, NAMES[winner] || '').replace(/\{loser\}/g, NAMES[loser] || '');

  if (winner !== 'tie') game.score[winner]++;
  game.result = { megz: voters.megz, '3mora': voters['3mora'], winner, comment };
  game.history.push({ question: questions[game.qIndex].text, megz: m, '3mora': a, winner });
  game.phase = 'results';
  broadcast();
}

function next() {
  if (game.phase === 'question') return reveal();
  if (game.phase === 'final') return;
  if (game.qIndex + 1 < questions.length) return startQuestion(game.qIndex + 1);
  game.phase = 'final';
  broadcast();
}

function reset() {
  clearTimeout(timer);
  Object.assign(game, { phase: 'lobby', qIndex: -1, endsAt: 0, result: null, score: { megz: 0, '3mora': 0 }, history: [] });
  game.votes.clear();
  usedComments.clear();
  broadcast();
}

function allOnlineVoted() {
  const online = [...players.entries()].filter(([, p]) => p.online > 0).map(([id]) => id);
  return online.length > 0 && online.every((id) => game.votes.has(id));
}

// ---------------- Sockets ----------------
io.on('connection', (socket) => {
  socket.emit('state', snapshot());
  const reply = (ack, data) => typeof ack === 'function' && ack(data);

  socket.on('join', (data, ack) => {
    const id = data && data.id;
    if (typeof id !== 'string' || !id || id.length > 64) return reply(ack, { ok: false });
    const name = String((data && data.name) || '').trim().slice(0, 20);
    let p = players.get(id);
    if (!p) {
      if (!name) return reply(ack, { ok: false });
      p = { name, online: 0 };
      players.set(id, p);
    } else if (name) {
      p.name = name;
    }
    if (socket.data.playerId !== id) {
      socket.data.playerId = id;
      p.online++;
    }
    reply(ack, { ok: true, name: p.name, qIndex: game.qIndex, vote: game.votes.get(id) || null });
    broadcast();
  });

  socket.on('vote', (choice, ack) => {
    const id = socket.data.playerId;
    if (!id || !players.has(id) || game.phase !== 'question' || !(choice in NAMES)) return reply(ack, { ok: false });
    if (game.votes.has(id)) return reply(ack, { ok: true, vote: game.votes.get(id) });
    game.votes.set(id, choice);
    reply(ack, { ok: true, vote: choice });
    if (allOnlineVoted()) reveal();
    else broadcast();
  });

  socket.on('host:hello', (key, ack) => {
    socket.data.isHost = key === HOST_KEY;
    reply(ack, { ok: socket.data.isHost });
  });
  const hostOnly = (fn) => () => socket.data.isHost && fn();
  socket.on('host:next', hostOnly(next));
  socket.on('host:reveal', hostOnly(reveal));
  socket.on('host:reset', hostOnly(reset));
  socket.on('host:clearPlayers', hostOnly(() => {
    players.clear();
    for (const s of io.sockets.sockets.values()) s.data.playerId = null;
    io.emit('kicked');
    reset();
  }));

  socket.on('disconnect', () => {
    const p = players.get(socket.data.playerId);
    if (p) {
      p.online = Math.max(0, p.online - 1);
      broadcast();
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🎮 7X is running`);
  console.log(`   Host screen:  http://localhost:${PORT}/host?key=${HOST_KEY}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) console.log(`   On your Wi-Fi: http://${i.address}:${PORT}/host?key=${HOST_KEY}`);
    }
  }
});
