"""
Inverted V pattern detector (sell signal, 81% win rate).

Pattern criteria:
  - A single prominent peak
  - Left side: price rises ~10%+ over 10-20 days leading to peak
  - Right side: price falls ~10%+ over 10-20 days from peak
  - Symmetry: left and right decline rates within 40% of each other
  - Current price below 80% of peak (confirming breakdown)
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from .base import KeyPoint, PatternDetail, Signal, find_peaks, fmt_date

logger = logging.getLogger(__name__)

PATTERN_TYPE = "inverse_v"
PATTERN_NAME_JA = "逆V字"
WIN_RATE = 81
DIRECTION = "sell"

LOOK_BACK = 15
LOOK_FORWARD = 15
MIN_RISE_PCT = 0.10   # 10% rise leading into peak
MIN_FALL_PCT = 0.10   # 10% fall after peak
SYMMETRY_RATIO = 0.40  # left vs right move within 40%
BREAKDOWN_LEVEL = 0.80  # current price < 80% of peak


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect inverted V patterns."""
    if len(df) < LOOK_BACK + LOOK_FORWARD + 10:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    peaks = find_peaks(close, order=7)

    for peak_idx_raw in peaks:
        peak_idx = int(peak_idx_raw)
        # Need enough bars on both sides
        if peak_idx < LOOK_BACK or peak_idx > len(close) - LOOK_FORWARD - 1:
            continue

        peak_price = close[peak_idx]
        pre_price = close[peak_idx - LOOK_BACK]
        post_price = close[peak_idx + LOOK_FORWARD]

        rise_pct = (peak_price - pre_price) / pre_price
        fall_pct = (peak_price - post_price) / peak_price  # positive = fell

        if rise_pct < MIN_RISE_PCT:
            continue
        if fall_pct < MIN_FALL_PCT:
            continue

        # Symmetry check
        if rise_pct > 0 and fall_pct > 0:
            ratio = min(rise_pct, fall_pct) / max(rise_pct, fall_pct)
            if ratio < (1 - SYMMETRY_RATIO):
                continue

        # Current price must be below breakdown threshold
        if close[-1] > peak_price * BREAKDOWN_LEVEL:
            continue

        depth = max(rise_pct, fall_pct)
        symmetry = min(rise_pct, fall_pct) / max(rise_pct, fall_pct) if max(rise_pct, fall_pct) > 0 else 0
        if depth >= 0.20 and symmetry >= 0.80:
            confidence = "high"
        elif depth >= 0.15 or symmetry >= 0.70:
            confidence = "medium"
        else:
            confidence = "low"

        pre_idx = peak_idx - LOOK_BACK
        post_idx = peak_idx + LOOK_FORWARD

        signals.append(
            Signal(
                ticker=ticker,
                name=name,
                pattern=PATTERN_TYPE,
                pattern_name_ja=PATTERN_NAME_JA,
                win_rate=WIN_RATE,
                direction=DIRECTION,
                current_price=float(close[-1]),
                signal_price=float(post_price),
                pattern_detail=PatternDetail(
                    start_date=fmt_date(df, pre_idx),
                    end_date=fmt_date(df, post_idx),
                    key_points=[
                        KeyPoint(fmt_date(df, pre_idx), float(pre_price), "rise_start"),
                        KeyPoint(fmt_date(df, peak_idx), float(peak_price), "peak"),
                        KeyPoint(fmt_date(df, post_idx), float(post_price), "fall_end"),
                    ],
                ),
                confidence=confidence,  # type: ignore[arg-type]
            )
        )

    return signals
