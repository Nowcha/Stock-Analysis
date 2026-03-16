"""
Shared utilities and data types for pattern detection modules.
All pattern modules import Signal, PatternDetail, KeyPoint from here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

import numpy as np
import pandas as pd
from scipy.signal import argrelextrema

# ---------------------------------------------------------------------------
# Type aliases
# ---------------------------------------------------------------------------

PatternType = Literal[
    "double_bottom",
    "double_top",
    "inverse_head_shoulders",
    "head_shoulders",
    "spike_bottom",
    "spike_top",
    "triple_bottom",
    "triple_top",
    "inverse_v",
    # Phase 2
    "ascending_pennant",
    "cup_with_handle",
    "rising_wedge",
    "descending_triangle",
    "falling_wedge",
]

Direction = Literal["buy", "sell"]
Confidence = Literal["high", "medium", "low"]

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class KeyPoint:
    date: str
    price: float
    label: str


@dataclass
class PatternDetail:
    start_date: str
    end_date: str
    key_points: list[KeyPoint] = field(default_factory=list)


@dataclass
class Signal:
    ticker: str
    name: str
    pattern: PatternType
    pattern_name_ja: str
    win_rate: int
    direction: Direction
    current_price: float
    signal_price: float
    pattern_detail: PatternDetail
    confidence: Confidence


# ---------------------------------------------------------------------------
# Peak / trough detection
# ---------------------------------------------------------------------------


def find_peaks(close_prices: np.ndarray, order: int = 7) -> np.ndarray:
    """Return indices of local maxima (peaks) in close_prices."""
    return argrelextrema(close_prices, np.greater, order=order)[0]


def find_troughs(close_prices: np.ndarray, order: int = 7) -> np.ndarray:
    """Return indices of local minima (troughs) in close_prices."""
    return argrelextrema(close_prices, np.less, order=order)[0]


# ---------------------------------------------------------------------------
# Price comparison helpers
# ---------------------------------------------------------------------------


def price_within_tolerance(
    price_a: float,
    price_b: float,
    tolerance: float = 0.03,
) -> bool:
    """Return True if price_a and price_b differ by less than tolerance (fraction)."""
    denom = max(price_a, price_b)
    if denom == 0:
        return False
    return abs(price_a - price_b) / denom < tolerance


def confidence_from_price_diff(
    price_a: float,
    price_b: float,
) -> Confidence:
    """
    Classify detection confidence based on how close two key prices are.
      < 1%  → high
      < 2%  → medium
      < 3%  → low
    """
    diff = abs(price_a - price_b) / max(price_a, price_b)
    if diff < 0.01:
        return "high"
    if diff < 0.02:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Breakout detection
# ---------------------------------------------------------------------------


def neckline_broken_up(
    df: pd.DataFrame,
    neckline_price: float,
    from_idx: int,
) -> bool:
    """Return True if any Close after from_idx exceeds neckline_price."""
    if from_idx >= len(df):
        return False
    return bool((df.iloc[from_idx:]["Close"] > neckline_price).any())


def neckline_broken_down(
    df: pd.DataFrame,
    neckline_price: float,
    from_idx: int,
) -> bool:
    """Return True if any Close after from_idx falls below neckline_price."""
    if from_idx >= len(df):
        return False
    return bool((df.iloc[from_idx:]["Close"] < neckline_price).any())


def first_breakout_up_idx(
    df: pd.DataFrame,
    neckline_price: float,
    from_idx: int,
) -> int | None:
    """Return the first index (absolute) where Close > neckline_price after from_idx."""
    slice_ = df.iloc[from_idx:]
    mask = slice_["Close"] > neckline_price
    if not mask.any():
        return None
    return int(slice_.index[mask.argmax()])


def first_breakout_down_idx(
    df: pd.DataFrame,
    neckline_price: float,
    from_idx: int,
) -> int | None:
    """Return the first index (absolute) where Close < neckline_price after from_idx."""
    slice_ = df.iloc[from_idx:]
    mask = slice_["Close"] < neckline_price
    if not mask.any():
        return None
    return int(slice_.index[mask.argmax()])


def fmt_date(df: pd.DataFrame, idx: int) -> str:
    """Format the Date at integer position idx as YYYY-MM-DD string."""
    return str(df.iloc[idx]["Date"].date())
