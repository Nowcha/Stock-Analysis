import { usePortfolio } from "../hooks/usePortfolio";
import { useSignals } from "../hooks/useSignals";
import { SignalCard } from "./SignalCard";

export function SellSignals() {
  const { data, loading, error, refetch } = useSignals();
  const { isHolding, getEntry, portfolio } = usePortfolio();

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

  if (portfolio.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">売りシグナル</h2>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">ポートフォリオに銘柄を登録すると</p>
          <p className="text-gray-500">保有銘柄の売りシグナルが表示されます</p>
          <a
            href="#/portfolio"
            className="mt-3 inline-block rounded bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
          >
            ポートフォリオを管理する →
          </a>
        </div>
      </div>
    );
  }

  const filteredSignals = data.sell_signals.filter((sig) =>
    isHolding(sig.ticker)
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">売りシグナル</h2>
          <p className="text-sm text-gray-500">
            分析日: {data.market_date}　保有銘柄 {portfolio.length} 件中 {filteredSignals.length} 件にシグナル
          </p>
        </div>
      </div>

      {filteredSignals.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">保有銘柄に売りシグナルはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => {
            const entry = getEntry(signal.ticker);
            return (
              <SignalCard
                key={`${signal.ticker}-${signal.pattern}`}
                signal={signal}
                showPnL
                buyPrice={entry?.buy_price}
                quantity={entry?.quantity}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
