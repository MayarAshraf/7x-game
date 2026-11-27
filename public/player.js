const socket = io();
const app = document.getElementById('app');

let pid = store.get('7x-id');
if (!pid) {
  pid = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  store.set('7x-id', pid);
}

let state = null;
let me = null; // { name }
let myVote = { q: -1, choice: null };
let renderedKey = '';

// ---------- socket ----------
socket.on('connect', () => {
  const saved = store.get('7x-name');
  if (saved) join(saved);
});
socket.on('state', (s) => { state = s; render(); });
socket.on('kicked', () => { me = null; store.set('7x-name', ''); render(); });

function join(name) {
  socket.emit('join', { id: pid, name }, (res) => {
    if (!res || !res.ok) { me = null; return render(); }
    me = { name: res.name };
    store.set('7x-name', res.name);
    if (res.vote) myVote = { q: res.qIndex, choice: res.vote };
    render();
  });
}

function vote(choice) {
  const q = state.qIndex;
  if (navigator.vibrate) navigator.vibrate(40);
  Sound.play('vote');
  socket.emit('vote', choice, (res) => {
    if (res && res.ok) { myVote = { q, choice: res.vote }; render(); }
  });
}

// ---------- views ----------
const brand = `
  <div class="brand">
    <div class="logo">7X</div>
    <div class="tagline"><span class="megz">Megz</span> vs <span class="amora">3mora</span></div>
  </div>`;

function viewJoin() {
  return `
    ${brand}
    <div class="duel">${charHTML('megz', 'idle')}<div class="vs">VS</div>${charHTML('3mora', 'idle')}</div>
    <form class="join-form" id="joinForm">
      <input id="name" maxlength="20" placeholder="اكتب اسمك 👇" autocomplete="off" required />
      <button class="btn" type="submit">يلا ادخل 🎮</button>
    </form>
    <div class="by">by 8X CRM</div>`;
}

function viewLobby() {
  return `
    ${brand}
    <div class="big-emoji">👋</div>
    <h2 style="margin:0">أهلاً ${esc(me.name)}!</h2>
    <p class="muted" style="margin:0">إنت جوه 🎉 بص على الشاشة الكبيرة<br>واستنى اللعبة تبدأ…</p>
    <div class="duel">${charHTML('megz', 'idle small')}<div class="vs">VS</div>${charHTML('3mora', 'idle small')}</div>
    <p class="muted"><b id="pc"></b> لاعب في الأوضة</p>`;
}

function viewQuestion() {
  return `
    <div class="qnum">سؤال ${state.qIndex + 1} / ${state.total}</div>
    <div class="timer"><div class="timer-num" data-timer="num"></div><div class="timer-bar"><span data-timer="bar"></span></div></div>
    <h1 class="question">${esc(state.emoji)} ${esc(state.question)}</h1>
    <div class="vote-btns">
      <button class="vote-btn megz" data-vote="megz">${charHTML('megz', 'idle')}</button>
      <button class="vote-btn amora" data-vote="3mora">${charHTML('3mora', 'idle')}</button>
    </div>`;
}

function viewVoted() {
  return `
    <div class="qnum">سؤال ${state.qIndex + 1} / ${state.total}</div>
    <div class="timer"><div class="timer-num" data-timer="num"></div><div class="timer-bar"><span data-timer="bar"></span></div></div>
    <h2 style="margin:0">صوتك راح لـ</h2>
    ${charHTML(myVote.choice, 'happy', 'big')}
    <p class="muted">✅ اتسجل! استنى النتيجة… <br><b id="vc"></b> من <b id="pc"></b> صوّتوا</p>`;
}

function viewResults() {
  const r = state.result;
  const voted = myVote.q === state.qIndex ? myVote.choice : null;
  let line = 'ما لحقتش تصوّت 😴';
  if (voted) {
    const withMajority = r.winner === 'tie' || r.winner === voted;
    line = `إنت صوّت لـ <b>${CHARS[voted].name}</b> — ${withMajority ? 'مع الأغلبية 😎' : 'ضد التيار… جريء 🫡'}`;
  }
  return `
    <div class="qnum">سؤال ${state.qIndex + 1} / ${state.total}</div>
    <h2 class="question">${esc(state.question)}</h2>
    ${resultsHTML(r, { names: false })}
    <p class="my-vote">${line}</p>`;
}

function viewFinal() {
  const s = state.score;
  const champ = s.megz > s['3mora'] ? 'megz' : s['3mora'] > s.megz ? '3mora' : null;
  return `
    ${brand}
    <h1 style="margin:0">🏆 النتيجة النهائية</h1>
    ${champ
      ? `<div class="res-side win" style="flex:0"><div class="crown">👑</div>${charHTML(champ, "happy", "big")}</div><h2>${CHARS[champ].name} هو البطل!</h2>`
      : `<div class="duel">${charHTML('megz', 'happy')}${charHTML('3mora', 'happy')}</div><h2>تعادل! الاتنين أبطال 🤝</h2>`}
    ${scoreHTML(s)}
    <p class="muted">شكرًا إنك لعبت 💙</p>`;
}

// ---------- render ----------
function render() {
  if (!state) return;
  let key;
  if (!me) key = 'join';
  else if (state.phase === 'question') key = `q${state.qIndex}${myVote.q === state.qIndex ? 'v' : ''}`;
  else key = `${state.phase}${state.qIndex}`;

  if (key !== renderedKey) {
    renderedKey = key;
    if (!me) app.innerHTML = viewJoin();
    else if (state.phase === 'lobby') app.innerHTML = viewLobby();
    else if (state.phase === 'question') app.innerHTML = myVote.q === state.qIndex ? viewVoted() : viewQuestion();
    else if (state.phase === 'results') app.innerHTML = viewResults();
    else app.innerHTML = viewFinal();
    bind();
    if (me && state.phase === 'final') confetti(60);
  }

  // live bits
  if (state.phase === 'question') setTimer(state.remaining, state.duration);
  const pc = document.getElementById('pc');
  if (pc) pc.textContent = state.players.filter((p) => p.online).length;
  const vc = document.getElementById('vc');
  if (vc) vc.textContent = state.votes;
}

function bind() {
  const form = document.getElementById('joinForm');
  if (form) {
    const input = document.getElementById('name');
    input.value = store.get('7x-name') || '';
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (name) join(name);
    };
  }
  document.querySelectorAll('[data-vote]').forEach((b) => (b.onclick = () => vote(b.dataset.vote)));
}
