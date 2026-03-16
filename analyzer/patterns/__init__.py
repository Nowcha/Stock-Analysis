"""
Pattern detection modules for KabuPattern.
Each module exports detect(df, ticker, name) -> list[Signal].
"""

from . import (
    ascending_pennant,
    cup_with_handle,
    descending_triangle,
    double_bottom,
    double_top,
    falling_wedge,
    head_shoulders,
    inverse_head_shoulders,
    inverse_v,
    rising_wedge,
    spike_bottom,
    spike_top,
    triple_bottom,
    triple_top,
)

__all__ = [
    "ascending_pennant",
    "cup_with_handle",
    "descending_triangle",
    "double_bottom",
    "double_top",
    "falling_wedge",
    "head_shoulders",
    "inverse_head_shoulders",
    "inverse_v",
    "rising_wedge",
    "spike_bottom",
    "spike_top",
    "triple_bottom",
    "triple_top",
]
