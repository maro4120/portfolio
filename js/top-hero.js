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
    // Monitor browser frame callbacks, at the display refresh rate.
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
  const fastSin = angle => {
    const position = angle * (4096 / tau);
    const index = Math.floor(position);
    const fraction = position - index;
    return sine[index & 4095] * (1 - fraction) + sine[(index + 1) & 4095] * fraction;
  };
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
  let particles = [], batches = [], width = 0, height = 0, progress = 0, targetProgress = 0;
  let frame = 0, last = 0, elapsed = 0, introTime = 0;
  let inView = true, paused = false, enabled = false;
  let pixelRatio = 0, headerHeight = 0, copyTop = 0, anchorCenterY = 0;
  let journeyTop = 0, scrollRange = 1;
  const clamp = value => Math.max(0, Math.min(1, value));
  // 11/25: finish anchor → waves → message within the first 62% of the scroll,
  // then hold the message still for the rest so it is read before SERVICE.
  const HOLD = .62;
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
    // Cache document geometry only on layout changes, never during scroll/tick.
    journeyTop = journey.getBoundingClientRect().top + window.scrollY;
    // Normalize against the actual shortened sticky travel (500px at 800px height).
    scrollRange = Math.max(1, journey.getBoundingClientRect().height - nextHeight);
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
    const contentBottom = copyTop;
    // Include rotation, 7px bobbing, the enlarged mobile particle radius.
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
    const count = (width < 960 ? 800 : 3100) / (debug.lowres ? 2 : 1);
    particles = [];
    while (particles.length < count) {
      const x = 10 + random() * 380, y = 20 + random() * 430;
      if (!mask.isPointInStroke(silhouette, x, y)) continue;
      const tone = random();
      particles.push({ ax: (x - 200) * scale, ay: (y - 230) * scale, u: random(), v: random(), phase: random() * Math.PI * 2,
        band: particles.length % 5, size: (2 + random() * 3) * (desktop ? 1 : 1.3),
        color: toneColors[tone > .985 ? 7 : Math.floor(tone * 7)] });
    }
    batches = palette.map((_, color) => particles.filter(p => p.color === color));
    updateScroll();
  }

  function updateScroll() {
    if (!enabled) return;
    targetProgress = clamp((window.scrollY - journeyTop) / scrollRange);
    if (paused) { progress = targetProgress; updateText(); }
    if (paused && inView && !document.hidden) draw();
    start();
  }

  function updateText() {
    // Timeline: anchor → waves → message; keep the message visible into SERVICE.
    // The normalized timeline adapts to the 1300px journey.
    const reveal = paused ? 1 : smooth(.55, 1.8, introTime);
    const introOpacity = reveal * (1 - smooth(HOLD * .195, HOLD * .435, progress));
    stage.style.setProperty('--intro-opacity', introOpacity);
    // Faded links must not intercept clicks or keyboard focus over the next scene.
    introCopy.inert = introOpacity < .05;
    stage.style.setProperty('--intro-y', `${(1 - reveal) * 14}px`);
    const message = smooth(HOLD * .54, HOLD * .675, progress);
    stage.style.setProperty('--message-opacity', message);
    stage.style.setProperty('--message-y', `${(1 - smooth(HOLD * .54, HOLD * .675, progress)) * 24}px`);
    stage.style.setProperty('--cue-opacity', 1 - smooth(HOLD * .075, HOLD * .27, progress));
    stage.style.setProperty('--progress', progress);
  }

  function draw() {
    if (debug.nodraw) return;
    ctx.clearRect(0, 0, width, height);
    const dissolve = smooth(HOLD * .24, HOLD * .645, progress);
    const desktop = width >= 960;
    const cx = width * .5;
    const cy = anchorCenterY;
    const angle = fastSin(elapsed * .32) * .055;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const bob = fastSin(elapsed * .42) * 7;
    const spreadScale = fastSin(dissolve * Math.PI) * 65;
    const sizeScale = mix(.8, desktop ? 1.3 : 1, dissolve) * (32 / 14);
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
        const size = p.size * sizeScale;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (!enabled || paused || !inView || document.hidden) { last = 0; return; }
    const delta = last ? Math.max(0, (now - last) / 1000) : 0;
    last = now;
    elapsed += delta; introTime += delta;
    // 0.1 at 60Hz; equal elapsed time gives equal pursuit at 60/120Hz.
    const follow = 1 - Math.pow(1 - .1, delta * 60);
    progress = mix(progress, targetProgress, follow);
    updateText();
    draw();
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (enabled && !paused && inView && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function syncMode() {
    stop(); enabled = !staticMode.matches;
    root.classList.toggle('enhanced', enabled);
    if (enabled) { resize(); progress = targetProgress; updateText(); draw(); start(); }
    else ctx.clearRect(0, 0, width, height);
  }
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
