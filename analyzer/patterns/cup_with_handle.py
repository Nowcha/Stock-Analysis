"""
Cup with Handle pattern detector (buy signal, 84% win rate).

Pattern criteria:
  - Left rim and right rim at similar price (within ±5%), 30-90 days apart
  - Cup bottom (minimum between rims) at least 10% below rim price
  - Handle: small pullback 5-20 days after right rim
    - Handle low stays above 50% of the cup depth from the rim
  - Breakout: price closes above right rim (cup rim level)
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
    fmt_date,
    first_breakout_up_idx,
    neckline_broken_up,
    price_within_tolerance,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "cup_with_handle"
PATTERN_NAME_JA = "カップウィズハンドル"
WIN_RATE = 84
DIRECTION = "buy"

RIM_TOLERANCE = 0.05        # left and right rim within ±5%
CUP_MIN_DEPTH = 0.10        # cup must be at least 10% deep
CUP_MIN_DAYS = 30
CUP_MAX_DAYS = 90
HANDLE_MIN_DAYS = 5
HANDLE_MAX_DAYS = 20
HANDLE_MAX_RETRACE = 0.50   # handle must not retrace more than 50% of cup


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect cup with handle patterns in the given OHLCV DataFrame."""
    if len(df) < CUP_MIN_DAYS + HANDLE_MIN_DAYS + 5:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    peaks = find_peaks(close, order=7)

    for i in range(len(peaks) - 1):
        for j in range(i + 1, len(peaks)):
            left_rim_idx = int(peaks[i])
            right_rim_idx = int(peaks[j])
            gap = right_rim_idx - left_rim_idx

            if not (CUP_MIN_DAYS <= gap <= CUP_MAX_DAYS):
                continue

            left_rim_price = float(close[left_rim_idx])
            right_rim_price = float(close[right_rim_idx])

            # Rims must be at similar price level
            if not price_within_tolerance(left_rim_price, right_rim_price, RIM_TOLERANCE):
                continue

            rim_price = (left_rim_price + right_rim_price) / 2.0

            # Cup bottom: minimum in the gap between rims
            cup_slice = close[left_rim_idx:right_rim_idx + 1]
            cup_bottom_local = int(np.argmin(cup_slice))
            cup_bottom_idx = left_rim_idx + cup_bottom_local
            cup_bottom_price = float(close[cup_bottom_idx])

            # Cup must be deep enough
            depth = (rim_price - cup_bottom_price) / rim_price
            if depth < CUP_MIN_DEPTH:
                continue

            # Handle: look for a pullback after right rim
            handle_start = right_rim_idx + 1
            handle_end = min(right_rim_idx + HANDLE_MAX_DAYS, len(df) - 2)

            if handle_end - handle_start < HANDLE_MIN_DAYS - 1:
                continue

            handle_slice = close[handle_start:handle_end + 1]
            handle_min = float(np.min(handle_slice))
            handle_min_local = int(np.argmin(handle_slice))
            handle_min_idx = handle_start + handle_min_local

            # Handle must not retrace too deeply
            allowed_min = rim_price - depth * HANDLE_MAX_RETRACE * rim_price
            if handle_min < allowed_min:
                continue

            # Handle must pull back at least a little from the rim
            if handle_min >= right_rim_price:
                continue

            # Breakout above right rim after handle
            breakout_start = handle_end + 1
            if not neckline_broken_up(df, rim_price, breakout_start):
                continue

            bo_idx = first_breakout_up_idx(df, rim_price, breakout_start)
            if bo_idx is None:
                continue

            confidence_depth = depth - CUP_MIN_DEPTH
            if confidence_depth > 0.10:
                confidence = "high"
            elif confidence_depth > 0.05:
                confidence = "medium"
            else:
                confidence = "low"

            signals.append(
                Signal(
                    ticker=ticker,
                    name=name,
                    pattern=PATTERN_TYPE,
                    pattern_name_ja=PATTERN_NAME_JA,
                    win_rate=WIN_RATE,
                    direction=DIRECTION,
                    current_price=float(close[-1]),
                    signal_price=rim_price,
                    pattern_detail=PatternDetail(
                        start_date=fmt_date(df, left_rim_idx),
                        end_date=fmt_date(df, bo_idx),
                        key_points=[
                            KeyPoint(fmt_date(df, left_rim_idx), left_rim_price, "left_rim"),
                            KeyPoint(fmt_date(df, cup_bottom_idx), cup_bottom_price, "cup_bottom"),
                            KeyPoint(fmt_date(df, right_rim_idx), right_rim_price, "right_rim"),
                            KeyPoint(fmt_date(df, handle_min_idx), handle_min, "handle_low"),
                            KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                        ],
                    ),
                    confidence=confidence,  # type: ignore[arg-type]
                )
            )

    return signals
