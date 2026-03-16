"""
KabuPattern analysis engine entry point.
Run from repository root: python -m analyzer.main
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import date
from pathlib import Path

# Ensure working directory is always the repository root
os.chdir(Path(__file__).parent.parent)

from .cache_manager import CacheManager
from .fetcher import fetch_all_tickers
from .nikkei225 import NIKKEI225, get_all_tickers
from .signal_generator import SignalGenerator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("=== KabuPattern Analysis Start ===")

    cache_dir = Path("data/cache")
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Initialize cache manager
    cache_mgr = CacheManager(cache_dir=cache_dir)

    # Step 2: Fetch incremental OHLCV data for all tickers
    tickers = get_all_tickers()
    logger.info(f"Total tickers: {len(tickers)}")
    data = fetch_all_tickers(tickers, cache_mgr)
    logger.info(f"Successfully loaded: {len(data)}/{len(tickers)} tickers")

    if not data:
        logger.error("No data available — skipping analysis")
        sys.exit(1)

    # Step 3: Run pattern detection and write JSON
    generator = SignalGenerator(output_dir)
    buy_sigs, sell_sigs = generator.run_all(data, NIKKEI225)

    market_date = str(date.today())
    generator.write_json(
        buy_sigs,
        sell_sigs,
        market_date=market_date,
        total_analyzed=len(data),
    )

    # Step 4: Cleanup old signal files
    deleted_signals = cache_mgr.cleanup_signals(output_dir / "signals")
    if deleted_signals:
        logger.info(f"Deleted {len(deleted_signals)} old signal files")

    # Step 5: Cleanup stale ticker caches
    deleted_tickers = cache_mgr.cleanup_stale_tickers(tickers)
    if deleted_tickers:
        logger.info(f"Deleted {len(deleted_tickers)} stale ticker caches")

    # Step 6: Update meta.json
    meta = cache_mgr.load_meta()
    meta["last_updated"] = market_date
    for ticker, df in data.items():
        code = ticker.replace(".T", "")
        meta.setdefault("tickers", {})[code] = {
            "last_date": str(df.iloc[-1]["Date"].date()),
            "rows": len(df),
        }
    cache_mgr.save_meta(meta)

    logger.info(
        f"=== Analysis Complete: {len(buy_sigs)} buy, {len(sell_sigs)} sell signals ==="
    )


if __name__ == "__main__":
    main()
