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
document.querySelectorAll('.menu a').forEach(link => link.addEventListener('click', () => { document.querySelector('.menu').open = false; }));
})();
