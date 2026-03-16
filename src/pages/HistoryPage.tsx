import { useState, useEffect } from "react";
import type { SignalData } from "../types";
import { SignalCard } from "../components/SignalCard";

interface HistoryIndex {
  dates: string[];
}

export function HistoryPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/history_index.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HistoryIndex>;
      })
      .then((data) => {
        setDates(data.dates);
        if (data.dates.length > 0) {
          setSelectedDate(data.dates[0]);
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "履歴インデックスの取得に失敗しました");
      })
      .finally(() => setLoadingIndex(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSignals(true);
    setSignalData(null);
    const url = `${import.meta.env.BASE_URL}data/signals/${selectedDate}.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SignalData>;
      })
      .then(setSignalData)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "シグナルの取得に失敗しました");
      })
      .finally(() => setLoadingSignals(false));
  }, [selectedDate]);

  if (loadingIndex) {
    return (
      <div className="flex justify-center py-16 text-gray-500 text-sm">
        履歴を読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
        履歴データがありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">シグナル履歴</h1>
        <select
          value={selectedDate ?? ""}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {loadingSignals && (
        <div className="flex justify-center py-8 text-gray-500 text-sm">
          読み込み中...
        </div>
      )}

      {signalData && !loadingSignals && (
        <>
          <div className="text-xs text-gray-400">
            分析日時: {new Date(signalData.analyzed_at).toLocaleString("ja-JP")} ／ 分析銘柄数: {signalData.total_analyzed}
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-green-700">
              買いシグナル（{signalData.buy_signals.length}件）
            </h2>
            {signalData.buy_signals.length === 0 ? (
              <p className="text-sm text-gray-400">該当なし</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {signalData.buy_signals.map((s, i) => (
                  <SignalCard key={i} signal={s} showChart />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-red-700">
              売りシグナル（{signalData.sell_signals.length}件）
            </h2>
            {signalData.sell_signals.length === 0 ? (
              <p className="text-sm text-gray-400">該当なし</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {signalData.sell_signals.map((s, i) => (
                  <SignalCard key={i} signal={s} showChart />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
