"""
Signal generator: runs all pattern detectors and writes JSON output.
Outputs public/data/latest.json and public/data/signals/{date}.json.
"""

from __future__ import annotations

import dataclasses
import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from .patterns import (
    ascending_pennant,
    cup_with_handle,
    descending_triangle,
    double_bottom,
    double_top,
    falling_wedge,
    head_shoulders,
    inverse_head_shoulders,
    inverse_v,
    rising_wedge,
    spike_bottom,
    spike_top,
    triple_bottom,
    triple_top,
)
from .patterns.base import Signal

logger = logging.getLogger(__name__)

JST = timezone(timedelta(hours=9))

# All detectors in priority order (higher win_rate first)
DETECTORS = [
    inverse_head_shoulders,  # 95%
    head_shoulders,           # 95%
    double_top,               # 93%
    spike_bottom,             # 91%
    spike_top,                # 90%
    double_bottom,            # 89%
    ascending_pennant,        # 86%
    cup_with_handle,          # 84%
    triple_top,               # 84%
    triple_bottom,            # 82%
    inverse_v,                # 81%
    rising_wedge,             # 77%
    descending_triangle,      # 75%
    falling_wedge,            # 72%
]


def _deduplicate(signals: list[Signal]) -> list[Signal]:
    """Keep only the most recently detected signal per (ticker, pattern) pair."""
    seen: set[tuple[str, str]] = set()
    result: list[Signal] = []
    for sig in signals:
        key = (sig.ticker, sig.pattern)
        if key not in seen:
            seen.add(key)
            result.append(sig)
    return result


def _signal_to_dict(signal: Signal) -> dict:  # type: ignore[type-arg]
    """Convert Signal dataclass to JSON-serializable dict."""
    d = dataclasses.asdict(signal)
    return d


class SignalGenerator:
    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir
        self.signals_dir = output_dir / "signals"
        self.signals_dir.mkdir(parents=True, exist_ok=True)

    def run_all(
        self,
        data: dict[str, pd.DataFrame],
        ticker_names: dict[str, str],
    ) -> tuple[list[Signal], list[Signal]]:
        """
        Run all pattern detectors on all tickers.
        Returns (buy_signals, sell_signals) sorted by win_rate descending.
        """
        all_buy: list[Signal] = []
        all_sell: list[Signal] = []
        total_tickers = len(data)
        processed = 0

        for ticker, df in data.items():
            code = ticker.replace(".T", "")
            name = ticker_names.get(code, code)

            for detector in DETECTORS:
                try:
                    found = detector.detect(df, ticker, name)
                    for sig in found:
                        if sig.direction == "buy":
                            all_buy.append(sig)
                        else:
                            all_sell.append(sig)
                except Exception as e:
                    logger.warning(
                        f"Pattern error {detector.__name__} for {ticker}: {e}"
                    )

            processed += 1
            if processed % 50 == 0:
                logger.info(f"Pattern detection: {processed}/{total_tickers} tickers done")

        # Sort by win_rate desc, then deduplicate per ticker×pattern
        all_buy.sort(key=lambda s: s.win_rate, reverse=True)
        all_sell.sort(key=lambda s: s.win_rate, reverse=True)

        buy_signals = _deduplicate(all_buy)
        sell_signals = _deduplicate(all_sell)

        logger.info(
            f"Detection complete: {len(buy_signals)} buy, {len(sell_signals)} sell signals"
        )
        return buy_signals, sell_signals

    def write_json(
        self,
        buy_signals: list[Signal],
        sell_signals: list[Signal],
        market_date: str,
        total_analyzed: int = 225,
        backtest: dict | None = None,  # type: ignore[type-arg]
    ) -> None:
        """Write latest.json and signals/{date}.json."""
        now = datetime.now(JST)
        payload: dict = {  # type: ignore[type-arg]
            "analyzed_at": now.isoformat(),
            "market_date": market_date,
            "total_analyzed": total_analyzed,
            "buy_signals": [_signal_to_dict(s) for s in buy_signals],
            "sell_signals": [_signal_to_dict(s) for s in sell_signals],
        }
        if backtest is not None:
            payload["backtest"] = backtest

        latest_path = self.output_dir / "latest.json"
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        logger.info(f"Written: {latest_path}")

        dated_path = self.signals_dir / f"{market_date}.json"
        with open(dated_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        logger.info(f"Written: {dated_path}")

        self._write_history_index()

    def _write_history_index(self) -> None:
        """Write history_index.json listing all available signal dates in descending order."""
        dates = sorted(
            [p.stem for p in self.signals_dir.glob("*.json") if p.stem != "latest"],
            reverse=True,
        )
        index_path = self.output_dir / "history_index.json"
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump({"dates": dates}, f, ensure_ascii=False)
        logger.info(f"Written: {index_path}")
