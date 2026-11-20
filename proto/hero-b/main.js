(() => {
  'use strict';
  const root = document.documentElement;
  const journey = document.querySelector('.journey');
  const stage = document.querySelector('.stage');
  const canvas = document.querySelector('.particles');
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof Path2D === 'undefined') return;

  // Short viewports use the same readable layout as reduced-motion mode.
  const staticMode = matchMedia('(prefers-reduced-motion: reduce), (max-height: 639px)');
  const toggle = document.querySelector('.motion-toggle');
  const menu = document.querySelector('.menu');
  const palette = ['#16324f', '#16324f', '#0a1d33', '#12776b', '#12776b', '#2bb3a3', '#2bb3a3', '#bb9238'];
  const silhouette = new Path2D();
  silhouette.arc(200, 76, 40, 0, Math.PI * 2);
  silhouette.moveTo(200, 116); silhouette.lineTo(200, 409);
  silhouette.moveTo(120, 170); silhouette.lineTo(280, 170);
  silhouette.moveTo(55, 280); silhouette.bezierCurveTo(55, 365, 117, 406, 200, 425);
  silhouette.bezierCurveTo(283, 406, 345, 365, 345, 280);
  silhouette.moveTo(28, 312); silhouette.lineTo(55, 277); silhouette.lineTo(89, 309);
  silhouette.moveTo(311, 309); silhouette.lineTo(345, 277); silhouette.lineTo(372, 312);
  const mask = document.createElement('canvas').getContext('2d');
  if (!mask) return;
  mask.lineWidth = 30; mask.lineCap = 'round'; mask.lineJoin = 'round';
  let particles = [], batches = [], width = 0, height = 0, progress = 0;
  let frame = 0, last = 0, elapsed = 0, introTime = 0;
  let inView = true, paused = false, enabled = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (start, end, value) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;

  function resize() {
    width = stage.clientWidth; height = stage.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, width < 960 ? 1.5 : 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Fixed seed preserves particle identity on resize and backward scrolling.
    let seed = 731;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const count = width < 600 ? 2400 : width < 960 ? 3600 : 6200;
    particles = [];
    while (particles.length < count) {
      const x = 10 + random() * 380, y = 20 + random() * 430;
      if (!mask.isPointInStroke(silhouette, x, y)) continue;
      const tone = random();
      particles.push({ x, y, u: random(), v: random(), phase: random() * Math.PI * 2,
        band: particles.length % 5, size: 1.4 + random() * 2.1, alpha: .72 + random() * .28,
        color: tone > .985 ? 7 : Math.floor(tone * 7) });
    }
    batches = palette.map((_, color) => particles.filter(p => p.color === color));
    updateScroll();
  }

  function updateScroll() {
    if (!enabled) return;
    const bounds = journey.getBoundingClientRect();
    progress = clamp(-bounds.top / Math.max(1, journey.offsetHeight - height));
    updateText();
    if (paused && inView && !document.hidden) draw();
    start();
  }

  function updateText() {
    // Timeline: anchor 0–16%, release 16–43%, message 39–70%, arch 73–94%.
    const reveal = paused ? 1 : smooth(.55, 1.8, introTime);
    stage.style.setProperty('--intro-opacity', reveal * (1 - smooth(.13, .29, progress)));
    stage.style.setProperty('--intro-y', `${(1 - reveal) * 14}px`);
    const message = smooth(.36, .45, progress) * (1 - smooth(.66, .76, progress));
    stage.style.setProperty('--message-opacity', message);
    stage.style.setProperty('--message-y', `${(1 - smooth(.36, .45, progress)) * 24}px`);
    stage.style.setProperty('--arch-y', `${(1 - smooth(.73, .94, progress)) * 120}%`);
    stage.style.setProperty('--cue-opacity', 1 - smooth(.05, .18, progress));
    stage.style.setProperty('--progress', progress);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const dissolve = smooth(.16, .43, progress);
    const fade = 1 - smooth(.80, .97, progress);
    if (fade <= 0) return;
    const desktop = width >= 960;
    const scale = desktop ? Math.min(width * .0012, height * .00155, 1.65) : Math.min(width * .00195, height * .00115);
    const cx = width * (desktop ? .72 : .5);
    const cy = height * (desktop ? .45 : .335);
    const angle = Math.sin(elapsed * .32) * .055;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Batch by color, avoiding per-particle fillStyle changes.
    for (let color = 0; color < palette.length; color++) {
      ctx.fillStyle = palette[color];
      for (const p of batches[color]) {
        const ax = (p.x - 200) * scale, ay = (p.y - 230) * scale;
        const anchorX = cx + ax * cos - ay * sin + Math.sin(elapsed * .6 + p.phase) * 1.2;
        const anchorY = cy + ax * sin + ay * cos + Math.sin(elapsed * .42) * 7;
        // Five distinct ribbons: shared curves keep particles in coherent bands.
        // Wrap beyond both edges so horizontal travel has no visible seam.
        const travel = (p.u + elapsed * (.025 + p.band * .003)) % 1;
        const waveX = travel * (width + 160) - 80;
        const ribbon = Math.sin(travel * Math.PI * 2 + elapsed * .24 + p.band * .72);
        const curl = Math.sin(travel * Math.PI * 4 - elapsed * .18 + p.band) * .035;
        const waveY = height * (.08 + p.band * .205 + ribbon * .13 + curl)
          + (p.v - .5) * height * .105;
        const spread = Math.sin(dissolve * Math.PI) * Math.sin(p.phase + elapsed * .2) * 65;
        const x = mix(anchorX, waveX, dissolve) + spread;
        const y = mix(anchorY, waveY, dissolve);
        ctx.globalAlpha = p.alpha * fade;
        ctx.beginPath(); ctx.arc(x, y, p.size * mix(.8, desktop ? 1.3 : 1, dissolve), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (!enabled || paused || !inView || document.hidden) { last = 0; return; }
    if (!last || now - last >= 1000 / 30) {
      const delta = last ? Math.min((now - last) / 1000, .08) : 0;
      elapsed += delta; introTime += delta; last = now;
      updateText(); draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (enabled && !paused && inView && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function syncMode() {
    stop(); enabled = !staticMode.matches;
    root.classList.toggle('enhanced', enabled);
    if (enabled) { resize(); draw(); start(); }
    else ctx.clearRect(0, 0, width, height);
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    root.classList.toggle('paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '動きを再開する' : '動きを止める';
    if (paused) { stop(); updateText(); draw(); } else start();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', () => { if (enabled) resize(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('offscreen', document.hidden || !inView);
    if (document.hidden) stop(); else start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      root.classList.toggle('offscreen', !inView || document.hidden);
      if (inView) { updateScroll(); start(); } else stop();
    }).observe(stage);
  }
  staticMode.addEventListener('change', syncMode);
  syncMode();
})();
