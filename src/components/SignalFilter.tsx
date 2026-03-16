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
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 space-y-3">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Win rate slider */}
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-gray-500 mb-1">
            勝率下限：{filter.minWinRate}%以上
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
          <div className="flex justify-between text-xs text-gray-400">
            <span>75%</span>
            <span>95%</span>
          </div>
        </div>

        {/* Confidence checkboxes */}
        <div>
          <p className="text-xs text-gray-500 mb-1">信度</p>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Confidence[]).map((c) => (
              <label key={c} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.confidences.has(c)}
                  onChange={() => onConfidenceToggle(c)}
                  className="accent-blue-600"
                />
                <span className="text-sm">{CONFIDENCE_LABELS[c]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort select */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">並び替え</label>
          <select
            value={filter.sortBy}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
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
      <p className="text-xs text-gray-500">
        {filteredCount} 件表示
        {filteredCount < totalCount && (
          <span className="text-gray-400">（全 {totalCount} 件中）</span>
        )}
      </p>
    </div>
  );
}
