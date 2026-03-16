import { useCallback, useEffect, useState } from "react";
import type { PortfolioEntry } from "../types";

const STORAGE_KEY = "kabu-pattern-portfolio";

function loadFromStorage(): PortfolioEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PortfolioEntry[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: PortfolioEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

interface UsePortfolioResult {
  portfolio: PortfolioEntry[];
  addEntry: (entry: PortfolioEntry) => void;
  removeEntry: (ticker: string) => void;
  updateEntry: (ticker: string, updates: Partial<PortfolioEntry>) => void;
  isHolding: (ticker: string) => boolean;
  getEntry: (ticker: string) => PortfolioEntry | undefined;
}

export function usePortfolio(): UsePortfolioResult {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(portfolio);
  }, [portfolio]);

  const addEntry = useCallback((entry: PortfolioEntry) => {
    setPortfolio((prev) => {
      const exists = prev.some((e) => e.ticker === entry.ticker);
      if (exists) {
        return prev.map((e) => (e.ticker === entry.ticker ? entry : e));
      }
      return [...prev, entry];
    });
  }, []);

  const removeEntry = useCallback((ticker: string) => {
    setPortfolio((prev) => prev.filter((e) => e.ticker !== ticker));
  }, []);

  const updateEntry = useCallback(
    (ticker: string, updates: Partial<PortfolioEntry>) => {
      setPortfolio((prev) =>
        prev.map((e) => (e.ticker === ticker ? { ...e, ...updates } : e))
      );
    },
    []
  );

  const isHolding = useCallback(
    (ticker: string) => portfolio.some((e) => e.ticker === ticker),
    [portfolio]
  );

  const getEntry = useCallback(
    (ticker: string) => portfolio.find((e) => e.ticker === ticker),
    [portfolio]
  );

  return { portfolio, addEntry, removeEntry, updateEntry, isHolding, getEntry };
}
