"""
Falling Wedge pattern detector (sell signal, 72% win rate).

Project definition: descending highs and descending lows that are converging
downward, followed by a breakdown below the lower trendline (bearish continuation).

Pattern criteria:
  - At least 3 descending peaks (lower highs)
  - At least 3 descending troughs (lower lows)
  - Upper trendline slope > lower trendline slope (both negative, lines converge downward)
  - Duration: 20-60 trading days
  - Breakdown: price closes below projected lower trendline
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
)

logger = logging.getLogger(__name__)

PATTERN_TYPE = "falling_wedge"
PATTERN_NAME_JA = "下降ウェッジ"
WIN_RATE = 72
DIRECTION = "sell"

MIN_DAYS = 20
MAX_DAYS = 60
MIN_PEAKS = 3
MIN_TROUGHS = 3


def _fit_line(indices: np.ndarray, prices: np.ndarray) -> tuple[float, float]:
    """Return (slope, intercept) of best-fit line through the given points."""
    coeffs = np.polyfit(indices.astype(float), prices, 1)
    return float(coeffs[0]), float(coeffs[1])


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect falling wedge (bearish) patterns."""
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

        peak_prices = close[window_peaks]
        trough_prices = close[window_troughs]

        # Peaks must be descending (each lower than previous)
        if not bool(np.all(np.diff(peak_prices) < 0)):
            continue

        # Troughs must be descending (each lower than previous)
        if not bool(np.all(np.diff(trough_prices) < 0)):
            continue

        # Fit trendlines
        upper_slope, upper_intercept = _fit_line(window_peaks, peak_prices)
        lower_slope, lower_intercept = _fit_line(window_troughs, trough_prices)

        # Both slopes must be negative
        if upper_slope >= 0 or lower_slope >= 0:
            continue

        # Upper slope must be less negative than lower slope (convergence downward)
        # i.e., upper_slope > lower_slope (closer to 0)
        if upper_slope <= lower_slope:
            continue

        # Compute projected lower trendline at end_idx
        projected_lower = lower_slope * end_idx + lower_intercept
        if projected_lower <= 0:
            continue

        # Require breakdown below projected lower trendline
        breakout_start = end_idx + 1
        if not neckline_broken_down(df, projected_lower, breakout_start):
            continue

        bo_idx = first_breakout_down_idx(df, projected_lower, breakout_start)
        if bo_idx is None:
            continue

        # Confidence: based on how strongly the slopes converge
        slope_diff_ratio = abs(upper_slope - lower_slope) / abs(lower_slope)
        if slope_diff_ratio > 0.5:
            confidence = "high"
        elif slope_diff_ratio > 0.2:
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
                signal_price=projected_lower,
                pattern_detail=PatternDetail(
                    start_date=fmt_date(df, int(start_idx)),
                    end_date=fmt_date(df, bo_idx),
                    key_points=[
                        KeyPoint(fmt_date(df, first_peak_idx), float(close[first_peak_idx]), "upper_start"),
                        KeyPoint(fmt_date(df, first_trough_idx), float(close[first_trough_idx]), "lower_start"),
                        KeyPoint(fmt_date(df, last_peak_idx), float(close[last_peak_idx]), "upper_end"),
                        KeyPoint(fmt_date(df, last_trough_idx), float(close[last_trough_idx]), "lower_end"),
                        KeyPoint(fmt_date(df, bo_idx), float(close[bo_idx]), "breakdown"),
                    ],
                ),
                confidence=confidence,  # type: ignore[arg-type]
            )
        )
        break  # one signal per pass

    return signals
