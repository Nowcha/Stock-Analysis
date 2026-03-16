# KabuPattern プロジェクト固有ルール

## Python (analyzer/)
- Python 3.11 ターゲット
- 型ヒント必須
- パターン検出モジュールは patterns/ 以下に1パターン1ファイルで配置
- 各パターンモジュールは `detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]` 関数をexport
- 実行: `python -m analyzer.main`（リポジトリルートから）

## データ管理
- data/cache/ohlcv/*.csv はgitで管理する（.gitignoreに入れない）
- 差分取得: fetcher.py は meta.json の last_date を見て差分のみ yfinance で取得
- クリーンアップ: OHLCV=6ヶ月超削除、シグナル=30日超削除、除外銘柄CSV=削除
- エラー時はキャッシュを維持（取得失敗した銘柄は前回データで分析続行）

## フロントエンド (src/)
- TypeScript strict mode
- Tailwind CSS
- コンポーネントは src/components/ に配置
- カスタムフックは src/hooks/ に配置
- 型定義は src/types/index.ts に集約

## データフロー
- Python → data/cache/ohlcv/*.csv（差分蓄積）→ パターン検出 → public/data/latest.json
- ポートフォリオ → localStorage → React (usePortfolio hook)
- GitHub Actions → git push（cache + signals）→ GitHub Pages 自動デプロイ

## 命名規則
- パターンの型名: snake_case (例: "double_bottom")
- コンポーネント: PascalCase
- フック: camelCase (use~ prefix)
- Python モジュール: snake_case
- キャッシュCSVファイル名: {ticker_code}.csv（サフィックスなし、例: 7203.csv）

## GitHub
- リポジトリ名: Stock-Analysis
- GitHub Pages URL: https://{user}.github.io/Stock-Analysis/
- vite base: '/Stock-Analysis/'
- Actions権限: Settings > Actions > Workflow permissions > "Read and write permissions" 必須
