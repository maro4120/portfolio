/* =========================================================
   Anchor Base ポートフォリオ
   - ハンバーガー＋ドロワー
   - スクロールに合わせたふわっと表示
   - よくある質問の開閉アニメーション
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

  /* ---------- スクロールでふわっと表示 ---------- */
  var FADE_TARGETS = [
    ".mv__lead",
    ".mv__ttl",
    ".sec-ttl",
    ".sec-lead",
    ".message__ttl",
    ".message__text",
    ".pain__item",
    ".pain__answer",
    ".card",
    ".plan",
    ".freebox",
    ".note",
    ".work",
    ".flow__item",
    ".about__photo",
    ".about__body",
    ".faq__item",
    ".agency__box",
    ".agency__note",
    ".contact__text",
    ".contact__label",
    ".contact__btns",
    ".contact__note"
  ].join(",");

  var items = document.querySelectorAll(FADE_TARGETS);

  if (items.length && "IntersectionObserver" in window) {
    // JSが動くと分かった時点で初めて隠す（JSが落ちても中身は見えたまま）
    document.documentElement.classList.add("js-fade-ready");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-shown");
          observer.unobserve(entry.target); // 一度出したら戻さない
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    items.forEach(function (el) {
      el.classList.add("fade");
      observer.observe(el);
    });
  }

  /* ---------- よくある質問の開閉 ---------- */
  /* details は閉じた瞬間に中身を消してしまうので、閉じるときだけ
     open を外すのを CSS のアニメーション（0.3秒）ぶん待たせる */
  var CLOSE_DURATION = 300;

  document.querySelectorAll(".faq__item").forEach(function (item) {
    var summary = item.querySelector("summary");
    var body = item.querySelector(".faq__body");
    if (!summary || !body) return;

    summary.addEventListener("click", function (e) {
      // 開くときは details にそのまま任せる（0fr → 1fr が動く）
      if (!item.open) return;
      // 動きを減らす設定のときは、すぐ閉じる
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (item.classList.contains("is-closing")) return;

      e.preventDefault();
      item.classList.add("is-closing");

      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        item.open = false;
        item.classList.remove("is-closing");
      };

      body.addEventListener("transitionend", finish, { once: true });
      // grid-template-rows の遷移に対応していない環境でも閉じられるように
      setTimeout(finish, CLOSE_DURATION + 60);
    });
  });

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
