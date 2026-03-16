import { useCallback, useEffect, useState } from "react";
import type { SignalData } from "../types";

const DATA_URL = `${import.meta.env.BASE_URL}data/latest.json`;

interface UseSignalsResult {
  data: SignalData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSignals(): UseSignalsResult {
  const [data, setData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: SignalData = await res.json();
      setData(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
