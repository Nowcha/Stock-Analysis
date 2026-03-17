import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Signal, SignalData } from "../types";

interface TickerEntry {
  detectedDate: string;
  signal: Signal;
  direction: "buy" | "sell";
}

interface TickerHistory {
  ticker: string;
  name: string;
  entries: TickerEntry[];
}

async function loadAllSnapshots(
  dates: string[],
  baseUrl: string
): Promise<Array<{ date: string; data: SignalData }>> {
  const results = await Promise.all(
    dates.map((date) =>
      fetch(baseUrl + "data/signals/" + date + ".json")
        .then((r) => (r.ok ? (r.json() as Promise<SignalData>) : Promise.reject()))
        .then((data) => ({ date, data }))
        .catch(() => null)
    )
  );
  return results.filter(
    (r): r is { date: string; data: SignalData } => r !== null
  );
}

function buildTickerMap(
  snapshots: Array<{ date: string; data: SignalData }>
): TickerHistory[] {
  const map = new Map<string, TickerHistory>();
  for (const { date, data } of snapshots) {
    const all: Array<{ signal: Signal; direction: "buy" | "sell" }> = [
      ...data.buy_signals.map((s) => ({ signal: s, direction: "buy" as const })),
      ...data.sell_signals.map((s) => ({ signal: s, direction: "sell" as const })),
    ];
    for (const { signal, direction } of all) {
      if (!map.has(signal.ticker)) {
        map.set(signal.ticker, { ticker: signal.ticker, name: signal.name, entries: [] });
      }
      const hist = map.get(signal.ticker)!;
      const key = signal.pattern + "-" + signal.pattern_detail.end_date;
      if (!hist.entries.some((e) => e.signal.pattern + "-" + e.signal.pattern_detail.end_date === key)) {
        hist.entries.push({ detectedDate: date, signal, direction });
      }
    }
  }
  const list = Array.from(map.values());
  list.sort((a, b) => {
    const aMax = a.entries.reduce((m, e) => (e.detectedDate > m ? e.detectedDate : m), "");
    const bMax = b.entries.reduce((m, e) => (e.detectedDate > m ? e.detectedDate : m), "");
    return bMax.localeCompare(aMax);
  });
  return list;
}

export function HistoryPage() {
  const [tickerList, setTickerList] = useState<TickerHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDates, setTotalDates] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    fetch(baseUrl + "data/history_index.json")
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ dates: string[] }>)
          : Promise.reject("HTTP " + r.status)
      )
      .then(async ({ dates }) => {
        setTotalDates(dates.length);
        const snapshots = await loadAllSnapshots(dates, baseUrl);
        setTickerList(buildTickerMap(snapshots));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return tickerList;
    const q = search.trim().toLowerCase();
    return tickerList.filter(
      (t) => t.ticker.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }, [tickerList, search]);

  function toggleExpand(ticker: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  }

  if (loading) {
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
  if (totalDates === 0) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
        履歴データがありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            シグナル履歴（銘柄別）
          </h1>
          <p className="text-xs text-gray-400">
            {totalDates}日分 / {tickerList.length}銘柄
          </p>
        </div>
        <input
          type="search"
          placeholder="銘柄コード・名称で絞り込み"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 min-h-[44px] text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((t) => {
          const isOpen = expanded.has(t.ticker);
          const latestDate = t.entries.reduce(
            (max, e) => (e.detectedDate > max ? e.detectedDate : max),
            ""
          );
          const buyCount = t.entries.filter((e) => e.direction === "buy").length;
          const sellCount = t.entries.filter((e) => e.direction === "sell").length;
          return (
            <div
              key={t.ticker}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(t.ticker)}
                className="w-full flex items-center justify-between px-4 min-h-[52px] text-left hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 shrink-0">
                    {t.ticker.replace(".T", "")}
                  </span>
                  <Link
                    to={"/stock/" + encodeURIComponent(t.ticker)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-700 hover:underline truncate"
                  >
                    {t.name}
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    {buyCount > 0 && (
                      <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                        買 {buyCount}
                      </span>
                    )}
                    {sellCount > 0 && (
                      <span className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                        売 {sellCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-gray-400">{latestDate}</span>
                  <span className="text-gray-400 text-xs">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {t.entries
                    .sort((a, b) => b.detectedDate.localeCompare(a.detectedDate))
                    .map((entry, idx) => {
                      const isBuy = entry.direction === "buy";
                      return (
                        <div
                          key={idx}
                          className="px-4 min-h-[44px] flex items-center gap-3 text-sm flex-wrap"
                        >
                          <span className="text-xs text-gray-400 w-24 shrink-0">
                            {entry.detectedDate}
                          </span>
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 " +
                              (isBuy
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700")
                            }
                          >
                            {isBuy ? "買い" : "売り"}
                          </span>
                          <span className="text-gray-700">
                            {entry.signal.pattern_name_ja}
                          </span>
                          <span className="text-xs text-gray-400">
                            勝率{" "}
                            <span className="font-medium text-gray-600">
                              {entry.signal.win_rate}%
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {entry.signal.pattern_detail.start_date} 〜{" "}
                            {entry.signal.pattern_detail.end_date}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            一致する銘柄が見つかりません
          </div>
        )}
      </div>
    </div>
  );
}
