# portfolio（Anchor Base）— クロコ用コンテキスト

## このリポジトリ

**Anchor Base**（ほめまろ／村田 諒）のポートフォリオサイト。営業用の本番サイト。

- 公開URL: https://anchorbase-web.com/
- ホスティング: **Cloudflare Pages**（プロジェクト名 `portfolio-7hd`）
- devのプレビュー: **https://dev.portfolio-7hd.pages.dev**

## ブランチ運用（重要）

| ブランチ | 役割 |
|---|---|
| `main` | 公開されている正本。**クロコは絶対に触らない** |
| `dev` | 作業用。クロコはここに push する |

- **`dev` → `main` のマージは、ほめまろが GitHub の画面で行う。** クロコからは一切しない
- 過去に「ロゴをアップした流れでうっかり main までマージ」した事故がある。確認を求められたら履歴で切り分けること
- **リモートのブランチ削除は、この環境からは通らない**（`send-pack: unexpected disconnect`）。ほめまろに頼む

## 技術構成

- HTML / SCSS（Dart Sass）/ 素の JavaScript。フレームワークなし
- **`sass/style.scss` が元ファイル。`css/style.css` はコンパイル結果**（両方コミットする）
- Swiper 11（jsdelivr の CDN）… 制作実績のスライダー
- Google Fonts: **Josefin Sans**（英字）＋ **Shippori Mincho**（日本語・400/700）
- お問い合わせ: **Web3Forms**（公開キーを `index.html` に直書き。クライアント側前提のキー）

```bash
npm install
npm start      # browser-sync + sass --watch
```

## ファイル構成

```
index.html            トップ
profile.html          運営者情報
works-onomichi.html   制作実績の詳細（5本）
works-moofc.html
works-portfolio.html
works-sweets.html
works-oha.html
sass/style.scss       スタイルの元ファイル（1本にまとめている）
css/style.css         コンパイル結果
js/index.js           ドロワー／スクロール表示／Swiper／FAQ開閉／フォーム送信
img/*.webp            画像はすべて WebP
```

- ヘッダー・フッターは各HTMLに**べた書きで重複**している。1か所直したら全ページに反映すること
- CSSのキャッシュバスティングは `style.css?v=13` の数字を上げる（**全ページ揃える**）

## デザインの決めごと

- 色: 紺 `#16324f` / 濃紺 `#0a1d33` / ミント `#2bb3a3`・`#12776b` / オレンジ `#c2410c`（ヘッダーCTA）/ 赤 `#c62828`（キャンペーン価格）
- ブレイクポイント: sm 600 / md 768 / **lg 960**（PC切替）/ xl 1200
- 見出しは「大きな英字＋小さな日本語」の中央揃えで統一（`.sec-ttl`）
- 日本語は**すべて明朝**。明朝は細いので本文15.5px・字間0.04em・12px未満を作らない
- SP（375px）を基準に作り、lg以上で上書きする

## 実装で踏んだ罠（再発しやすい）

- **`mix-blend-mode` は、親に `will-change` や `opacity` が付くと効かなくなる**。重ね合わせ文脈ができて背景に届かないため。FVのイラストをスクロール表示の対象から外しているのはこれが理由
- **`grid-template-rows: 0fr` で縮める箱に `padding` を置くと、閉じても余白が残る**。余白は中の要素側で取る（FAQの開閉）
- **1pxの罫線は、要素の高さが小数になると描画で消える**。Q&Aは罫線をやめてカード＋隙間に変更した
- **折り返すリストに `li + li::before` で区切り線を入れると、行頭にも線が出る**。CSSでは判定できないのでフッターでは使っていない
- **CDNは落ちる前提で書く**。Swiperは `typeof Swiper !== "undefined"` で判定し、読めない時は格子並びに戻る。矢印は動いた時だけ出す
- **スクロール表示は「JSが動いてから隠す」**。先にCSSで透明にすると、JSが落ちたときページが真っ白になる
- ロゴPNGは**外周1pxに薄い線が焼き込まれている**ため `clip-path: inset(1.5px)` で切っている
- 画像・ロゴのファイル名は**ASCIIのみ**（日本語・スペースは Cloudflare Pages で404の恐れ）

## 検証のやり方（クロコ側）

Playwright + Chromium（`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`）でレンダリングして確認できる。

- **Google Fonts と CDN はこの環境から届かない**（403）。フォントは curl で落としてローカル配信して差し込む。**Swiperの実挙動は確認できない**ので、プレビューでほめまろに見てもらう
- `--window-size` はレイアウト幅に効かない。Playwright の `viewport` を使う
- 画像変換は `sharp`（写真は quality 82〜84、ロゴなど線画は可逆）

## 現在の状態（2026-08-28 時点）

- `dev` が `main` より **10コミット先行**。マージ待ち
- お問い合わせフォームは Web3Forms で**有効化済み**。実送信のテストは未実施
- 制作実績は5件。**MOO FCの「制作のポイント」はクロコが画面から書いたドラフト**で、ほめまろの実際の意図とは違う可能性がある
- スイーツ店・OHA! の詳細ページは情報が少なく内容が薄い

## 未決・次にやること

1. **キャンペーン価格の期限か件数を決める**（今は「適用期間があります」とだけ書いている。二重価格表示は景表法の対象なので、期限が要る）
2. **公式LINE・Instagram** のアカウント開設 → URLをもらってフッターに追加（HTMLにコメントで場所を残してある）
3. **ブログ**をどうするか（note に寄せる方針で検討中）
4. 制作実績の詳細ページの肉付け・微調整
5. **study-log 側の宿題：営業ログのフォーマット設計＋営業の作戦立て**（8/26から未着手）

## 最優先事項

**学習・環境整備ではなく、受注。** サイトは人に見せられる状態になった。サイトを磨き続けるより、営業に時間を使うほうが目標（月15万円）に近い。
