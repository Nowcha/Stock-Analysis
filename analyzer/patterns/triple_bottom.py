"""
Triple Bottom pattern detector (buy signal, 82% win rate).

Pattern criteria:
  - Three troughs all within ±3% of each other
  - 20-100 trading days total span
  - Neckline = highest peak in the range
  - Price breaks above neckline after third trough
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
    first_breakout_up_idx,
    fmt_date,
    neckline_broken_up,
    price_within_tolerance,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "triple_bottom"
PATTERN_NAME_JA = "トリプルボトム"
WIN_RATE = 82
DIRECTION = "buy"

PRICE_TOLERANCE = 0.03
MIN_GAP = 15
MAX_GAP = 60
MIN_SPAN = 40
MAX_SPAN = 120


def _three_prices_close(p1: float, p2: float, p3: float, tol: float) -> bool:
    return (
        price_within_tolerance(p1, p2, tol)
        and price_within_tolerance(p2, p3, tol)
        and price_within_tolerance(p1, p3, tol)
    )


def _confidence(p1: float, p2: float, p3: float) -> str:
    max_diff = max(
        abs(p1 - p2) / max(p1, p2),
        abs(p2 - p3) / max(p2, p3),
        abs(p1 - p3) / max(p1, p3),
    )
    if max_diff < 0.01:
        return "high"
    if max_diff < 0.02:
        return "medium"
    return "low"


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect triple bottom patterns."""
    if len(df) < 50:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    troughs = find_troughs(close, order=7)
    peaks = find_peaks(close, order=5)

    for i in range(len(troughs) - 2):
        t1_idx = int(troughs[i])
        t2_idx = int(troughs[i + 1])
        t3_idx = int(troughs[i + 2])

        gap12 = t2_idx - t1_idx
        gap23 = t3_idx - t2_idx
        span = t3_idx - t1_idx

        if not (MIN_GAP <= gap12 <= MAX_GAP and MIN_GAP <= gap23 <= MAX_GAP):
            continue
        if not (MIN_SPAN <= span <= MAX_SPAN):
            continue

        t1p, t2p, t3p = close[t1_idx], close[t2_idx], close[t3_idx]
        if not _three_prices_close(t1p, t2p, t3p, PRICE_TOLERANCE):
            continue

        # Neckline: highest peak in the full range
        range_peaks = peaks[(peaks > t1_idx) & (peaks < t3_idx)]
        if len(range_peaks) == 0:
            continue
        neck_idx = int(range_peaks[np.argmax(close[range_peaks])])
        neck_price = float(close[neck_idx])

        if not neckline_broken_up(df, neck_price, t3_idx + 1):
            continue

        bo_idx = first_breakout_up_idx(df, neck_price, t3_idx + 1)
        if bo_idx is None:
            continue

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
                        KeyPoint(fmt_date(df, t1_idx), float(t1p), "bottom_1"),
                        KeyPoint(fmt_date(df, t2_idx), float(t2p), "bottom_2"),
                        KeyPoint(fmt_date(df, neck_idx), neck_price, "neckline"),
                        KeyPoint(fmt_date(df, t3_idx), float(t3p), "bottom_3"),
                        KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                    ],
                ),
                confidence=_confidence(t1p, t2p, t3p),  # type: ignore[arg-type]
            )
        )

    return signals
