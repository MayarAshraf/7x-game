// ============ Shared helpers: characters, results view, timer, confetti ============

// Mouth/tear groups: .m-normal shows by default, .m-happy / .m-sad switch with the mood class
const MEGZ_SVG = `
<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- body: black shirt -->
  <path d="M20 230 C22 186 56 164 100 164 C144 164 178 186 180 230Z" fill="#15161c"/>
  <path d="M86 138 L86 168 L100 186 L114 168 L114 138Z" fill="#c98c66"/>
  <path d="M72 165 L100 188 L88 158Z" fill="#262832"/>
  <path d="M128 165 L100 188 L112 158Z" fill="#262832"/>
  <circle cx="100" cy="202" r="2.6" fill="#454856"/><circle cx="100" cy="220" r="2.6" fill="#454856"/>
  <g class="head">
    <!-- ears -->
    <ellipse cx="50" cy="98" rx="9" ry="14" fill="#d8996f"/>
    <ellipse cx="150" cy="98" rx="9" ry="14" fill="#d8996f"/>
    <!-- bald head -->
    <ellipse cx="100" cy="88" rx="51" ry="62" fill="#e8b08a"/>
    <ellipse cx="80" cy="42" rx="18" ry="8" fill="#fff" opacity=".55" transform="rotate(-22 80 42)"/>
    <ellipse cx="104" cy="34" rx="5" ry="3" fill="#fff" opacity=".45"/>
    <!-- full beard -->
    <path d="M50 94 C50 142 70 166 100 167 C130 166 150 142 150 94 C147 110 141 118 132 121 C122 117 112 117 100 121 C88 117 78 117 68 121 C59 118 53 110 50 94Z" fill="#2b1e18"/>
    <!-- eyebrows -->
    <path class="brow" d="M62 70 Q77 62 92 69" stroke="#2b1e18" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path class="brow" d="M108 69 Q123 62 138 70" stroke="#2b1e18" stroke-width="6" stroke-linecap="round" fill="none"/>
    <!-- eyes -->
    <g class="eyes">
      <ellipse cx="77" cy="89" rx="7.5" ry="7" fill="#fff"/><circle cx="78" cy="90" r="4" fill="#2b1e18"/>
      <ellipse cx="123" cy="89" rx="7.5" ry="7" fill="#fff"/><circle cx="124" cy="90" r="4" fill="#2b1e18"/>
    </g>
    <!-- black glasses -->
    <rect x="57" y="76" width="39" height="26" rx="6" fill="#9ad0ff" fill-opacity=".18" stroke="#0b0b0e" stroke-width="5.5"/>
    <rect x="104" y="76" width="39" height="26" rx="6" fill="#9ad0ff" fill-opacity=".18" stroke="#0b0b0e" stroke-width="5.5"/>
    <path d="M96 86 Q100 82 104 86" stroke="#0b0b0e" stroke-width="4" fill="none"/>
    <path d="M57 84 L46 88 M143 84 L154 88" stroke="#0b0b0e" stroke-width="4"/>
    <!-- nose -->
    <path d="M100 98 Q93 112 97 116 Q102 119 107 115" stroke="#bf7f5b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <!-- mouths -->
    <path class="m-normal" d="M85 134 Q100 145 115 134 Q100 140 85 134Z" fill="#c9786a"/>
    <g class="m-happy"><path d="M82 130 Q100 160 118 130Z" fill="#5b1616"/><path d="M85 131 L115 131 L113 137 L87 137Z" fill="#fff"/></g>
    <g class="m-sad"><path d="M86 145 Q100 132 114 145" stroke="#c9786a" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M70 104 Q65 114 70 118 Q75 114 70 104Z" fill="#7fd0ff"/></g>
  </g>
</svg>`;

const AMORA_SVG = `
<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- neck -->
  <path d="M87 140 L87 172 Q100 180 113 172 L113 140Z" fill="#b97a54"/>
  <!-- body: grey blazer + white tee -->
  <path d="M22 230 C24 188 58 168 100 168 C142 168 176 188 178 230Z" fill="#41454f"/>
  <path d="M80 168 Q100 182 120 168 L117 230 L83 230Z" fill="#f4f4f6"/>
  <path d="M80 168 L65 181 L76 194 L67 202 L83 230 L86 230 L84 198Z" fill="#30333b"/>
  <path d="M120 168 L135 181 L124 194 L133 202 L117 230 L114 230 L116 198Z" fill="#30333b"/>
  <circle cx="140" cy="206" r="6.5" fill="#15171c" stroke="#d7deee" stroke-width="1.6"/>
  <path d="M137 206 A3 3 0 1 1 140 209" stroke="#d7deee" stroke-width="1.4" fill="none"/>
  <g class="head">
    <!-- ears -->
    <ellipse cx="54" cy="98" rx="8.5" ry="13" fill="#bf7e57"/>
    <ellipse cx="146" cy="98" rx="8.5" ry="13" fill="#bf7e57"/>
    <!-- face -->
    <ellipse cx="100" cy="92" rx="46" ry="60" fill="#d0916a"/>
    <!-- short hair -->
    <path d="M54 86 C49 44 72 26 100 26 C128 26 151 44 146 86 C142 66 133 56 122 53 C110 49 90 49 78 53 C67 56 58 66 54 86Z" fill="#1d1511"/>
    <path d="M54 80 L60 78 L60 102 L56 102Z M146 80 L140 78 L140 102 L144 102Z" fill="#1d1511"/>
    <!-- eyebrows (serious) -->
    <path class="brow" d="M66 75 L92 72" stroke="#1d1511" stroke-width="6" stroke-linecap="round"/>
    <path class="brow" d="M108 72 L134 75" stroke="#1d1511" stroke-width="6" stroke-linecap="round"/>
    <!-- eyes -->
    <g class="eyes">
      <ellipse cx="80" cy="90" rx="7" ry="5.8" fill="#fff"/><circle cx="80" cy="90.5" r="3.8" fill="#2a1a12"/>
      <ellipse cx="120" cy="90" rx="7" ry="5.8" fill="#fff"/><circle cx="120" cy="90.5" r="3.8" fill="#2a1a12"/>
    </g>
    <path d="M73 99 Q80 101 87 99 M113 99 Q120 101 127 99" stroke="#b07250" stroke-width="1.6" fill="none"/>
    <!-- nose -->
    <path d="M100 92 L95 114 Q100 118 106 114" stroke="#a86a46" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- mustache + goatee -->
    <path d="M80 125 Q90 117 100 120 Q110 117 120 125 Q110 126 100 124 Q90 126 80 125Z" fill="#1d1511"/>
    <path d="M81 125 Q82 137 90 146 M119 125 Q118 137 110 146" stroke="#1d1511" stroke-width="3.5" fill="none"/>
    <path d="M87 142 Q100 138 113 142 Q113 157 100 159 Q87 157 87 142Z" fill="#1d1511"/>
    <!-- mouths -->
    <path class="m-normal" d="M90 132 L110 132" stroke="#8a4a36" stroke-width="3.5" stroke-linecap="round"/>
    <g class="m-happy"><path d="M86 129 Q100 148 114 129Z" fill="#5b1616"/><path d="M88 129.5 L112 129.5 L110 134 L90 134Z" fill="#fff"/></g>
    <g class="m-sad"><path d="M89 137 Q100 128 111 137" stroke="#8a4a36" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M74 100 Q69 110 74 114 Q79 110 74 100Z" fill="#7fd0ff"/></g>
  </g>
</svg>`;

const CHARS = {
  megz: { name: 'Megz', cls: 'megz', svg: MEGZ_SVG },
  '3mora': { name: '3mora', cls: 'amora', svg: AMORA_SVG },
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function charHTML(who, mood = 'idle', extra = '') {
  const c = CHARS[who];
  return `<div class="char ${c.cls} ${mood} ${extra}"><div class="char-art">${c.svg}</div><div class="char-name">${c.name}</div></div>`;
}

function resultsHTML(r, { names = true } = {}) {
  const m = r.megz.length;
  const a = r['3mora'].length;
  const total = m + a || 1;
  const mood = (who) => (r.winner === 'tie' ? 'happy' : r.winner === who ? 'happy' : 'sad');
  const side = (who, list) => {
    const pct = Math.round((list.length / total) * 100);
    return `
      <div class="res-side ${CHARS[who].cls} ${r.winner === who ? 'win' : ''}">
        ${r.winner === who ? '<div class="crown">👑</div>' : ''}
        ${charHTML(who, mood(who))}
        <div class="pct">${pct}%</div>
        <div class="bar"><span style="--w:${pct}%"></span></div>
        <div class="cnt">${list.length} صوت</div>
        ${names ? `<div class="names">${list.map((n) => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
      </div>`;
  };
  return `
    <div class="res">${side('megz', r.megz)}<div class="vs">VS</div>${side('3mora', r['3mora'])}</div>
    <div class="bubble">${esc(r.comment)}</div>`;
}

function scoreHTML(score) {
  return `<div class="score"><span class="megz">Megz ${score.megz}</span><b>:</b><span class="amora">${score['3mora']} 3mora</span></div>`;
}

// ---- Countdown: any element with data-timer="num" | "bar" updates itself ----
const Timer = { end: 0, dur: 1 };
function setTimer(remaining, duration) {
  Timer.end = Date.now() + remaining;
  Timer.dur = duration || 1;
}
(function tick() {
  const left = Math.max(0, Timer.end - Date.now());
  document.querySelectorAll('[data-timer]').forEach((el) => {
    if (el.dataset.timer === 'bar') el.style.transform = `scaleX(${left / Timer.dur})`;
    else el.textContent = Math.ceil(left / 1000);
    el.classList.toggle('hurry', left < 5000);
  });
  requestAnimationFrame(tick);
})();

// ---- Confetti ----
function confetti(count = 90) {
  const colors = ['#2f6bff', '#5aa2ff', '#a855f7', '#ffffff', '#ffd23f'];
  for (let i = 0; i < count; i++) {
    const d = document.createElement('i');
    d.className = 'confetti';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.background = colors[i % colors.length];
    d.style.animationDuration = 2.2 + Math.random() * 2 + 's';
    d.style.animationDelay = Math.random() * 0.6 + 's';
    d.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  }
}

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
