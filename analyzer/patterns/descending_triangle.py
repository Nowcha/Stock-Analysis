"""
Descending Triangle pattern detector (sell signal, 75% win rate).

Pattern criteria:
  - Roughly horizontal support level: at least 2 troughs within ±3% of each other
  - Descending resistance: at least 2 peaks that are progressively lower
  - Duration: 15-60 trading days
  - Breakdown: price closes below the support level
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from .base import (
    KeyPoint,
    PatternDetail,
    Signal,
    find_peaks,
    find_troughs,
    fmt_date,
    first_breakout_down_idx,
    neckline_broken_down,
    price_within_tolerance,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "descending_triangle"
PATTERN_NAME_JA = "ディセンディングトライアングル"
WIN_RATE = 75
DIRECTION = "sell"

SUPPORT_TOLERANCE = 0.03    # troughs within ±3%
MIN_DAYS = 15
MAX_DAYS = 60
MIN_PEAKS = 2
MIN_TROUGHS = 2


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect descending triangle patterns."""
    if len(df) < MIN_DAYS + 5:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    peaks = find_peaks(close, order=5)
    troughs = find_troughs(close, order=5)

    for end_idx in range(MIN_DAYS + 5, len(df) - 1):
        start_idx = max(0, end_idx - MAX_DAYS)
        window_peaks = peaks[(peaks >= start_idx) & (peaks <= end_idx)]
        window_troughs = troughs[(troughs >= start_idx) & (troughs <= end_idx)]

        if len(window_peaks) < MIN_PEAKS or len(window_troughs) < MIN_TROUGHS:
            continue

        trough_prices = close[window_troughs]
        peak_prices = close[window_peaks]

        # Troughs must be at roughly the same level (horizontal support)
        support_level = float(np.mean(trough_prices))
        if not all(
            price_within_tolerance(float(p), support_level, SUPPORT_TOLERANCE)
            for p in trough_prices
        ):
            continue

        # Peaks must be descending (lower highs)
        if not bool(np.all(np.diff(peak_prices) < 0)):
            continue

        # Require breakdown below support after the last trough
        breakout_start = end_idx + 1
        if not neckline_broken_down(df, support_level, breakout_start):
            continue

        bo_idx = first_breakout_down_idx(df, support_level, breakout_start)
        if bo_idx is None:
            continue

        # Confidence: based on how well troughs align
        trough_spread = (float(np.max(trough_prices)) - float(np.min(trough_prices))) / support_level
        if trough_spread < 0.01:
            confidence = "high"
        elif trough_spread < 0.02:
            confidence = "medium"
        else:
            confidence = "low"

        first_peak_idx = int(window_peaks[0])
        last_peak_idx = int(window_peaks[-1])
        first_trough_idx = int(window_troughs[0])
        last_trough_idx = int(window_troughs[-1])

        signals.append(
            Signal(
                ticker=ticker,
                name=name,
                pattern=PATTERN_TYPE,
                pattern_name_ja=PATTERN_NAME_JA,
                win_rate=WIN_RATE,
                direction=DIRECTION,
                current_price=float(close[-1]),
                signal_price=support_level,
                pattern_detail=PatternDetail(
                    start_date=fmt_date(df, int(start_idx)),
                    end_date=fmt_date(df, bo_idx),
                    key_points=[
                        KeyPoint(fmt_date(df, first_peak_idx), float(close[first_peak_idx]), "resistance_start"),
                        KeyPoint(fmt_date(df, first_trough_idx), float(close[first_trough_idx]), "support_1"),
                        KeyPoint(fmt_date(df, last_peak_idx), float(close[last_peak_idx]), "resistance_end"),
                        KeyPoint(fmt_date(df, last_trough_idx), float(close[last_trough_idx]), "support_2"),
                        KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakdown"),
                    ],
                ),
                confidence=confidence,  # type: ignore[arg-type]
            )
        )
        break  # one signal per pass

    return signals
