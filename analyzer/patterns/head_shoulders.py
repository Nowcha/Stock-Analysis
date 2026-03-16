"""
Head & Shoulders pattern detector (sell signal, 95% win rate).

Pattern criteria:
  - Three consecutive peaks: left_shoulder, head (highest), right_shoulder
  - Head is higher than both shoulders
  - Left and right shoulder prices within ±5%
  - Two neckline troughs between shoulders
  - Price breaks below neckline after right shoulder
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

PATTERN_TYPE = "head_shoulders"
PATTERN_NAME_JA = "三尊"
WIN_RATE = 95
DIRECTION = "sell"

SHOULDER_TOLERANCE = 0.05
HEAD_MIN_HIGHER = 0.02
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
    """Detect head & shoulders patterns."""
    if len(df) < 50:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    peaks = find_peaks(close, order=7)
    troughs = find_troughs(close, order=5)

    for i in range(len(peaks) - 2):
        ls_idx = int(peaks[i])
        head_idx = int(peaks[i + 1])
        rs_idx = int(peaks[i + 2])

        ls_price = close[ls_idx]
        head_price = close[head_idx]
        rs_price = close[rs_idx]

        total_span = rs_idx - ls_idx
        if not (MIN_PATTERN_DAYS <= total_span <= MAX_PATTERN_DAYS):
            continue

        # Head must be highest
        if not (head_price > ls_price * (1 + HEAD_MIN_HIGHER) and
                head_price > rs_price * (1 + HEAD_MIN_HIGHER)):
            continue

        # Shoulders must be similar in price
        if not price_within_tolerance(ls_price, rs_price, SHOULDER_TOLERANCE):
            continue

        # Find neckline troughs
        left_troughs = troughs[(troughs > ls_idx) & (troughs < head_idx)]
        right_troughs = troughs[(troughs > head_idx) & (troughs < rs_idx)]
        if len(left_troughs) == 0 or len(right_troughs) == 0:
            continue

        left_neck_idx = int(left_troughs[np.argmin(close[left_troughs])])
        right_neck_idx = int(right_troughs[np.argmin(close[right_troughs])])
        neck_price = float((close[left_neck_idx] + close[right_neck_idx]) / 2)

        if not neckline_broken_down(df, neck_price, rs_idx + 1):
            continue

        bo_idx = first_breakout_down_idx(df, neck_price, rs_idx + 1)
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
