# 保守度診断 / 保守思想解析システム

> あなたの思想は、どこに属するのか。

思想・歴史・文化・政治ネタをエンタメとして楽しめる、和風ミニマルな診断 Web アプリ。

## 特徴

- 全 13 問の 4 択診断（思想・古事記・生活・ネタ）
- 6 軸スコア（文化保守性 / 経済思想 / 国家観 / SNS過激化リスク / 古事記理解度 / 思想純度）
- 4 タイプの結果分類（古社派・町衆派・町内会派・炎上型）
- 古事記風ローディング演出
- 結果カードの PNG 保存・X 共有
- ダークモード固定・スマホ最適化・縦スクロール主体

## 技術

- Next.js 14（App Router）
- TypeScript
- Tailwind CSS
- html-to-image（結果画像の出力）

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## ビルド

```bash
npm run build
npm start
```

## デプロイ

Vercel に新規プロジェクトとして接続するだけで動作します。
追加の環境変数は不要です。

## ディレクトリ

```
app/
  layout.tsx        ルートレイアウト
  page.tsx          フェーズ管理（intro → quiz → loading → result）
  globals.css       和紙ノイズ・タイポ・色テーマ
components/
  Intro.tsx
  Quiz.tsx
  Loading.tsx
  Result.tsx
  AxisBar.tsx
lib/
  questions.ts      設問データ
  scoring.ts        集計・タイプ判定
```

## 免責

本診断はエンタメ目的です。実在の政治思想・宗教・個人を診断・評価するものではありません。

---

## 同梱プロジェクト: ねこのチーズ工房

`neko-cheese-kobo/` に、牛乳からチーズができるまでを猫と一緒に体験する子ども向け 3D アドベンチャー（Vite + React Three Fiber）を同梱しています。このアプリとは独立しており、Vercel では Root Directory を `neko-cheese-kobo` にした別プロジェクトとしてデプロイします。詳しくは [neko-cheese-kobo/README.md](neko-cheese-kobo/README.md) を参照してください。
