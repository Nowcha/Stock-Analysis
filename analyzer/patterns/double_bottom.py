"""
Double Bottom pattern detector (buy signal, 89% win rate).

Pattern criteria:
  - Two troughs within ±3% of each other
  - 20-80 trading days between troughs
  - A neckline peak exists between the two troughs
  - Price breaks above neckline after the second trough
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
    first_breakout_up_idx,
    fmt_date,
    neckline_broken_up,
    price_within_tolerance,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "double_bottom"
PATTERN_NAME_JA = "ダブルボトム"
WIN_RATE = 89
DIRECTION = "buy"

MIN_GAP = 20
MAX_GAP = 80
PRICE_TOLERANCE = 0.03


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect double bottom patterns in the given OHLCV DataFrame."""
    if len(df) < 40:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    troughs = find_troughs(close, order=7)
    peaks = find_peaks(close, order=5)

    for i in range(len(troughs) - 1):
        for j in range(i + 1, len(troughs)):
            t1_idx, t2_idx = int(troughs[i]), int(troughs[j])
            t1_price, t2_price = close[t1_idx], close[t2_idx]
            gap = t2_idx - t1_idx

            if not (MIN_GAP <= gap <= MAX_GAP):
                continue
            if not price_within_tolerance(t1_price, t2_price, PRICE_TOLERANCE):
                continue

            # Find neckline: highest peak between the two troughs
            between_peaks = peaks[(peaks > t1_idx) & (peaks < t2_idx)]
            if len(between_peaks) == 0:
                continue
            neck_idx = int(between_peaks[np.argmax(close[between_peaks])])
            neck_price = float(close[neck_idx])

            # Confirm neckline breakout after second trough
            if not neckline_broken_up(df, neck_price, t2_idx + 1):
                continue

            bo_idx = first_breakout_up_idx(df, neck_price, t2_idx + 1)
            if bo_idx is None:
                continue

            confidence: Confidence = confidence_from_price_diff(t1_price, t2_price)

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
                        start_date=fmt_date(df, t1_idx),
                        end_date=fmt_date(df, bo_idx),
                        key_points=[
                            KeyPoint(fmt_date(df, t1_idx), float(t1_price), "bottom_1"),
                            KeyPoint(fmt_date(df, neck_idx), neck_price, "neckline"),
                            KeyPoint(fmt_date(df, t2_idx), float(t2_price), "bottom_2"),
                            KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                        ],
                    ),
                    confidence=confidence,
                )
            )

    return signals
