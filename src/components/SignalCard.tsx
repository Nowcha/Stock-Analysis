import { Link } from "react-router-dom";
import type { Signal } from "../types";
import { PATTERN_META } from "../data/pattern-meta";
import { PatternChart } from "./PatternChart";

interface SignalCardProps {
  signal: Signal;
  showPnL?: boolean;
  buyPrice?: number;
  quantity?: number;
  showChart?: boolean;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-600",
};

export function SignalCard({ signal, showPnL, buyPrice, quantity, showChart }: SignalCardProps) {
  const meta = PATTERN_META[signal.pattern];
  const isBuy = signal.direction === "buy";
  const directionColor = isBuy ? "border-l-green-500" : "border-l-red-500";
  const directionBadge = isBuy
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";

  const pnl =
    showPnL && buyPrice && quantity
      ? (signal.current_price - buyPrice) * quantity
      : null;

  const pnlPct =
    showPnL && buyPrice
      ? ((signal.current_price - buyPrice) / buyPrice) * 100
      : null;

  return (
    <div
      className={`rounded-lg border border-gray-200 border-l-4 ${directionColor} bg-white p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">{signal.ticker}</span>
            <Link
              to={`/stock/${encodeURIComponent(signal.ticker)}`}
              className="font-semibold text-gray-900 hover:text-blue-700 hover:underline truncate"
            >
              {signal.name}
            </Link>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${directionBadge}`}
            >
              {isBuy ? "買い" : "売り"}
            </span>
            <span className="text-sm font-medium text-gray-800">
              {signal.pattern_name_ja}
            </span>
            <span className="text-xs text-gray-500">
              勝率 <span className="font-semibold text-gray-700">{signal.win_rate}%</span>
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                CONFIDENCE_COLOR[signal.confidence]
              }`}
            >
              確信度：{CONFIDENCE_LABEL[signal.confidence]}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            ¥{signal.current_price.toLocaleString()}
          </p>
          {pnl !== null && pnlPct !== null && (
            <p
              className={`text-sm font-medium ${
                pnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {pnl >= 0 ? "+" : ""}
              {pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}円
              ({pnlPct >= 0 ? "+" : ""}
              {pnlPct.toFixed(1)}%)
            </p>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">{meta?.description ?? ""}</p>

      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span>
          シグナル価格: ¥{signal.signal_price.toLocaleString()}
        </span>
        <span>
          検出期間: {signal.pattern_detail.start_date} 〜 {signal.pattern_detail.end_date}
        </span>
      </div>

      {showChart && signal.pattern_detail.key_points.length >= 2 && (
        <div className="mt-3 overflow-x-auto">
          <PatternChart
            keyPoints={signal.pattern_detail.key_points}
            direction={signal.direction}
            width={288}
            height={110}
          />
        </div>
      )}
    </div>
  );
}
