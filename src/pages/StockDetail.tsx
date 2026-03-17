import { useParams, Link } from "react-router-dom";
import { useSignals } from "../hooks/useSignals";
import { PatternChart } from "../components/PatternChart";
import { PriceChart } from "../components/PriceChart";
import { PATTERN_META } from "../data/pattern-meta";
import type { Signal } from "../types";

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

function SignalDetail({ signal }: { signal: Signal }) {
  const meta = PATTERN_META[signal.pattern];
  const isBuy = signal.direction === "buy";
  const accent = isBuy ? "text-green-700" : "text-red-700";
  const badge = isBuy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  const border = isBuy ? "border-l-green-500" : "border-l-red-500";

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${border} bg-white p-5 shadow-sm`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
          {isBuy ? "買い" : "売り"}
        </span>
        <span className={`text-base font-semibold ${accent}`}>
          {signal.pattern_name_ja}
        </span>
        <span className="text-xs text-gray-500">
          勝率 <span className="font-semibold text-gray-700">{signal.win_rate}%</span>
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_COLOR[signal.confidence]}`}>
          確信度：{CONFIDENCE_LABEL[signal.confidence]}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3">{meta?.description ?? ""}</p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
        <div className="text-gray-500">現在値</div>
        <div className="font-semibold text-gray-900">¥{signal.current_price.toLocaleString()}</div>
        <div className="text-gray-500">シグナル価格</div>
        <div className="font-semibold text-gray-900">¥{signal.signal_price.toLocaleString()}</div>
        <div className="text-gray-500">検出期間</div>
        <div className="text-gray-700">{signal.pattern_detail.start_date} 〜 {signal.pattern_detail.end_date}</div>
      </div>

      {/* Daily price chart — shown when ohlcv data is available */}
      {signal.ohlcv && signal.ohlcv.length >= 2 ? (
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">日足チャート（直近90営業日）</p>
            <p className="text-xs text-gray-400">
              シグナル期間:
              <span className="font-medium text-gray-600 ml-1">
                {signal.pattern_detail.start_date} 〜 {signal.pattern_detail.end_date}
              </span>
            </p>
          </div>
          <PriceChart
            ohlcv={signal.ohlcv}
            keyPoints={signal.pattern_detail.key_points}
            patternStart={signal.pattern_detail.start_date}
            patternEnd={signal.pattern_detail.end_date}
            direction={signal.direction}
            height={220}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {signal.pattern_detail.key_points.map((kp, i) => (
              <div key={i} className="text-xs text-gray-500">
                <span className="font-medium">{kp.label.replace(/_/g, " ")}</span>
                {" "}¥{kp.price.toLocaleString()} ({kp.date.slice(5)})
              </div>
            ))}
          </div>
        </div>
      ) : signal.pattern_detail.key_points.length >= 2 ? (
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-400 mb-2">パターンチャート</p>
          <PatternChart
            keyPoints={signal.pattern_detail.key_points}
            direction={signal.direction}
            width={460}
            height={140}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {signal.pattern_detail.key_points.map((kp, i) => (
              <div key={i} className="text-xs text-gray-500">
                <span className="font-medium">{kp.label.replace(/_/g, " ")}</span>
                {" "}¥{kp.price.toLocaleString()} ({kp.date.slice(5)})
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const decodedTicker = ticker ? decodeURIComponent(ticker) : "";
  const { data, loading, error } = useSignals();

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-500 text-sm">
        読み込み中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error ?? "データを取得できませんでした"}
      </div>
    );
  }

  const allSignals = [...data.buy_signals, ...data.sell_signals].filter(
    (s) => s.ticker === decodedTicker
  );

  const stockName = allSignals[0]?.name ?? decodedTicker;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← 戻る
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{stockName}</h1>
          <p className="text-xs text-gray-500">{decodedTicker}</p>
        </div>
      </div>

      {allSignals.length === 0 ? (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
          本日のシグナルはありません
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {data.market_date} 時点のシグナル（{allSignals.length}件）
          </p>
          {allSignals.map((s, i) => (
            <SignalDetail key={i} signal={s} />
          ))}
        </div>
      )}
    </div>
  );
}
