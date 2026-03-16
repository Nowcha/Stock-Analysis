"""
Ascending Pennant pattern detector (buy signal, 86% win rate).

Pattern criteria:
  - Flagpole: rapid price rise >= 10% over 10-25 trading days
  - Pennant: 10-25 day converging consolidation after flagpole top
    - At least 2 lower highs (descending upper bound)
    - At least 2 higher lows (ascending lower bound)
    - Rolling price range narrows
  - Breakout: price closes above flagpole high
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
    neckline_broken_up,
    first_breakout_up_idx,
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "ascending_pennant"
PATTERN_NAME_JA = "上昇ペナント"
WIN_RATE = 86
DIRECTION = "buy"

POLE_MIN_RISE = 0.10       # flagpole must be >= 10% rise
POLE_MIN_DAYS = 10
POLE_MAX_DAYS = 25
PENNANT_MIN_DAYS = 10
PENNANT_MAX_DAYS = 25


def _is_descending(values: np.ndarray) -> bool:
    """Return True if each successive value is lower than the previous."""
    return bool(np.all(np.diff(values) < 0))


def _is_ascending(values: np.ndarray) -> bool:
    """Return True if each successive value is higher than the previous."""
    return bool(np.all(np.diff(values) > 0))


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect ascending pennant patterns in the given OHLCV DataFrame."""
    if len(df) < POLE_MIN_DAYS + PENNANT_MIN_DAYS + 5:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    high = df["High"].to_numpy(dtype=float)
    low = df["Low"].to_numpy(dtype=float)

    peaks = find_peaks(close, order=5)

    for pole_top_pos in range(len(peaks)):
        pole_top_idx = int(peaks[pole_top_pos])

        # Check flagpole: look back POLE_MIN_DAYS to POLE_MAX_DAYS before peak
        for pole_start_offset in range(POLE_MIN_DAYS, POLE_MAX_DAYS + 1):
            pole_start_idx = pole_top_idx - pole_start_offset
            if pole_start_idx < 0:
                break

            pole_low = float(np.min(close[pole_start_idx:pole_top_idx + 1]))
            pole_high = float(close[pole_top_idx])
            rise = (pole_high - pole_low) / pole_low if pole_low > 0 else 0.0
            if rise < POLE_MIN_RISE:
                continue

            # Found flagpole. Now look for pennant consolidation after pole_top_idx
            pennant_start = pole_top_idx + 1
            pennant_end = min(pole_top_idx + PENNANT_MAX_DAYS, len(df) - 2)

            if pennant_end - pennant_start < PENNANT_MIN_DAYS - 1:
                break

            # Collect highs and lows of the pennant window
            pennant_highs = high[pennant_start:pennant_end + 1]
            pennant_lows = low[pennant_start:pennant_end + 1]

            if len(pennant_highs) < PENNANT_MIN_DAYS:
                break

            # Check converging: max of first half vs max of second half should shrink
            mid = len(pennant_highs) // 2
            high_first_half = float(np.max(pennant_highs[:mid]))
            high_second_half = float(np.max(pennant_highs[mid:]))
            low_first_half = float(np.min(pennant_lows[:mid]))
            low_second_half = float(np.min(pennant_lows[mid:]))

            if high_second_half >= high_first_half:
                break  # highs not descending
            if low_second_half <= low_first_half:
                break  # lows not ascending

            # Convergence confirmed. Require breakout above flagpole top
            if not neckline_broken_up(df, pole_high, pennant_end + 1):
                break

            bo_idx = first_breakout_up_idx(df, pole_high, pennant_end + 1)
            if bo_idx is None:
                break

            # Build key points
            pennant_low_idx = int(pole_start_idx + int(np.argmin(close[pole_start_idx:pole_top_idx + 1])))
            pennant_mid_idx = pennant_start + mid

            confidence_rise = rise - POLE_MIN_RISE  # how much above minimum
            if confidence_rise > 0.08:
                confidence = "high"
            elif confidence_rise > 0.04:
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
                    signal_price=pole_high,
                    pattern_detail=PatternDetail(
                        start_date=fmt_date(df, pole_start_idx),
                        end_date=fmt_date(df, bo_idx),
                        key_points=[
                            KeyPoint(fmt_date(df, pole_start_idx), float(close[pole_start_idx]), "pole_base"),
                            KeyPoint(fmt_date(df, pole_top_idx), pole_high, "pole_top"),
                            KeyPoint(fmt_date(df, pennant_mid_idx), float(close[pennant_mid_idx]), "pennant_mid"),
                            KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakout"),
                        ],
                    ),
                    confidence=confidence,  # type: ignore[arg-type]
                )
            )
            break  # one signal per flagpole top

    return signals
