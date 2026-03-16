"""
Cache manager for OHLCV data and signal JSON files.
Handles read/write/cleanup of CSV caches and meta.json.
"""

import json
import logging
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)


class CacheManager:
    OHLCV_RETENTION_DAYS: int = 183       # ~6 months
    SIGNAL_RETENTION_DAYS: int = 30
    FULL_FETCH_THRESHOLD_DAYS: int = 60

    def __init__(self, cache_dir: Path = Path("data/cache")) -> None:
        self.cache_dir = cache_dir
        self.ohlcv_dir = cache_dir / "ohlcv"
        self.meta_file = cache_dir / "meta.json"
        self.ohlcv_dir.mkdir(parents=True, exist_ok=True)

    def _code(self, ticker: str) -> str:
        """Normalize ticker to 4-digit code: "7203.T" -> "7203" """
        return ticker.replace(".T", "")

    def load_cache(self, ticker: str) -> pd.DataFrame | None:
        """Load OHLCV CSV for ticker. Returns None if missing or corrupted."""
        code = self._code(ticker)
        csv_path = self.ohlcv_dir / f"{code}.csv"
        if not csv_path.exists():
            return None
        try:
            df = pd.read_csv(csv_path, parse_dates=["Date"])
            df = df.sort_values("Date").reset_index(drop=True)
            return df
        except Exception as e:
            logger.warning(f"Cache read error for {code}: {e} — deleting corrupted file")
            csv_path.unlink(missing_ok=True)
            return None

    def save_cache(self, ticker: str, df: pd.DataFrame) -> None:
        """Save DataFrame to CSV (Date ascending)."""
        code = self._code(ticker)
        df_sorted = df.sort_values("Date").reset_index(drop=True)
        df_sorted.to_csv(
            self.ohlcv_dir / f"{code}.csv",
            index=False,
            date_format="%Y-%m-%d",
        )

    def append_and_trim(self, ticker: str, new_data: pd.DataFrame) -> pd.DataFrame:
        """
        Append new_data to existing cache, remove duplicates,
        trim rows older than OHLCV_RETENTION_DAYS, and save.
        Returns the resulting DataFrame.
        """
        existing = self.load_cache(ticker)
        if existing is not None and not existing.empty:
            combined = pd.concat([existing, new_data], ignore_index=True)
        else:
            combined = new_data.copy()

        combined = combined.drop_duplicates(subset=["Date"])

        cutoff = pd.Timestamp(date.today() - timedelta(days=self.OHLCV_RETENTION_DAYS))
        combined = combined[combined["Date"] >= cutoff]
        combined = combined.sort_values("Date").reset_index(drop=True)

        self.save_cache(ticker, combined)
        return combined

    def cleanup_signals(self, signals_dir: Path) -> list[str]:
        """
        Delete signal JSON files older than SIGNAL_RETENTION_DAYS.
        Skips latest.json and any file whose stem is not a valid ISO date.
        Returns list of deleted filenames.
        """
        cutoff = date.today() - timedelta(days=self.SIGNAL_RETENTION_DAYS)
        deleted: list[str] = []
        for f in signals_dir.glob("*.json"):
            try:
                file_date = date.fromisoformat(f.stem)
                if file_date < cutoff:
                    f.unlink()
                    deleted.append(f.name)
                    logger.debug(f"Deleted old signal: {f.name}")
            except ValueError:
                pass  # latest.json or non-date files — skip
        return deleted

    def cleanup_stale_tickers(self, active_tickers: list[str]) -> list[str]:
        """
        Delete CSV files for tickers no longer in active_tickers.
        Returns list of deleted filenames.
        """
        active_codes = {self._code(t) for t in active_tickers}
        deleted: list[str] = []
        for csv_file in self.ohlcv_dir.glob("*.csv"):
            if csv_file.stem not in active_codes:
                csv_file.unlink()
                deleted.append(csv_file.name)
                logger.info(f"Deleted stale ticker cache: {csv_file.name}")
        return deleted

    def load_meta(self) -> dict:  # type: ignore[type-arg]
        """Load meta.json. Returns default structure if file does not exist."""
        if not self.meta_file.exists():
            return {
                "last_updated": None,
                "tickers": {},
                "schema_version": 1,
            }
        try:
            with open(self.meta_file, encoding="utf-8") as f:
                return json.load(f)  # type: ignore[no-any-return]
        except Exception as e:
            logger.warning(f"meta.json read error: {e} — returning default")
            return {"last_updated": None, "tickers": {}, "schema_version": 1}

    def save_meta(self, meta: dict) -> None:  # type: ignore[type-arg]
        """Save meta.json."""
        with open(self.meta_file, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
