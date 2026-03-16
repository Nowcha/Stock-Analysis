"""
Backtest engine: verifies past signals against actual OHLCV outcomes.
Reads public/data/signals/{date}.json and compares price HOLD_DAYS after signal.
"""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

HOLD_DAYS = 10  # Trading days after signal to evaluate win/loss


def _load_ohlcv(cache_dir: Path, ticker: str) -> pd.DataFrame | None:
    code = ticker.replace(".T", "")
    csv_path = cache_dir / "ohlcv" / f"{code}.csv"
    if not csv_path.exists():
        return None
    try:
        df = pd.read_csv(csv_path)
        df["Date"] = pd.to_datetime(df["Date"])
        return df.sort_values("Date").reset_index(drop=True)
    except Exception:
        return None


def _price_after_n_days(df: pd.DataFrame, from_date: str, n: int) -> float | None:
    """Return Close price n trading rows after from_date. None if not enough data."""
    future = df[df["Date"] >= from_date]
    if future.empty:
        return None
    base_idx = int(future.index[0])
    target_idx = base_idx + n
    if target_idx >= len(df):
        return None
    return float(df.loc[target_idx, "Close"])


def run_backtest(signals_dir: Path, cache_dir: Path) -> dict:  # type: ignore[type-arg]
    """
    Load all past signal files in signals_dir, verify each against OHLCV cache.
    Returns aggregated win-rate stats per pattern and overall.
    """
    pattern_stats: dict[str, dict[str, float | int]] = defaultdict(
        lambda: {"count": 0, "wins": 0, "total_return": 0.0}
    )
    overall_count = 0
    overall_wins = 0

    signal_files = [
        f
        for f in sorted(signals_dir.glob("*.json"))
        if f.stem not in ("latest", "history_index")
    ]

    for signal_file in signal_files:
        try:
            with open(signal_file, encoding="utf-8") as f:
                file_data = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read {signal_file}: {e}")
            continue

        all_sigs = file_data.get("buy_signals", []) + file_data.get("sell_signals", [])
        for sig in all_sigs:
            ticker: str = sig["ticker"]
            pattern: str = sig["pattern"]
            direction: str = sig["direction"]
            end_date: str = sig["pattern_detail"]["end_date"]
            signal_price: float = sig["signal_price"]

            df = _load_ohlcv(cache_dir, ticker)
            if df is None:
                continue

            exit_price = _price_after_n_days(df, end_date, HOLD_DAYS)
            if exit_price is None:
                continue  # Signal too recent — not yet verifiable

            if signal_price <= 0:
                continue

            ret_pct = (exit_price - signal_price) / signal_price * 100.0
            win = ret_pct > 0 if direction == "buy" else ret_pct < 0
            contribution = ret_pct if direction == "buy" else -ret_pct

            pattern_stats[pattern]["count"] = int(pattern_stats[pattern]["count"]) + 1
            if win:
                pattern_stats[pattern]["wins"] = int(pattern_stats[pattern]["wins"]) + 1
            pattern_stats[pattern]["total_return"] = (
                float(pattern_stats[pattern]["total_return"]) + contribution
            )

            overall_count += 1
            if win:
                overall_wins += 1

    per_pattern: dict[str, dict[str, float | int]] = {}
    for pat, stats in pattern_stats.items():
        count = int(stats["count"])
        wins = int(stats["wins"])
        per_pattern[pat] = {
            "count": count,
            "wins": wins,
            "win_rate": round(wins / count * 100, 1) if count > 0 else 0.0,
            "avg_return": round(float(stats["total_return"]) / count, 2) if count > 0 else 0.0,
        }

    return {
        "per_pattern": per_pattern,
        "overall_win_rate": (
            round(overall_wins / overall_count * 100, 1) if overall_count > 0 else None
        ),
        "total_verified": overall_count,
        "hold_days": HOLD_DAYS,
    }
