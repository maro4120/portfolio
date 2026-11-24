'use strict';
const intentContent = [
  {
    "title": "最初に開くあいさつ",
    "items": [
      {
        "label": "思い",
        "text": "私は元警察官です。警察官を嫌になって辞めたわけではありません。だからこそ、現職の方には、日々のやるせなさや人間関係で悩まず、警察官を嫌いにならずに歩んでいってほしいと思っています。このチャンネルの「なぜ昇任試験はあるのか？」の回を見て、現職の時にこの動画があれば、もっと心にゆとりを持って働けたと感じました。もっと多くの警察官にこのチャンネルを知ってほしい。その思いで、このページの見本を作りました。"
      }
    ]
  },
  {
    "title": "① 最初の画面",
    "items": [
      {
        "label": "狙い",
        "text": "YouTube から来た人が、まず「ここがあのチャンネルだ」と分かるように、チャンネル名を看板として真ん中に大きく置きました"
      },
      {
        "label": "思い",
        "text": "ショップの見出し画像から、赤いポップな文字＝親しみやすさ、「ピカッ」の線＝ちゃんと対策できることの強調、「いつもご視聴ありがとうございます」＝丁寧さと誠実さ、和装の柴犬＝かわいさとやわらかさ、を読み取り、その雰囲気を引き継ぎました"
      },
      {
        "label": "仕様",
        "text": "周りの絵と色の形が先に現れ、真ん中の看板が後からふわっと出ます。真ん中が自然と主役になるようにしています"
      }
    ]
  },
  {
    "title": "② 交差して流れる文字の帯",
    "items": [
      {
        "label": "狙い",
        "text": "「警察官昇任試験対策チャンネル」と「今年こそ、合格へ」を反対向きに流して、ページに動きと勢いを出しています"
      }
    ]
  },
  {
    "title": "③ こんな迷い、ありませんか？",
    "items": [
      {
        "label": "思い",
        "text": "私自身、受けていた頃は、何から手をつければいいか分からず、とりあえず参考書を買って空いた時間に眺めるだけでした。何のために受けるのかも見えず、浮かぶのは「あんな上司にはなりたくない」といったことばかりで、やる気が下がっていきました。同じ迷いを持つ方に「自分のことだ」と感じてもらう入口にしています"
      },
      {
        "label": "仕様",
        "text": "この段に入る時、回転灯の光がひと回りしてから紺の面が広がり、気持ちが切り替わる合図にしています"
      }
    ]
  },
  {
    "title": "④ このチャンネルの考え方",
    "items": [
      {
        "label": "思い",
        "text": "「なぜ昇任試験はあるのか？」の回で語られている、法律はレシピ、昇任は部下や市民を守る側に立つこと、という考え方が、あの頃の自分にいちばん必要だった答えでした。その芯をそのまま置いています"
      }
    ]
  },
  {
    "title": "⑤ あなたに合う講座の選び方",
    "items": [
      {
        "label": "狙い",
        "text": "講座が8つに増え、初めての方は「どれから始めればいいか」で迷いそうだと感じました。受験者の迷いの順（何のために → 何から → 腰を据えて）に講座を並べています"
      },
      {
        "label": "仕様",
        "text": "3つの質問に答えると、合う講座が光り、回転灯が点滅してお知らせします。購入ボタンは、今のショップの各商品ページにつながっています"
      }
    ]
  },
  {
    "title": "⑥ 勉強の順番",
    "items": [
      {
        "label": "狙い",
        "text": "動画「勉強の優先順位」の順番を、そのまま道のりとして見せています"
      }
    ]
  },
  {
    "title": "⑦ 読みやすさ（文字の大きさと余白）",
    "items": [
      {
        "label": "狙い",
        "text": "読む方の多くは、通勤や休憩の合間にスマホで見る現職の警察官です。目が疲れないよう本文は大きめの文字にし、文は真ん中の1本の柱に収めて、目を左右に動かさずに読めるようにしています"
      }
    ]
  },
  {
    "title": "⑧ イラスト",
    "items": [
      {
        "label": "仕様",
        "text": "今のイラストは仮のものです。正式に制作する際は、チャンネルに合わせて描き起こします"
      }
    ]
  }
];

(() => {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'intent-toggle';
  toggle.innerHTML = '<span style="display:block;white-space:nowrap">制作の</span><span style="display:block;white-space:nowrap">意図を見る</span>';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-controls', 'intent-panel');
  const panel = document.createElement('section');
  panel.id = 'intent-panel';
  panel.className = 'intent-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'intent-title');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'intent-close';
  close.textContent = '×';
  close.setAttribute('aria-label', '制作の意図を閉じる');
  const title = document.createElement('h2');
  title.id = 'intent-title';
  const list = document.createElement('dl');
  panel.append(close, title, list);
  document.body.append(toggle, panel);
  // The ribbon is aria-hidden; put its accessible marker in a sibling anchor.
  const band = document.createElement('div');
  band.className = 'intent-band-anchor';
  document.querySelector('.hero').append(band);
  const targets = ['.hero', null, '#worries', '#philosophy', '#courses', '#study', '#intro', 'footer'];
  let enabled = false, active = null, timer, opener = toggle;
  const markers = targets.map((selector, index) => {
    const target = selector ? document.querySelector(selector) : band;
    if (selector) target.classList.add('intent-anchor');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'intent-marker';
    button.textContent = '①②③④⑤⑥⑦⑧'[index];
    button.hidden = true;
    button.setAttribute('aria-label', intentContent[index + 1].title + 'の制作の意図を見る');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => active === button ? hide() : show(index + 1, button));
    target.append(button);
    return button;
  });
  function position() {
    if (!active || panel.hidden) return;
    const rect = active.getBoundingClientRect();
    panel.style.top = Math.max(16, Math.min(rect.bottom + 16, window.innerHeight - panel.offsetHeight - 16)) + 'px';
  }
  function hide(immediate = false, restore = true) {
    clearTimeout(timer);
    active?.setAttribute('aria-expanded', 'false');
    active = null;
    panel.classList.remove('is-open');
    panel.inert = true;
    if (restore && !panel.hidden) opener.focus({preventScroll:true});
    if (immediate) panel.hidden = true;
    else timer = setTimeout(() => { panel.hidden = true; }, reducedMotion.matches ? 0 : 300);
  }
  function show(index, source) {
    clearTimeout(timer);
    active?.setAttribute('aria-expanded', 'false');
    active = index ? source : null;
    opener = source;
    active?.setAttribute('aria-expanded', 'true');
    title.textContent = intentContent[index].title;
    list.replaceChildren();
    intentContent[index].items.forEach(item => {
      const term = document.createElement('dt'), detail = document.createElement('dd');
      term.textContent = item.label;
      detail.textContent = item.text;
      list.append(term, detail);
    });
    panel.className = 'intent-panel ' + (index ? 'intent-note' : 'intent-greeting');
    panel.style.top = '';
    panel.hidden = false;
    panel.inert = false;
    panel.scrollTop = 0;
    position();
    void panel.offsetWidth;
    panel.classList.add('is-open');
    close.focus({preventScroll:true});
  }
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    toggle.setAttribute('aria-pressed', String(enabled));
    markers.forEach(marker => { marker.hidden = !enabled; });
    if (enabled) show(0, toggle);
    else hide(true, false);
  });
  close.addEventListener('click', () => hide());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && enabled) {
      if (!panel.hidden && !panel.inert) { event.preventDefault(); hide(); }
      else { enabled = false; toggle.setAttribute('aria-pressed', 'false'); markers.forEach(marker => { marker.hidden = true; }); hide(true, false); toggle.focus({preventScroll:true}); }
    }
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, {passive:true});
  menuButton.addEventListener('click', () => { if (header.classList.contains('menu-open')) hide(true, false); });
})();
