"""
Spike Bottom (V-Bottom) pattern detector (buy signal, 91% win rate).

Pattern criteria:
  - Price drops -8% or more over 5 trading days (sharp decline)
  - Price recovers +6% or more over the next 5 trading days
  - V-shaped recovery
"""

from __future__ import annotations

import logging

import pandas as pd

from .base import KeyPoint, PatternDetail, Signal, fmt_date

logger = logging.getLogger(__name__)

PATTERN_TYPE = "spike_bottom"
PATTERN_NAME_JA = "スパイクボトム"
WIN_RATE = 91
DIRECTION = "buy"

DROP_WINDOW = 5
RECOVERY_WINDOW = 5
DROP_THRESHOLD = -0.08   # -8%
RECOVERY_THRESHOLD = 0.06  # +6%


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect spike bottom (V-bottom) patterns."""
    if len(df) < DROP_WINDOW + RECOVERY_WINDOW + 5:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    n = len(close)

    for i in range(DROP_WINDOW, n - RECOVERY_WINDOW):
        bottom_price = close[i]
        pre_price = close[i - DROP_WINDOW]
        post_price = close[i + RECOVERY_WINDOW]

        drop_pct = (bottom_price - pre_price) / pre_price
        recovery_pct = (post_price - bottom_price) / bottom_price

        if drop_pct > DROP_THRESHOLD:
            continue
        if recovery_pct < RECOVERY_THRESHOLD:
            continue

        # Classify confidence by depth and speed of recovery
        depth = abs(drop_pct)
        if depth >= 0.15 and recovery_pct >= 0.10:
            confidence = "high"
        elif depth >= 0.10 or recovery_pct >= 0.08:
            confidence = "medium"
        else:
            confidence = "low"

        pre_idx = i - DROP_WINDOW
        post_idx = i + RECOVERY_WINDOW

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
                        KeyPoint(fmt_date(df, pre_idx), float(pre_price), "pre_drop"),
                        KeyPoint(fmt_date(df, i), float(bottom_price), "bottom"),
                        KeyPoint(fmt_date(df, post_idx), float(post_price), "recovery"),
                    ],
                ),
                confidence=confidence,  # type: ignore[arg-type]
            )
        )

    return signals
