"""
Inverse Head & Shoulders pattern detector (buy signal, 95% win rate).

Pattern criteria:
  - Three consecutive troughs: left_shoulder, head (deepest), right_shoulder
  - Head is deeper than both shoulders
  - Left and right shoulder prices within ±5%
  - Two neckline peaks between shoulders (average = horizontal neckline, Phase 1 approx.)
  - Price breaks above neckline after right shoulder
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

PATTERN_TYPE = "inverse_head_shoulders"
PATTERN_NAME_JA = "逆三尊"
WIN_RATE = 95
DIRECTION = "buy"

SHOULDER_TOLERANCE = 0.05
HEAD_MIN_DEEPER = 0.02  # head must be at least 2% deeper than both shoulders
MIN_PATTERN_DAYS = 30
MAX_PATTERN_DAYS = 120


def _confidence(left_price: float, right_price: float) -> str:
    diff = abs(left_price - right_price) / max(left_price, right_price)
    if diff < 0.01:
        return "high"
    if diff < 0.03:
        return "medium"
    return "low"


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect inverse head & shoulders patterns."""
    if len(df) < 50:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    troughs = find_troughs(close, order=7)
    peaks = find_peaks(close, order=5)

    for i in range(len(troughs) - 2):
        ls_idx = int(troughs[i])
        head_idx = int(troughs[i + 1])
        rs_idx = int(troughs[i + 2])

        ls_price = close[ls_idx]
        head_price = close[head_idx]
        rs_price = close[rs_idx]

        total_span = rs_idx - ls_idx
        if not (MIN_PATTERN_DAYS <= total_span <= MAX_PATTERN_DAYS):
            continue

        # Head must be deepest
        if not (head_price < ls_price * (1 - HEAD_MIN_DEEPER) and
                head_price < rs_price * (1 - HEAD_MIN_DEEPER)):
            continue

        # Shoulders must be similar in price
        if not price_within_tolerance(ls_price, rs_price, SHOULDER_TOLERANCE):
            continue

        # Find neckline peaks: one between ls and head, one between head and rs
        left_peaks = peaks[(peaks > ls_idx) & (peaks < head_idx)]
        right_peaks = peaks[(peaks > head_idx) & (peaks < rs_idx)]
        if len(left_peaks) == 0 or len(right_peaks) == 0:
            continue

        left_neck_idx = int(left_peaks[np.argmax(close[left_peaks])])
        right_neck_idx = int(right_peaks[np.argmax(close[right_peaks])])
        neck_price = float((close[left_neck_idx] + close[right_neck_idx]) / 2)

        # Confirm neckline breakout after right shoulder
        if not neckline_broken_up(df, neck_price, rs_idx + 1):
            continue

        bo_idx = first_breakout_up_idx(df, neck_price, rs_idx + 1)
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
                    start_date=fmt_date(df, ls_idx),
                    end_date=fmt_date(df, bo_idx),
                    key_points=[
                        KeyPoint(fmt_date(df, ls_idx), float(ls_price), "left_shoulder"),
                        KeyPoint(fmt_date(df, left_neck_idx), float(close[left_neck_idx]), "left_neckline"),
                        KeyPoint(fmt_date(df, head_idx), float(head_price), "head"),
                        KeyPoint(fmt_date(df, right_neck_idx), float(close[right_neck_idx]), "right_neckline"),
                        KeyPoint(fmt_date(df, rs_idx), float(rs_price), "right_shoulder"),
                        KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                    ],
                ),
                confidence=_confidence(ls_price, rs_price),  # type: ignore[arg-type]
            )
        )

    return signals
