"""
Incremental stock data fetcher using yfinance.
Fetches only new data since last cached date.
"""

import logging
import time
from datetime import date, timedelta

import pandas as pd
import yfinance as yf

from .cache_manager import CacheManager

logger = logging.getLogger(__name__)

MAX_RETRY = 3
RETRY_DELAY_SEC = 2
BATCH_SIZE = 50
BATCH_SLEEP_SEC = 5
FULL_FETCH_DAYS = 183  # ~6 months


def _fetch_yfinance(ticker: str, start: str, end: str) -> pd.DataFrame:
    """
    Fetch OHLCV data from yfinance for a single ticker.
    Handles MultiIndex columns (yfinance v0.2+).
    Returns empty DataFrame on failure after MAX_RETRY attempts.
    """
    for attempt in range(MAX_RETRY):
        try:
            raw = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
            if raw is None or raw.empty:
                logger.debug(f"No data for {ticker} [{start}:{end}]")
                return pd.DataFrame()

            df = raw.reset_index()

            # Flatten MultiIndex columns (yfinance v0.2+ returns MultiIndex for single ticker too)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [col[0] if col[1] == "" else col[0] for col in df.columns]

            # Ensure expected columns exist
            col_map: dict[str, str] = {}
            for col in df.columns:
                col_lower = str(col).lower()
                if col_lower in ("date", "datetime"):
                    col_map[col] = "Date"
                elif col_lower == "open":
                    col_map[col] = "Open"
                elif col_lower == "high":
                    col_map[col] = "High"
                elif col_lower == "low":
                    col_map[col] = "Low"
                elif col_lower == "close":
                    col_map[col] = "Close"
                elif col_lower == "volume":
                    col_map[col] = "Volume"
            df = df.rename(columns=col_map)

            required = {"Date", "Open", "High", "Low", "Close", "Volume"}
            missing = required - set(df.columns)
            if missing:
                logger.warning(f"Missing columns {missing} for {ticker}")
                return pd.DataFrame()

            df["Date"] = pd.to_datetime(df["Date"]).dt.normalize()
            return df[["Date", "Open", "High", "Low", "Close", "Volume"]].copy()

        except Exception as e:
            logger.warning(f"Fetch attempt {attempt + 1}/{MAX_RETRY} failed for {ticker}: {e}")
            if attempt < MAX_RETRY - 1:
                time.sleep(RETRY_DELAY_SEC)

    logger.error(f"All {MAX_RETRY} attempts failed for {ticker}")
    return pd.DataFrame()


def fetch_incremental(ticker: str, cache_mgr: CacheManager) -> pd.DataFrame | None:
    """
    Fetch incremental data for a single ticker.

    Logic:
      - No cache / no last_date   → full 6-month fetch
      - delta == 0                → already up to date, return cache
      - delta 1-60 days           → fetch diff only
      - delta > 60 days           → full 6-month re-fetch
      - Fetch failure             → return existing cache (None if none)
    """
    meta = cache_mgr.load_meta()
    code = ticker.replace(".T", "")
    ticker_meta: dict[str, object] = meta.get("tickers", {}).get(code, {})
    last_date_str: str | None = ticker_meta.get("last_date")  # type: ignore[assignment]

    today = date.today()
    full_start = str(today - timedelta(days=FULL_FETCH_DAYS))
    full_end = str(today)

    csv_exists = (cache_mgr.ohlcv_dir / f"{code}.csv").exists()

    if last_date_str is None or not csv_exists:
        logger.info(f"[FULL] {ticker}")
        df_new = _fetch_yfinance(ticker, start=full_start, end=full_end)
    else:
        last_date = date.fromisoformat(last_date_str)
        delta_days = (today - last_date).days

        if delta_days <= 0:
            logger.debug(f"[SKIP] {ticker} already up to date")
            return cache_mgr.load_cache(ticker)

        if delta_days <= cache_mgr.FULL_FETCH_THRESHOLD_DAYS:
            start = str(last_date + timedelta(days=1))
            logger.info(f"[DIFF] {ticker}: {start} → {today}")
            df_new = _fetch_yfinance(ticker, start=start, end=full_end)
        else:
            logger.info(f"[FULL/STALE] {ticker}: {delta_days} days gap")
            df_new = _fetch_yfinance(ticker, start=full_start, end=full_end)

    if df_new.empty:
        logger.warning(f"[WARN] No new data for {ticker}, keeping existing cache")
        return cache_mgr.load_cache(ticker)

    result = cache_mgr.append_and_trim(ticker, df_new)
    logger.debug(f"[CACHED] {ticker}: {len(result)} rows")
    return result


def fetch_all_tickers(
    tickers: list[str],
    cache_mgr: CacheManager,
) -> dict[str, pd.DataFrame]:
    """
    Fetch all tickers incrementally.
    Sleeps BATCH_SLEEP_SEC every BATCH_SIZE tickers to avoid rate limiting.
    Returns dict of ticker -> DataFrame (only successfully fetched tickers).
    """
    results: dict[str, pd.DataFrame] = {}
    total = len(tickers)

    for i, ticker in enumerate(tickers):
        df = fetch_incremental(ticker, cache_mgr)
        if df is not None and not df.empty:
            results[ticker] = df
        else:
            logger.warning(f"[SKIP] {ticker}: no data available")

        if (i + 1) % BATCH_SIZE == 0 and (i + 1) < total:
            logger.info(f"Batch sleep {BATCH_SLEEP_SEC}s after {i + 1}/{total} tickers...")
            time.sleep(BATCH_SLEEP_SEC)

    logger.info(f"Fetch complete: {len(results)}/{total} tickers successful")
    return results
