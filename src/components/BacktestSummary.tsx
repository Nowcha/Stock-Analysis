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
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      {/* Overall stats — numbers are the hero */}
      <div className="flex items-baseline gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">過去実績（バックテスト）</p>
          {overall_win_rate !== null && (
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {overall_win_rate}
              <span className="text-sm font-medium text-gray-500 ml-1">% 勝率</span>
            </p>
          )}
        </div>
        <div className="text-right ml-auto">
          <p className="text-xs text-gray-400">検証件数</p>
          <p className="text-lg font-semibold text-gray-700">{total_verified}<span className="text-xs font-normal text-gray-400 ml-1">件</span></p>
          <p className="text-xs text-gray-400">{hold_days}営業日後判定</p>
        </div>
      </div>

      {/* Per-pattern rows */}
      {patternRows.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-1.5">
          {patternRows.map(({ pattern, stat }) => {
            if (!stat) return null;
            const barColor =
              stat.win_rate >= 70
                ? "bg-green-500"
                : stat.win_rate >= 50
                ? "bg-yellow-400"
                : "bg-red-400";
            const textColor =
              stat.win_rate >= 70
                ? "text-green-700"
                : stat.win_rate >= 50
                ? "text-yellow-700"
                : "text-red-600";
            return (
              <div
                key={pattern}
                className="flex items-center gap-2 text-xs"
                title={`${stat.wins}/${stat.count}件 avg ${stat.avg_return > 0 ? "+" : ""}${stat.avg_return}%`}
              >
                <span className="w-20 text-gray-600 shrink-0">{PATTERN_NAME_JA[pattern]}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.min(stat.win_rate, 100)}%` }}
                  />
                </div>
                <span className={`font-semibold w-10 text-right ${textColor}`}>{stat.win_rate}%</span>
                <span className="text-gray-400 w-8 text-right">({stat.count})</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
