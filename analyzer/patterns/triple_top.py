"""
Triple Top pattern detector (sell signal, 84% win rate).

Pattern criteria:
  - Three peaks all within ±3% of each other
  - 15-60 trading days gap between consecutive peaks
  - Neckline = lowest trough in the range
  - Price breaks below neckline after third peak
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
    first_breakout_down_idx,
    fmt_date,
    neckline_broken_down,
    price_within_tolerance,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "triple_top"
PATTERN_NAME_JA = "トリプルトップ"
WIN_RATE = 84
DIRECTION = "sell"

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
    """Detect triple top patterns."""
    if len(df) < 50:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    peaks = find_peaks(close, order=7)
    troughs = find_troughs(close, order=5)

    for i in range(len(peaks) - 2):
        p1_idx = int(peaks[i])
        p2_idx = int(peaks[i + 1])
        p3_idx = int(peaks[i + 2])

        gap12 = p2_idx - p1_idx
        gap23 = p3_idx - p2_idx
        span = p3_idx - p1_idx

        if not (MIN_GAP <= gap12 <= MAX_GAP and MIN_GAP <= gap23 <= MAX_GAP):
            continue
        if not (MIN_SPAN <= span <= MAX_SPAN):
            continue

        p1p, p2p, p3p = close[p1_idx], close[p2_idx], close[p3_idx]
        if not _three_prices_close(p1p, p2p, p3p, PRICE_TOLERANCE):
            continue

        # Neckline: lowest trough in the full range
        range_troughs = troughs[(troughs > p1_idx) & (troughs < p3_idx)]
        if len(range_troughs) == 0:
            continue
        neck_idx = int(range_troughs[np.argmin(close[range_troughs])])
        neck_price = float(close[neck_idx])

        if not neckline_broken_down(df, neck_price, p3_idx + 1):
            continue

        bo_idx = first_breakout_down_idx(df, neck_price, p3_idx + 1)
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
                    start_date=fmt_date(df, p1_idx),
                    end_date=fmt_date(df, bo_idx),
                    key_points=[
                        KeyPoint(fmt_date(df, p1_idx), float(p1p), "top_1"),
                        KeyPoint(fmt_date(df, p2_idx), float(p2p), "top_2"),
                        KeyPoint(fmt_date(df, neck_idx), neck_price, "neckline"),
                        KeyPoint(fmt_date(df, p3_idx), float(p3p), "top_3"),
                        KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                    ],
                ),
                confidence=_confidence(p1p, p2p, p3p),  # type: ignore[arg-type]
            )
        )

    return signals
