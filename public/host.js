const socket = io();
const app = document.getElementById('app');
const key = new URLSearchParams(location.search).get('key') || '';

let state = null;
let authed = null; // null = checking
let renderedKey = '';

socket.on('connect', () => {
  socket.emit('host:hello', key, (res) => { authed = !!(res && res.ok); renderedKey = ''; render(); });
});
socket.on('state', (s) => { state = s; render(); });

const next = () => socket.emit('host:next');

// Presenter clickers send PageDown / ArrowRight; keyboard Space / Enter
document.addEventListener('keydown', (e) => {
  if (!authed) return;
  if ([' ', 'Enter', 'ArrowRight', 'ArrowLeft', 'PageDown'].includes(e.key)) { e.preventDefault(); next(); }
});

// ---------- views ----------
function topbar() {
  return `
    <div class="topbar">
      <div><span class="logo">7X</span>&nbsp; <span class="tagline" style="font-size:20px"><span class="megz">Megz</span> vs <span class="amora">3mora</span></span></div>
      ${state.phase !== 'lobby' ? scoreHTML(state.score) : '<span class="by">by 8X CRM</span>'}
    </div>`;
}

function viewLobby() {
  const joinUrl = location.origin + '/';
  return `
    <div class="lobby">
      <div class="qr-card">
        <img src="/qr.svg?url=${encodeURIComponent(joinUrl)}" alt="QR" />
        <div class="url">${esc(location.host)}</div>
        <div style="font-weight:700">📱 اعمل scan وادخل اسمك</div>
      </div>
      <div class="lobby-side">
        <div class="brand">
          <div class="logo">7X</div>
          <div class="tagline"><span class="megz">Megz</span> vs <span class="amora">3mora</span></div>
        </div>
        <div class="duel">${charHTML('megz', 'idle', 'big')}<div class="vs">VS</div>${charHTML('3mora', 'idle', 'big')}</div>
        <div class="count"><b id="pc">0</b> لاعب جاهز</div>
        <div class="chips" id="chips"></div>
        <div class="host-actions">
          <button class="btn" id="go">يلا نبدأ 🚀</button>
          <button class="btn ghost" id="clear">مسح اللاعبين</button>
        </div>
      </div>
    </div>`;
}

function viewQuestion() {
  return `
    ${topbar()}
    <div class="qnum">سؤال ${state.qIndex + 1} / ${state.total}</div>
    <h1 class="question">${esc(state.emoji)} ${esc(state.question)}</h1>
    <div class="timer"><div class="timer-num" data-timer="num"></div><div class="timer-bar"><span data-timer="bar"></span></div></div>
    <div class="duel" style="margin-top:12px">${charHTML('megz', 'idle', 'big')}<div class="vs">VS</div>${charHTML('3mora', 'idle', 'big')}</div>
    <div class="votes-live">🗳️ صوّت <b id="vc">0</b> من <b id="pc">0</b></div>
    <div class="host-actions float"><button class="btn ghost" id="go">اكشف النتيجة ⏩</button></div>`;
}

function viewResults() {
  const last = state.qIndex + 1 >= state.total;
  return `
    ${topbar()}
    <div class="qnum">سؤال ${state.qIndex + 1} / ${state.total}</div>
    <h2 class="question" style="font-size:clamp(22px,3vw,40px)">${esc(state.emoji)} ${esc(state.question)}</h2>
    ${resultsHTML(state.result)}
    <div class="host-actions float"><button class="btn" id="go">${last ? 'النتيجة النهائية 🏆' : 'السؤال الجاي ➡️'}</button></div>`;
}

function viewFinal() {
  const s = state.score;
  const champ = s.megz > s['3mora'] ? 'megz' : s['3mora'] > s.megz ? '3mora' : null;
  const loser = champ === 'megz' ? '3mora' : champ === '3mora' ? 'megz' : null;
  const history = state.history.map((h) => {
    const w = h.winner === 'tie' ? '<span class="muted">تعادل</span>'
      : `<span class="w-${CHARS[h.winner].cls}">${CHARS[h.winner].name}</span>`;
    return `<div><span>${esc(h.question)}</span>${w}</div>`;
  }).join('');
  return `
    ${topbar()}
    <div class="final-title">🏆 ${champ ? `${CHARS[champ].name} هو بطل 7X!` : 'تعادل! الاتنين أبطال 🤝'}</div>
    <div class="duel">
      ${champ
        ? `<div class="res-side win"><div class="crown">👑</div>${charHTML(champ, 'happy', 'big')}</div><div class="vs">VS</div>${charHTML(loser, 'sad')}`
        : `${charHTML('megz', 'happy', 'big')}<div class="vs">VS</div>${charHTML('3mora', 'happy', 'big')}`}
    </div>
    <div class="final-score"><span class="megz">${s.megz}</span><span class="muted">—</span><span class="amora">${s['3mora']}</span></div>
    <div class="history">${history}</div>
    <div class="host-actions float"><button class="btn" id="again">العب تاني 🔁</button></div>`;
}

// ---------- render ----------
function render() {
  if (!state || authed === null) return;
  if (!authed) {
    app.innerHTML = `<div class="card" style="margin:auto;text-align:center"><h2>🔒 الصفحة دي للهوست بس</h2><p class="muted">افتحيها كده: <b dir="ltr">/host?key=…</b></p></div>`;
    return;
  }
  const k = `${state.phase}${state.qIndex}`;
  if (k !== renderedKey) {
    renderedKey = k;
    app.innerHTML = { lobby: viewLobby, question: viewQuestion, results: viewResults, final: viewFinal }[state.phase]();
    bind();
    if (state.phase === 'results' && state.result.winner !== 'tie') confetti(70);
    if (state.phase === 'final') confetti(180);
  }

  if (state.phase === 'question') setTimer(state.remaining, state.duration);
  const online = state.players.filter((p) => p.online);
  const pc = document.getElementById('pc');
  if (pc) pc.textContent = online.length;
  const vc = document.getElementById('vc');
  if (vc) vc.textContent = state.votes;
  const chips = document.getElementById('chips');
  if (chips) chips.innerHTML = state.players.map((p) => `<span class="${p.online ? '' : 'off'}">${esc(p.name)}</span>`).join('');
}

function bind() {
  const go = document.getElementById('go');
  if (go) go.onclick = next;
  const again = document.getElementById('again');
  if (again) again.onclick = () => socket.emit('host:reset');
  const clear = document.getElementById('clear');
  if (clear) clear.onclick = () => { if (confirm('تمسحي كل اللاعبين؟')) socket.emit('host:clearPlayers'); };
}
