export type PatternType =
  | "inverse_head_shoulders"
  | "spike_bottom"
  | "double_bottom"
  | "triple_bottom"
  | "head_shoulders"
  | "double_top"
  | "spike_top"
  | "triple_top"
  | "inverse_v"
  // Phase 2
  | "ascending_pennant"
  | "cup_with_handle"
  | "rising_wedge"
  | "descending_triangle"
  | "falling_wedge";

export type Direction = "buy" | "sell";
export type Confidence = "high" | "medium" | "low";

export interface KeyPoint {
  date: string;
  price: number;
  label: string;
}

export interface PatternDetail {
  start_date: string;
  end_date: string;
  key_points: KeyPoint[];
}

export interface Signal {
  ticker: string;
  name: string;
  pattern: PatternType;
  pattern_name_ja: string;
  win_rate: number;
  direction: Direction;
  current_price: number;
  signal_price: number;
  pattern_detail: PatternDetail;
  confidence: Confidence;
}

export interface BacktestPatternStat {
  count: number;
  wins: number;
  win_rate: number;
  avg_return: number;
}

export interface BacktestResult {
  per_pattern: Partial<Record<PatternType, BacktestPatternStat>>;
  overall_win_rate: number | null;
  total_verified: number;
  hold_days: number;
}

export interface SignalData {
  analyzed_at: string;
  market_date: string;
  total_analyzed: number;
  buy_signals: Signal[];
  sell_signals: Signal[];
  backtest?: BacktestResult;
}

export interface PortfolioEntry {
  ticker: string;
  name: string;
  buy_date: string;
  buy_price: number;
  quantity: number;
  memo?: string;
}
