import type { Confidence } from "../types";
import type { FilterState, SortKey } from "../hooks/useSignalFilter";

interface Props {
  filter: FilterState;
  totalCount: number;
  filteredCount: number;
  onMinWinRateChange: (v: number) => void;
  onConfidenceToggle: (c: Confidence) => void;
  onSortChange: (s: SortKey) => void;
}

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "win_rate_desc", label: "勝率降順" },
  { value: "confidence_desc", label: "信度降順" },
  { value: "ticker_asc", label: "銘柄コード昇順" },
  { value: "date_desc", label: "シグナル日降順" },
];

export function SignalFilter({
  filter,
  totalCount,
  filteredCount,
  onMinWinRateChange,
  onConfidenceToggle,
  onSortChange,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex flex-wrap gap-5 items-end">
        {/* Win rate slider */}
        <div className="flex-1 min-w-44">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            勝率下限：<span className="text-blue-600 font-semibold">{filter.minWinRate}%</span>以上
          </label>
          <input
            type="range"
            min={75}
            max={95}
            step={5}
            value={filter.minWinRate}
            onChange={(e) => onMinWinRateChange(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>75%</span>
            <span>95%</span>
          </div>
        </div>

        {/* Confidence checkboxes — 44px touch targets */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">確信度</p>
          <div className="flex gap-1">
            {(["high", "medium", "low"] as Confidence[]).map((c) => (
              <label
                key={c}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 cursor-pointer rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors select-none"
              >
                <input
                  type="checkbox"
                  checked={filter.confidences.has(c)}
                  onChange={() => onConfidenceToggle(c)}
                  className="accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">{CONFIDENCE_LABELS[c]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">並び替え</label>
          <select
            value={filter.sortBy}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="min-h-[44px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
        <span className="font-semibold text-gray-700">{filteredCount}</span> 件表示
        {filteredCount < totalCount && (
          <span>（全 {totalCount} 件中）</span>
        )}
      </p>
    </div>
  );
}
