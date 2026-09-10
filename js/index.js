/* =========================================================
   Anchor Base ポートフォリオ
   - ハンバーガー＋ドロワー
   - スクロールに合わせたふわっと表示
   - 制作実績のスライダー（Swiper）
   - よくある質問の開閉アニメーション
   - お問い合わせフォームの送信
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
    ".works",
    ".flow__item",
    ".pagehead__ttl",
    ".profile__catch",
    ".profile__photo",
    ".profile__body",
    ".profile__pull",
    ".workmain",
    ".worklead",
    ".forwho",
    ".workbtns",
    ".promise__item",
    ".datatable",
    ".closing",
    ".closing__label",
    ".closing__btns",
    ".faq__item",
    ".agency__box",
    ".agency__note",
    ".contact__intro",
    ".contact__body"
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

  /* ---------- 制作実績のスライダー ---------- */
  var worksEl = document.getElementById("js-works");

  if (worksEl && typeof Swiper !== "undefined") {
    new Swiper(worksEl, {
      slidesPerView: 1.1,
      spaceBetween: 16,
      // 端まで来たら止める（無限ループにしない）
      loop: false,
      // 枚数が表示数以下のときは操作を無効にする
      watchOverflow: true,
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

    // 動くと分かってから矢印とドットを出す
    var ctrl = document.getElementById("js-works-ctrl");
    if (ctrl) ctrl.hidden = false;
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
