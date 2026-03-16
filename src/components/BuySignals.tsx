import { useSignalFilter } from "../hooks/useSignalFilter";
import { useSignals } from "../hooks/useSignals";
import { BacktestSummary } from "./BacktestSummary";
import { SignalCard } from "./SignalCard";
import { SignalFilter } from "./SignalFilter";

export function BuySignals() {
  const { data, loading, error, refetch } = useSignals();
  const { filter, filtered, setMinWinRate, toggleConfidence, setSortBy } =
    useSignalFilter(data?.buy_signals ?? []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700 font-medium">データの取得に失敗しました</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-3 rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">買いシグナル</h2>
          <p className="text-sm text-gray-500">
            分析日: {data.market_date}　{data.buy_signals.length} 件検出（{data.total_analyzed} 銘柄中）
          </p>
        </div>
      </div>

      {data.backtest && (
        <BacktestSummary backtest={data.backtest} direction="buy" />
      )}

      <SignalFilter
        filter={filter}
        totalCount={data.buy_signals.length}
        filteredCount={filtered.length}
        onMinWinRateChange={setMinWinRate}
        onConfidenceToggle={toggleConfidence}
        onSortChange={setSortBy}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">条件に一致する買いシグナルはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((signal) => (
            <SignalCard
              key={`${signal.ticker}-${signal.pattern}`}
              signal={signal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
