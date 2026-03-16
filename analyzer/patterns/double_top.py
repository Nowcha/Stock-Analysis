"""
Double Top pattern detector (sell signal, 93% win rate).

Pattern criteria:
  - Two peaks within ±3% of each other
  - 20-80 trading days between peaks
  - A neckline trough exists between the two peaks
  - Price breaks below neckline after the second peak
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from .base import (
    Confidence,
    KeyPoint,
    PatternDetail,
    Signal,
    confidence_from_price_diff,
    find_peaks,
    find_troughs,
    first_breakout_down_idx,
    fmt_date,
    neckline_broken_down,
    price_within_tolerance,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "double_top"
PATTERN_NAME_JA = "ダブルトップ"
WIN_RATE = 93
DIRECTION = "sell"

MIN_GAP = 20
MAX_GAP = 80
PRICE_TOLERANCE = 0.03


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect double top patterns in the given OHLCV DataFrame."""
    if len(df) < 40:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    peaks = find_peaks(close, order=7)
    troughs = find_troughs(close, order=5)

    for i in range(len(peaks) - 1):
        for j in range(i + 1, len(peaks)):
            p1_idx, p2_idx = int(peaks[i]), int(peaks[j])
            p1_price, p2_price = close[p1_idx], close[p2_idx]
            gap = p2_idx - p1_idx

            if not (MIN_GAP <= gap <= MAX_GAP):
                continue
            if not price_within_tolerance(p1_price, p2_price, PRICE_TOLERANCE):
                continue

            # Find neckline: lowest trough between the two peaks
            between_troughs = troughs[(troughs > p1_idx) & (troughs < p2_idx)]
            if len(between_troughs) == 0:
                continue
            neck_idx = int(between_troughs[np.argmin(close[between_troughs])])
            neck_price = float(close[neck_idx])

            # Confirm neckline breakdown after second peak
            if not neckline_broken_down(df, neck_price, p2_idx + 1):
                continue

            bo_idx = first_breakout_down_idx(df, neck_price, p2_idx + 1)
            if bo_idx is None:
                continue

            confidence: Confidence = confidence_from_price_diff(p1_price, p2_price)

            signals.append(
                Signal(
                    ticker=ticker,
                    name=name,
                    pattern=PATTERN_TYPE,
                    pattern_name_ja=PATTERN_NAME_JA,
                    win_rate=WIN_RATE,
                    direction=DIRECTION,
                    current_price=float(close[-1]),
                    signal_price=neck_price,
                    pattern_detail=PatternDetail(
                        start_date=fmt_date(df, p1_idx),
                        end_date=fmt_date(df, bo_idx),
                        key_points=[
                            KeyPoint(fmt_date(df, p1_idx), float(p1_price), "top_1"),
                            KeyPoint(fmt_date(df, neck_idx), neck_price, "neckline"),
                            KeyPoint(fmt_date(df, p2_idx), float(p2_price), "top_2"),
                            KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                        ],
                    ),
                    confidence=confidence,
                )
            )

    return signals
