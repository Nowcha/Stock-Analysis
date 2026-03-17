import { Link } from "react-router-dom";
import type { Signal } from "../types";
import { PatternChart } from "./PatternChart";

interface SignalCardProps {
  signal: Signal;
  showPnL?: boolean;
  buyPrice?: number;
  quantity?: number;
  showChart?: boolean;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "確信度 高",
  medium: "確信度 中",
  low: "確信度 低",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "bg-green-50 text-green-700 ring-1 ring-green-200",
  medium: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  low: "bg-gray-100 text-gray-500",
};

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function SignalCard({ signal, showPnL, buyPrice, quantity, showChart }: SignalCardProps) {
  const isBuy = signal.direction === "buy";
  const ago = daysAgo(signal.pattern_detail.end_date);
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
      className={`rounded-xl border border-gray-200 border-l-4 ${directionColor} bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Row 1 — Primary: direction badge + ticker/name + price */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold shrink-0 ${directionBadge}`}
          >
            {isBuy ? "買い" : "売り"}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {signal.ticker.replace(".T", "")}
          </span>
          <Link
            to={`/stock/${encodeURIComponent(signal.ticker)}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-700 hover:underline truncate"
          >
            {signal.name}
          </Link>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            ¥{signal.current_price.toLocaleString()}
          </p>
          {pnl !== null && pnlPct !== null && (
            <p className={`text-xs font-semibold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
              {pnl >= 0 ? "+" : ""}
              {pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}円
              （{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%）
            </p>
          )}
        </div>
      </div>

      {/* Row 2 — Secondary: pattern + win rate + confidence */}
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-800">
          {signal.pattern_name_ja}
        </span>
        <span className="text-sm text-gray-500">
          勝率 <span className="font-bold text-gray-800">{signal.win_rate}%</span>
        </span>
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
            CONFIDENCE_COLOR[signal.confidence]
          }`}
        >
          {CONFIDENCE_LABEL[signal.confidence]}
        </span>
      </div>

      {/* Row 3 — Tertiary: signal price, date range, days ago */}
      <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
        <span>¥{signal.signal_price.toLocaleString()}</span>
        <span className="text-gray-200">|</span>
        <span>{signal.pattern_detail.start_date} 〜 {signal.pattern_detail.end_date}</span>
        <span
          className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${
            ago === 0
              ? "bg-blue-100 text-blue-700"
              : ago <= 3
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {ago === 0 ? "本日" : `${ago}日前`}
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
