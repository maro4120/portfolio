/* =========================================================
   Anchor Base ポートフォリオ
   - ハンバーガー＋ドロワー
   - ページトップボタンの表示切り替え
   ========================================================= */
(function () {
  "use strict";

  /* ---------- ドロワー ---------- */
  var hamburger = document.getElementById("js-hamburger");
  var drawer = document.getElementById("js-drawer");

  if (hamburger && drawer) {
    var closeDrawer = function () {
      drawer.hidden = true;
      hamburger.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.setAttribute("aria-label", "メニューを開く");
      document.body.classList.remove("is-fixed");
    };

    hamburger.addEventListener("click", function () {
      var willOpen = drawer.hidden;
      drawer.hidden = !willOpen;
      hamburger.classList.toggle("is-open", willOpen);
      hamburger.setAttribute("aria-expanded", willOpen ? "true" : "false");
      hamburger.setAttribute("aria-label", willOpen ? "メニューを閉じる" : "メニューを開く");
      document.body.classList.toggle("is-fixed", willOpen);
    });

    // メニュー内のリンクを押したら閉じる
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeDrawer();
    });

    // Esc で閉じる
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !drawer.hidden) closeDrawer();
    });

    // PC幅になったら閉じておく
    var mq = window.matchMedia("(min-width: 960px)");
    var onChange = function (e) {
      if (e.matches && !drawer.hidden) closeDrawer();
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
    } else {
      mq.addListener(onChange);
    }
  }

  /* ---------- ページトップ ---------- */
  var pagetop = document.getElementById("js-pagetop");

  if (pagetop) {
    var toggle = function () {
      pagetop.classList.toggle("is-show", window.scrollY > 300);
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });

    pagetop.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }
})();
