(() => {
'use strict';
  var worksEl = document.getElementById("js-works");

  if (worksEl && typeof Swiper !== "undefined") {
    var worksSwiper = new Swiper(worksEl, {
      slidesPerView: 1.1,
      spaceBetween: 16,
      // 端まで来たら止める（無限ループにしない）
      loop: false,
      // 枚数が表示数以下のときは操作を無効にする
      watchOverflow: true,
      // 横ホイールだけで動かし、縦方向はページのスクロールに任せる
      mousewheel: {
        forceToAxis: true
      },
      a11y: {
        prevSlideMessage: "前の実績",
        nextSlideMessage: "次の実績"
      },
      navigation: {
        prevEl: "#js-works-prev",
        nextEl: "#js-works-next"
      },
      pagination: {
        el: "#js-works-pagination",
        clickable: true
      },
      breakpoints: {
        600: { slidesPerView: 2, spaceBetween: 20 },
        960: { slidesPerView: 3, spaceBetween: 24 }
      }
    });

    // Swiper の CSS は表示を止めないように後から読み込むので、
    // 読み込み終わった時点で幅を計算し直す
    window.addEventListener("load", function () {
      worksSwiper.update();
    });

    // 動くと分かってから矢印とドットを出す
    var ctrl = document.getElementById("js-works-ctrl");
    if (ctrl) ctrl.hidden = false;
  }


// Content stays readable unless the observer is successfully installed.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const still = () => motionPreference.matches || document.documentElement.classList.contains('paused');
const bubbleColors = ['#16324f', '#0a1d33', '#12776b', '#2bb3a3', '#bb9238'];
const bubbleTones = [0, 0, 1, 2, 2, 3, 3, 4];
function bubbleColor() {
  const tone = Math.random();
  return bubbleColors[bubbleTones[tone > .985 ? 7 : Math.floor(tone * 7)]];
}
const headingStreams = new Map();
function stopHeadingBubbles(state) {
  clearTimeout(state.timer);
  state.timer = null;
  for (const animation of state.flights) animation.cancel();
  state.flights.clear();
  state.layer?.remove();
  state.layer = null;
}
function canBubble(state) {
  return state.inView && !still() && !document.hidden;
}
function headingBurst(target, state) {
  if (!canBubble(state)) return;
  const line = target.querySelector('.sec-ttl__en') || (target.matches('.contact__en') ? target : null);
  if (!line) return;
  // Measure the text again for each bubble, including after viewport changes.
  const range = document.createRange();
  range.selectNodeContents(line);
  const text = range.getBoundingClientRect();
  const bounds = target.getBoundingClientRect();
  const room = text.left - 6;
  if (room >= 4 && state.flights.size < 5) {
    if (!state.layer) {
      state.layer = document.createElement('span');
      state.layer.className = 'heading-bubbles';
      state.layer.setAttribute('aria-hidden', 'true');
      target.append(state.layer);
    }
    const layer = state.layer;
    const bubble = document.createElement('span');
    const size = Math.min(4 + Math.random() * 8, room);
    const sway = Math.min(3, Math.max(0, (room - size) / 2));
    // Reserve the full diameter and sway on both sides, with a gap before text.
    const right = text.left - 4 - size - sway;
    const left = 2 + sway;
    const x = Math.max(left, right - Math.random() * 12);
    const y = text.bottom - bounds.top - size / 2 - Math.random() * 6;
    const rise = 20 + Math.random() * 30;
    bubble.className = 'heading-bubble';
    bubble.style.cssText = `--size:${size}px;--bubble-color:${bubbleColor()};left:${x - bounds.left}px;top:${y}px`;
    layer.append(bubble);
    const animation = bubble.animate([
      { opacity: 0, transform: 'translate(0, 0) scale(.2)', offset: 0 },
      { opacity: .5, transform: `translate(${-sway}px, ${-rise * .18}px) scale(1)`, offset: .2 },
      { opacity: .5, transform: `translate(${sway}px, ${-rise * .55}px) scale(.8)`, offset: .55 },
      { opacity: 0, transform: `translate(0, ${-rise}px) scale(.15)`, offset: 1 }
    ], { duration: 800 + Math.random() * 400, easing: 'ease-in-out', fill: 'both' });
    state.flights.add(animation);
    animation.onfinish = () => {
      state.flights.delete(animation);
      bubble.remove();
    };
  }
  state.timer = setTimeout(() => headingBurst(target, state), 250 + Math.random() * 200);
}
function syncHeadingBubbles() {
  for (const [target, state] of headingStreams) {
    if (!canBubble(state)) {
      stopHeadingBubbles(state);
    } else if (state.timer === null) {
      // Let the heading's entrance finish before the first bubble rises.
      const style = getComputedStyle(target);
      const durations = style.transitionDuration.split(',').map(value => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000));
      const delays = style.transitionDelay.split(',').map(value => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000));
      const wait = Math.max(0, ...durations.map((duration, i) => duration + delays[i % delays.length]));
      state.timer = setTimeout(() => headingBurst(target, state), wait);
    }
  }
}
function reveal(target) {
  if (target.classList.contains('is-visible')) return;
  target.classList.add('is-visible');
}
motionPreference.addEventListener('change', syncHeadingBubbles);
new MutationObserver(syncHeadingBubbles)
  .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
document.addEventListener('visibilitychange', syncHeadingBubbles);
window.addEventListener('resize', () => {
  for (const state of headingStreams.values()) stopHeadingBubbles(state);
  syncHeadingBubbles();
});
// Keep observing headings after their one-time entrance, even in reduced motion.
if ('IntersectionObserver' in window) {
  const headingObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      headingStreams.get(entry.target).inView = entry.isIntersecting;
    });
    syncHeadingBubbles();
  });
  document.querySelectorAll('.section .sec-ttl, .contact__en').forEach(target => {
    headingStreams.set(target, { inView: false, timer: null, layer: null, flights: new Set() });
    headingObserver.observe(target);
  });
}

if ('IntersectionObserver' in window && !motionPreference.matches) {
  const targets = document.querySelectorAll([
    '.section .sec-ttl', '.section .sec-lead', '.card', '.evidence',
    '.portrait', '.about-grid > div > *', '.work', '.plans__campaign',
    '.plan', '.freebox', '#price .note', '.flow__item', '.faq__item',
    '.agency__box', '.agency__note', '.contact__intro > *',
    '.cform__row', '.cform__privacy', '.cform__submit'
  ].join(', '));
  const waves = document.querySelectorAll('.section-wave');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.target.classList.contains('section-wave')) {
      entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    } else if (entry.isIntersecting) {
      reveal(entry.target);
      observer.unobserve(entry.target);
    }
  }), { threshold: .08 });

  // Stagger sibling cards and steps by 100ms.
  document.querySelectorAll('.cards, .trust-grid, .swiper-wrapper, .plans, .flow, .faq, .agency__grid').forEach(group => {
    Array.from(group.children).forEach((item, index) => {
      item.style.setProperty('--rise-delay', `${index * 100}ms`);
    });
  });
  targets.forEach(target => {
    observer.observe(target);
    target.classList.add('rise-ready');
  });
  waves.forEach(wave => observer.observe(wave));
  // Keyboard navigation must never land on invisible content.
  document.addEventListener('focusin', event => {
    const target = event.target.closest('.rise-ready');
    if (target) {
      reveal(target);
      observer.unobserve(target);
    }
  });
  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    targets.forEach(target => target.classList.add('is-visible'));
    waves.forEach(wave => wave.classList.remove('is-in-view'));
  });
}
  /* ---------- お問い合わせフォーム ---------- */
  /* 送信先（アクセスキー）が入っていないあいだは、
     フォームを出さずにボタンのままにしておく。
     壊れたフォームを表に出さないための切り替え */
  var cform = document.getElementById("js-contact-form");
  var cfallback = document.getElementById("js-contact-fallback");

  if (cform) {
    var keyField = cform.querySelector('[name="access_key"]');
    var hasKey = keyField && keyField.value.trim() !== "";

    if (hasKey) {
      cform.hidden = false;
      if (cfallback) cfallback.hidden = true;

      var result = document.getElementById("js-contact-result");
      var submit = cform.querySelector(".cform__submit");

      cform.addEventListener("submit", function (e) {
        e.preventDefault();
        if (result) {
          result.textContent = "送信しています…";
          result.className = "cform__result";
        }
        if (submit) submit.disabled = true;

        var fd = new FormData(cform);
        // 返信先を、入力されたメールアドレスそのものに差し替える。
        // hidden の value="email"（項目名を渡す書き方）が効かない場合の保険。
        // JSが動かないときは hidden の値がそのまま使われる
        var emailField = cform.querySelector('[name="email"]');
        if (emailField && emailField.value) {
          fd.set("replyto", emailField.value);
        }

        fetch(cform.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd
        })
          .then(function (res) {
            return res.json().catch(function () {
              return { success: res.ok };
            });
          })
          .then(function (data) {
            if (data && data.success) {
              cform.reset();
              if (result) {
                result.textContent =
                  "送信しました。2営業日以内にお返事します。届かない場合は、迷惑メールもご確認ください。";
                result.className = "cform__result is-ok";
              }
            } else {
              throw new Error("failed");
            }
          })
          .catch(function () {
            if (result) {
              result.textContent =
                "送信できませんでした。お手数ですが、X のDMからご連絡ください。";
              result.className = "cform__result is-ng";
            }
          })
          .then(function () {
            if (submit) submit.disabled = false;
          });
      });
    }
  }


document.querySelectorAll('.placeholder-link').forEach(link => link.addEventListener('click', e => e.preventDefault()));
const menu = document.querySelector('#site-menu');
const menuButton = document.querySelector('.header .menu-toggle');
if (menu && menuButton) {
  const bubbles = menu.querySelector('.menu-bubbles');
  const closeButton = menu.querySelector('.menu-close');
  let closing = false, savedY = 0, savedBodyStyle = '', closeTimer, bubbleTimer;
  function syncMotion() {
    menu.classList.toggle('menu-still', still());
    if (still()) bubbles.replaceChildren();
  }
  function burst(x, y) {
    const fragment = document.createDocumentFragment();
    // Use the rendered layer's coordinate system for both origin and destinations.
    const bounds = bubbles.getBoundingClientRect();
    const { width, height } = bounds;
    // Keep the vanishing point near the center, slightly toward Menu.
    const originX = width * .5 + (x - bounds.left - width * .5) * .18;
    const originY = height * .5 + (y - bounds.top - height * .5) * .18;
    // 画面の広さから数を決めて、すき間なく埋める（24px四方に1個・重さのため上限700）
    const count = Math.max(300, Math.min(700, Math.round(width * height / (24 * 24))));
    const columns = Math.round(Math.sqrt(count * width / height));
    const rows = Math.ceil(count / columns);
    const flights = [];
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('span');
      const row = Math.floor(i / columns);
      const rowCount = Math.min(columns, count - row * columns);
      const column = i % columns;
      // Stratified starting positions cover the viewport before the camera advances.
      const startX = width * (column + .15 + Math.random() * .7) / rowCount;
      const startY = height * (row + .15 + Math.random() * .7) / rows;
      const proximity = Math.random();
      const startSize = 4 + proximity * 8;
      // 近づいた時の最大の大きさ。粒どうしが重なるくらいまで大きくする（最大約330px・真ん中の近さで約120px）
      const size = 14 + 320 * Math.pow(proximity, 1.6);
      const startScale = startSize / size;
      // Perspective projection: advancing toward a bubble reduces its depth.
      // Position and diameter share the same zoom; distant bubbles barely grow.
      const travel = 1 - startScale;
      const duration = 1400 - proximity * 260;
      const sway = (Math.random() - .5) * 3;
      const color = bubbleColor();
      bubble.className = 'menu-bubble';
      // Rasterize at the final diameter, then start small to keep nearby dots crisp.
      bubble.style.cssText = `--size:${size}px;--bubble-color:${color}`;
      // Menu ボタンを消失点にして、放射状に広がりながらブワッと近づいてくる（遠近法）
      // 画面を埋める位置（startX/Y）への方向に、最初はゆっくり、だんだん速く飛び出し、画面の外まで抜ける
      const btnX = x - bounds.left;
      const btnY = y - bounds.top;
      const reach = 1.5 + proximity * .9;      // 近い粒ほど遠くまで（画面の外へ）抜ける
      const k = .62;
      const norm = reach * (1 - k);           // R(1) = reach になるように合わせる
      // 粒ごとに飛び出すタイミングをずらして、ボタンから湧き出すようにする（四角いかたまりに見えないように）
      const delay = Math.random() * .32;
      const keyframes = Array.from({ length: 41 }, (_, step) => {
        const tt = step / 40;
        const t = Math.max(0, (tt - delay) / (1 - delay));
        const R = norm * t / (1 - k * t);       // 遠近法の加速
        const grow = Math.min(1, R / reach);
        const drift = Math.sin(t * Math.PI * 2) * sway * grow;
        const cx = btnX + (startX - btnX) * R + drift;
        const cy = btnY + (startY - btnY) * R + drift * .5;
        const scale = startScale * .25 + (1 - startScale * .25) * Math.pow(grow, 1.4);
        const fade = Math.max(0, (t - .82) / .18);
        return {
          offset: tt,
          // 透過 50%（不透明度 0.5）
          opacity: tt < delay ? 0 : .5 * (1 - fade * fade * (3 - 2 * fade)),
          transform: `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0) scale(${scale})`
        };
      });
      flights.push({ bubble, duration, keyframes });
      fragment.append(bubble);
    }
    bubbles.replaceChildren(fragment);
    for (const { bubble, keyframes, duration } of flights) {
      const animation = bubble.animate(keyframes, {
        duration, easing: 'linear', fill: 'both'
      });
      animation.onfinish = () => bubble.remove();
    }
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubbles.replaceChildren(), 1600);
  }
  function openMenu() {
    if (menu.open) return;
    const rect = menuButton.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    menu.style.setProperty('--menu-x', `${x}px`);
    menu.style.setProperty('--menu-y', `${y}px`);
    menu.style.setProperty('--menu-radius', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 32}px`);
    menu.style.setProperty('--button-top', `${rect.top}px`);
    menu.style.setProperty('--button-right', `${innerWidth - rect.right}px`);
    savedY = scrollY;
    savedBodyStyle = document.body.style.cssText;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    syncMotion();
    menuButton.setAttribute('aria-expanded', 'true');
    menu.showModal();
    closeButton.focus({ preventScroll: true });
    // Establish the transparent surface before starting its transition.
    menu.getBoundingClientRect();
    menu.classList.add('is-open');
    if (!still()) burst(x, y);
  }
  function finishClose(destination) {
    clearTimeout(closeTimer);
    clearTimeout(bubbleTimer);
    menu.close();
    menu.classList.remove('is-open', 'is-closing');
    bubbles.replaceChildren();
    document.body.style.cssText = savedBodyStyle;
    window.scrollTo({ top: savedY, behavior: 'instant' });
    menuButton.setAttribute('aria-expanded', 'false');
    closing = false;
    menuButton.focus({ preventScroll: true });
    if (destination) {
      const target = document.querySelector(destination);
      if (target) {
        history.pushState(null, '', destination);
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        const previousTabindex = target.getAttribute('tabindex');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', () => {
          if (previousTabindex === null) target.removeAttribute('tabindex');
          else target.setAttribute('tabindex', previousTabindex);
        }, { once: true });
      }
    }
  }
  function closeMenu(destination) {
    if (!menu.open || closing) return;
    closing = true;
    menu.classList.remove('is-open');
    menu.classList.add('is-closing');
    bubbles.replaceChildren();
    closeTimer = setTimeout(() => finishClose(destination), still() ? 200 : 680);
  }
  menuButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', () => closeMenu());
  menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const links = [...menu.querySelectorAll('button, a[href]')];
    const first = links[0], last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      event.preventDefault();
      closeMenu(href);
    } else closeMenu();
  }));
  motionPreference.addEventListener('change', syncMotion);
  new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => {
    if (menu.open) menu.style.setProperty('--menu-radius', `${Math.hypot(innerWidth, innerHeight) * 2}px`);
  });
}
})();
