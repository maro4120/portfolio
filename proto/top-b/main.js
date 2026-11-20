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


// Cards rise into view once; reduced motion and missing JS keep them readable.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const cards = document.querySelectorAll('.card');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: .08 });
  cards.forEach(card => { card.classList.add('rise-ready'); observer.observe(card); });
}
document.querySelector('#js-contact-form').addEventListener('submit', e => e.preventDefault());
document.querySelectorAll('.placeholder-link').forEach(link => link.addEventListener('click', e => e.preventDefault()));
document.querySelectorAll('.menu a').forEach(link => link.addEventListener('click', () => { document.querySelector('.menu').open = false; }));
})();
