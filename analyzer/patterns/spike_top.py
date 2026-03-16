"""
Spike Top pattern detector (sell signal, 90% win rate).

Pattern criteria:
  - Price rises +8% or more over 5 trading days
  - Price drops -6% or more over the next 5 trading days
  - Inverted V shape
"""

from __future__ import annotations

import logging

import pandas as pd

from .base import KeyPoint, PatternDetail, Signal, fmt_date

logger = logging.getLogger(__name__)

PATTERN_TYPE = "spike_top"
PATTERN_NAME_JA = "スパイクトップ"
WIN_RATE = 90
DIRECTION = "sell"

RISE_WINDOW = 5
DROP_WINDOW = 5
RISE_THRESHOLD = 0.08   # +8%
DROP_THRESHOLD = -0.06  # -6%


def detect(df: pd.DataFrame, ticker: str, name: str) -> list[Signal]:
    """Detect spike top patterns."""
    if len(df) < RISE_WINDOW + DROP_WINDOW + 5:
        return []

    signals: list[Signal] = []
    close = df["Close"].to_numpy(dtype=float)
    n = len(close)

    for i in range(RISE_WINDOW, n - DROP_WINDOW):
        top_price = close[i]
        pre_price = close[i - RISE_WINDOW]
        post_price = close[i + DROP_WINDOW]

        rise_pct = (top_price - pre_price) / pre_price
        drop_pct = (post_price - top_price) / top_price

        if rise_pct < RISE_THRESHOLD:
            continue
        if drop_pct > DROP_THRESHOLD:
            continue

        height = rise_pct
        fall = abs(drop_pct)
        if height >= 0.15 and fall >= 0.10:
            confidence = "high"
        elif height >= 0.10 or fall >= 0.08:
            confidence = "medium"
        else:
            confidence = "low"

        pre_idx = i - RISE_WINDOW
        post_idx = i + DROP_WINDOW

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
                        KeyPoint(fmt_date(df, pre_idx), float(pre_price), "pre_rise"),
                        KeyPoint(fmt_date(df, i), float(top_price), "top"),
                        KeyPoint(fmt_date(df, post_idx), float(post_price), "post_drop"),
                    ],
                ),
                confidence=confidence,  # type: ignore[arg-type]
            )
        )

    return signals
