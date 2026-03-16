"""
Pattern detection modules for KabuPattern.
Each module exports detect(df, ticker, name) -> list[Signal].
"""

from . import (
    double_bottom,
    double_top,
    head_shoulders,
    inverse_head_shoulders,
    inverse_v,
    spike_bottom,
    spike_top,
    triple_bottom,
    triple_top,
)

__all__ = [
    "double_bottom",
    "double_top",
    "head_shoulders",
    "inverse_head_shoulders",
    "inverse_v",
    "spike_bottom",
    "spike_top",
    "triple_bottom",
    "triple_top",
]
