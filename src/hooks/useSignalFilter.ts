import { useState, useCallback, useMemo } from "react";
import type { Signal, Confidence } from "../types";

export type SortKey = "win_rate_desc" | "confidence_desc" | "ticker_asc" | "date_desc";

const CONFIDENCE_ORDER: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface FilterState {
  minWinRate: number;
  confidences: Set<Confidence>;
  sortBy: SortKey;
}

const DEFAULT_FILTER: FilterState = {
  minWinRate: 75,
  confidences: new Set<Confidence>(["high", "medium", "low"]),
  sortBy: "win_rate_desc",
};

function sortSignals(signals: Signal[], sortBy: SortKey): Signal[] {
  const copy = [...signals];
  switch (sortBy) {
    case "win_rate_desc":
      return copy.sort((a, b) => b.win_rate - a.win_rate);
    case "confidence_desc":
      return copy.sort(
        (a, b) => CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence]
      );
    case "ticker_asc":
      return copy.sort((a, b) => a.ticker.localeCompare(b.ticker));
    case "date_desc":
      return copy.sort((a, b) =>
        b.pattern_detail.end_date.localeCompare(a.pattern_detail.end_date)
      );
  }
}

export function useSignalFilter(signals: Signal[]) {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const setMinWinRate = useCallback((v: number) => {
    setFilter((f) => ({ ...f, minWinRate: v }));
  }, []);

  const toggleConfidence = useCallback((c: Confidence) => {
    setFilter((f) => {
      const next = new Set(f.confidences);
      if (next.has(c)) {
        if (next.size > 1) next.delete(c); // keep at least one
      } else {
        next.add(c);
      }
      return { ...f, confidences: next };
    });
  }, []);

  const setSortBy = useCallback((s: SortKey) => {
    setFilter((f) => ({ ...f, sortBy: s }));
  }, []);

  const filtered = useMemo(() => {
    const base = signals.filter(
      (s) => s.win_rate >= filter.minWinRate && filter.confidences.has(s.confidence)
    );
    return sortSignals(base, filter.sortBy);
  }, [signals, filter]);

  return { filter, filtered, setMinWinRate, toggleConfidence, setSortBy };
}
