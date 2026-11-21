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
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const targets = document.querySelectorAll([
    '.section .sec-ttl', '.section .sec-lead', '.card', '.evidence',
    '.portrait', '.about-grid > div > *', '.work', '.plans__campaign',
    '.plan', '.freebox', '#price .note', '.flow__item', '.faq__item',
    '.agency__box', '.agency__note', '.contact__intro > *',
    '.prototype-notice', '.cform__row', '.cform__privacy', '.cform__submit'
  ].join(', '));
  const waves = document.querySelectorAll('.section-wave');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.target.classList.contains('section-wave')) {
      entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    } else if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
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
      target.classList.add('is-visible');
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
document.querySelector('#js-contact-form')?.addEventListener('submit', e => e.preventDefault());
document.querySelectorAll('.placeholder-link').forEach(link => link.addEventListener('click', e => e.preventDefault()));
const menu = document.querySelector('#site-menu');
const menuButton = document.querySelector('.header .menu-toggle');
if (menu && menuButton) {
  const bubbles = menu.querySelector('.menu-bubbles');
  const closeButton = menu.querySelector('.menu-close');
  let closing = false, savedY = 0, savedBodyStyle = '', closeTimer, bubbleTimer;
  const still = () => motionPreference.matches || document.documentElement.classList.contains('paused');
  function syncMotion() {
    menu.classList.toggle('menu-still', still());
    if (still()) bubbles.replaceChildren();
  }
  function burst(x, y) {
    const colors = ['#16324f', '#0a1d33', '#12776b', '#2bb3a3', '#bb9238'];
    const toneColors = [0, 0, 1, 2, 2, 3, 3, 4];
    const fragment = document.createDocumentFragment();
    // Use the rendered layer's coordinate system for both origin and destinations.
    const bounds = bubbles.getBoundingClientRect();
    const { width, height } = bounds;
    const originX = x - bounds.left, originY = y - bounds.top;
    const count = width < 960 ? 140 : 200;
    const columns = Math.round(Math.sqrt(count * width / height));
    const rows = Math.ceil(count / columns);
    const flights = [];
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('span');
      const row = Math.floor(i / columns);
      const rowCount = Math.min(columns, count - row * columns);
      const column = i % columns;
      // hero.js: visible diameter = particle size * 2 * .8 at rest.
      const size = (2 + Math.random() * 3) * (width < 960 ? 1.3 : 1) * 1.6
        * (Math.random() < .12 ? 1.5 : 1);
      // Anchor boundary rows/columns to the edges; jitter only interior cells.
      const targetX = width *
        (column === 0 ? 0 : column === rowCount - 1 ? 1 : (column + Math.random() * .6 - .3) / (rowCount - 1));
      const targetY = height *
        (row === 0 ? 0 : row === rows - 1 ? 1 : (row + Math.random() * .6 - .3) / (rows - 1));
      const tone = Math.random();
      const color = colors[toneColors[tone > .985 ? 7 : Math.floor(tone * 7)]];
      bubble.className = 'menu-bubble';
      bubble.style.cssText = `--size:${size}px;--bubble-color:${color}`;
      const depth = targetY / height;
      const duration = 1200 + Math.random() * 180 + depth * 160;
      const delay = Math.random() * 40;
      const riseStart = .38 + depth * .08;
      const rise = 45 + Math.random() * 85;
      const sway = (3 + Math.random() * 4) * (Math.random() < .5 ? -1 : 1);
      // Only transform/opacity animate; alternate a small translateX while rising.
      const transform = (cx, cy, scale, drift = 0) =>
        `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0) translateX(${drift}px) scale(${scale})`;
      flights.push({ bubble, duration, delay, keyframes: [
        { offset: 0, opacity: 0, transform: transform(originX, originY, .12), easing: 'cubic-bezier(.16,.7,.3,1)' },
        { offset: .3, opacity: 1, transform: transform(targetX, targetY, 1) },
        { offset: riseStart, opacity: 1, transform: transform(targetX, targetY, 1), easing: 'ease-in-out' },
        { offset: .62, opacity: 1, transform: transform(targetX, targetY - rise * .3, .8, sway), easing: 'ease-in-out' },
        { offset: .78, opacity: 1, transform: transform(targetX, targetY - rise * .62, .55, -sway), easing: 'ease-in-out' },
        { offset: .9, opacity: 1, transform: transform(targetX, targetY - rise * .84, .3, sway * .5) },
        { offset: .95, opacity: 1, transform: transform(targetX, targetY - rise * .92, .36) },
        { offset: 1, opacity: 0, transform: transform(targetX, targetY - rise, .18, -sway * .25) }
      ] });
      fragment.append(bubble);
    }
    bubbles.replaceChildren(fragment);
    for (const { bubble, keyframes, duration, delay } of flights) {
      const animation = bubble.animate(keyframes, {
        duration, delay, fill: 'both'
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
