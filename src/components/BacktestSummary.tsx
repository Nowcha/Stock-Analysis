import type { BacktestResult, PatternType } from "../types";

interface Props {
  backtest: BacktestResult;
  direction: "buy" | "sell";
}

const BUY_PATTERNS: PatternType[] = [
  "inverse_head_shoulders",
  "spike_bottom",
  "double_bottom",
  "ascending_pennant",
  "cup_with_handle",
  "triple_bottom",
  "inverse_v",
  "falling_wedge",
];

const SELL_PATTERNS: PatternType[] = [
  "head_shoulders",
  "double_top",
  "spike_top",
  "triple_top",
  "rising_wedge",
  "descending_triangle",
];

const PATTERN_NAME_JA: Record<PatternType, string> = {
  inverse_head_shoulders: "逆三尊",
  spike_bottom: "下窓",
  double_bottom: "ダブルボトム",
  triple_bottom: "トリプルボトム",
  inverse_v: "逆V字",
  ascending_pennant: "上昇ペナント",
  cup_with_handle: "カップ",
  falling_wedge: "下降ウェッジ",
  head_shoulders: "三尊",
  double_top: "ダブルトップ",
  spike_top: "上窓",
  triple_top: "トリプルトップ",
  rising_wedge: "上昇ウェッジ",
  descending_triangle: "下降三角形",
};

export function BacktestSummary({ backtest, direction }: Props) {
  const { overall_win_rate, total_verified, hold_days, per_pattern } = backtest;

  if (total_verified === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-500">
        バックテストデータなし（過去シグナルが蓄積されると実績が表示されます）
      </div>
    );
  }

  const relevantPatterns = direction === "buy" ? BUY_PATTERNS : SELL_PATTERNS;
  const patternRows = relevantPatterns
    .map((p) => ({ pattern: p, stat: per_pattern[p] }))
    .filter((r) => r.stat !== undefined);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      {/* Overall */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-medium text-blue-700">過去実績</span>
        {overall_win_rate !== null && (
          <span className="text-sm font-bold text-blue-800">
            総合勝率 {overall_win_rate}%
          </span>
        )}
        <span className="text-xs text-blue-600">
          {total_verified}件 / {hold_days}営業日後判定
        </span>
      </div>

      {/* Per-pattern */}
      {patternRows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {patternRows.map(({ pattern, stat }) => {
            if (!stat) return null;
            const color =
              stat.win_rate >= 70
                ? "bg-green-100 text-green-800"
                : stat.win_rate >= 50
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800";
            return (
              <span
                key={pattern}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${color}`}
                title={`${stat.wins}/${stat.count}件 avg ${stat.avg_return > 0 ? "+" : ""}${stat.avg_return}%`}
              >
                {PATTERN_NAME_JA[pattern]} {stat.win_rate}%
                <span className="text-gray-500">({stat.count})</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
