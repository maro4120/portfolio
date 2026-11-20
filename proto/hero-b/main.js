(() => {
  'use strict';
  const root = document.documentElement;
  // Presence-only query switches; no query leaves the original rendering path intact.
  const params = new URLSearchParams(window.location.search);
  const debug = Object.fromEntries(['fps', 'nofx', 'lowres', 'nodraw', 'nosticky', 'noresize']
    .map(name => [name, params.has(name)]));
  if (debug.nofx) root.classList.add('debug-nofx');
  if (debug.nosticky) root.classList.add('debug-nosticky');
  let resizeCalls = 0, measured = false;
  if (debug.fps) {
    const meter = document.createElement('div');
    meter.className = 'debug-meter';
    meter.textContent = 'fps: — | ≥50ms: — | resize: 0';
    document.body.append(meter);
    // Monitor browser frame callbacks, independently of the 30fps particle cap.
    let samples = [], previous = 0, lastReport = 0;
    function measureFrame(now) {
      if (previous) samples.push({ time: now, slow: now - previous >= 50 });
      previous = now;
      while (samples.length && samples[0].time <= now - 1000) samples.shift();
      if (now - lastReport >= 250) {
        meter.textContent = `fps: ${samples.length} | ≥50ms: ${samples.filter(sample => sample.slow).length} | resize: ${resizeCalls}`;
        lastReport = now;
      }
      requestAnimationFrame(measureFrame);
    }
    document.addEventListener('visibilitychange', () => {
      samples = []; previous = 0; lastReport = 0;
    });
    requestAnimationFrame(measureFrame);
  }
  const journey = document.querySelector('.journey');
  const stage = document.querySelector('.stage');
  const header = document.querySelector('.header');
  const introCopy = document.querySelector('.intro-copy');
  const canvas = document.querySelector('.particles');
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof Path2D === 'undefined') return;

  // Short viewports use the same readable layout as reduced-motion mode.
  const staticMode = matchMedia('(prefers-reduced-motion: reduce), (max-height: 639px)');
  const toggle = document.querySelector('.motion-toggle');
  const menu = document.querySelector('.menu');
  const palette = ['#16324f', '#0a1d33', '#12776b', '#2bb3a3', '#bb9238'];
  const toneColors = [0, 0, 1, 2, 2, 3, 3, 4];
  // One cached, translucent circle per actual color; no paths in the draw loop.
  const sprites = palette.map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const brush = sprite.getContext('2d');
    brush.fillStyle = color;
    brush.globalAlpha = .86;
    brush.beginPath(); brush.arc(16, 16, 14, 0, Math.PI * 2); brush.fill();
    return sprite;
  });
  const tau = Math.PI * 2;
  const sine = new Float32Array(4096);
  for (let i = 0; i < sine.length; i++) sine[i] = Math.sin(i * tau / sine.length);
  const fastSin = angle => sine[Math.round(angle * (4096 / tau)) & 4095];
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
  let inView = true, paused = false, enabled = false, textDirty = true;
  let pixelRatio = 0, headerHeight = 0, copyTop = 0, anchorCenterY = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (start, end, value) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;

  function resize() {
    resizeCalls++;
    if (debug.noresize && measured) { updateScroll(); return; }
    measured = true;
    const nextWidth = stage.clientWidth, nextHeight = stage.clientHeight;
    const nextHeaderHeight = header.getBoundingClientRect().height;
    stage.style.setProperty('--content-top', `${nextHeaderHeight + 16}px`);
    // Layout position excludes the intro's animated translateY.
    const nextCopyTop = introCopy.offsetTop;
    const dpr = debug.lowres ? 1 : Math.min(window.devicePixelRatio || 1, nextWidth < 960 ? 1.5 : 2);
    // iPhone browser chrome can resize the window without changing the svh stage.
    if (width === nextWidth && height === nextHeight && pixelRatio === dpr && headerHeight === nextHeaderHeight && copyTop === nextCopyTop) {
      updateScroll();
      return;
    }
    width = nextWidth; height = nextHeight; pixelRatio = dpr;
    headerHeight = nextHeaderHeight;
    copyTop = nextCopyTop;
    const desktop = width >= 960;
    const contentTop = headerHeight + 16;
    const contentBottom = desktop ? height - 145 : copyTop;
    // Include rotation, 7px bobbing, particle radius and pixel rounding.
    const verticalExtent = 220 + 190 * Math.sin(.055);
    const preferredScale = desktop ? Math.min(width * .0012, height * .00155, 1.65) : Math.min(width * .00195, height * .00115);
    const availableHeight = Math.max(0, contentBottom - contentTop);
    const scale = Math.min(preferredScale, Math.max(0, (availableHeight * (desktop ? 1 : .9) - 26) / (2 * verticalExtent)));
    const halfHeight = verticalExtent * scale + 13;
    anchorCenterY = Math.max(contentTop + halfHeight,
      Math.min(height * (desktop ? .45 : .335), contentBottom - halfHeight));
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Fixed seed preserves particle identity on resize and backward scrolling.
    let seed = 731;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const count = (width < 600 ? 1200 : width < 960 ? 1800 : 3100) / (debug.lowres ? 2 : 1);
    particles = [];
    while (particles.length < count) {
      const x = 10 + random() * 380, y = 20 + random() * 430;
      if (!mask.isPointInStroke(silhouette, x, y)) continue;
      const tone = random();
      particles.push({ ax: (x - 200) * scale, ay: (y - 230) * scale, u: random(), v: random(), phase: random() * Math.PI * 2,
        band: particles.length % 5, size: 2 + random() * 3,
        color: toneColors[tone > .985 ? 7 : Math.floor(tone * 7)] });
    }
    batches = palette.map((_, color) => particles.filter(p => p.color === color));
    updateScroll();
  }

  function updateScroll() {
    if (!enabled) return;
    const bounds = journey.getBoundingClientRect();
    progress = clamp(-bounds.top / Math.max(1, journey.offsetHeight - height));
    textDirty = true;
    if (paused) updateText();
    if (paused && inView && !document.hidden) draw();
    start();
  }

  function updateText() {
    textDirty = false;
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
    if (debug.nodraw) return;
    ctx.clearRect(0, 0, width, height);
    const dissolve = smooth(.16, .43, progress);
    const fade = 1 - smooth(.80, .97, progress);
    if (fade <= 0) return;
    const desktop = width >= 960;
    const cx = width * (desktop ? .72 : .5);
    const cy = anchorCenterY;
    const angle = fastSin(elapsed * .32) * .055;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const bob = fastSin(elapsed * .42) * 7;
    const spreadScale = fastSin(dissolve * Math.PI) * 65;
    const sizeScale = mix(.8, desktop ? 1.3 : 1, dissolve) * (32 / 14);
    ctx.globalAlpha = fade;
    for (let color = 0; color < palette.length; color++) {
      const sprite = sprites[color];
      const batch = batches[color];
      for (let i = 0; i < batch.length; i++) {
        const p = batch[i];
        const anchorX = cx + p.ax * cos - p.ay * sin + fastSin(elapsed * .6 + p.phase) * 1.2;
        const anchorY = cy + p.ax * sin + p.ay * cos + bob;
        let x = anchorX, y = anchorY;
        // The intact anchor does not need ribbon or spread calculations.
        if (dissolve > 0) {
          const travel = (p.u + elapsed * (.025 + p.band * .003)) % 1;
          const waveX = travel * (width + 160) - 80;
          const ribbon = fastSin(travel * tau + elapsed * .24 + p.band * .72);
          const curl = fastSin(travel * tau * 2 - elapsed * .18 + p.band) * .035;
          const waveY = height * (.08 + p.band * .205 + ribbon * .13 + curl)
            + (p.v - .5) * height * .105;
          x = mix(anchorX, waveX, dissolve) + spreadScale * fastSin(p.phase + elapsed * .2);
          y = mix(anchorY, waveY, dissolve);
        }
        const size = Math.round(p.size * sizeScale);
        ctx.drawImage(sprite, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
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
      if (textDirty || introTime - delta < 1.8) updateText();
      draw();
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
  if ('ResizeObserver' in window) {
    const layoutObserver = new ResizeObserver(() => { if (enabled) resize(); });
    layoutObserver.observe(header);
    layoutObserver.observe(introCopy);
  }
  staticMode.addEventListener('change', syncMode);
  syncMode();
})();
