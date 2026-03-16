import type { Direction, PatternType } from "../types";

export interface PatternMeta {
  nameJa: string;
  nameEn: string;
  winRate: number;
  direction: Direction;
  description: string;
}

export const PATTERN_META: Record<PatternType, PatternMeta> = {
  inverse_head_shoulders: {
    nameJa: "逆三尊",
    nameEn: "Inverse Head & Shoulders",
    winRate: 95,
    direction: "buy",
    description: "3つの谷（左肩・頭・右肩）を形成し、頭が最も深い反転パターン",
  },
  spike_bottom: {
    nameJa: "スパイクボトム",
    nameEn: "Spike Bottom (V-Bottom)",
    winRate: 91,
    direction: "buy",
    description: "急落後に急反発するV字型の強力な底打ちパターン",
  },
  double_bottom: {
    nameJa: "ダブルボトム",
    nameEn: "Double Bottom",
    winRate: 89,
    direction: "buy",
    description: "同水準の2つの底を形成し、ネックライン上抜けで上昇転換",
  },
  triple_bottom: {
    nameJa: "トリプルボトム",
    nameEn: "Triple Bottom",
    winRate: 82,
    direction: "buy",
    description: "同水準の3つの底を形成する強力な底打ちパターン",
  },
  ascending_pennant: {
    nameJa: "上昇ペナント",
    nameEn: "Ascending Pennant",
    winRate: 86,
    direction: "buy",
    description: "急騰後に収束するトレンドラインを形成し、上方ブレイクアウト",
  },
  cup_with_handle: {
    nameJa: "カップウィズハンドル",
    nameEn: "Cup with Handle",
    winRate: 84,
    direction: "buy",
    description: "U字型の回復後に小さな押し目（ハンドル）を形成し、上昇継続",
  },
  rising_wedge: {
    nameJa: "上昇ウェッジ",
    nameEn: "Rising Wedge (bullish)",
    winRate: 77,
    direction: "buy",
    description: "高値・安値の切り上げ幅が収束し、上方ブレイクアウト",
  },
  head_shoulders: {
    nameJa: "三尊",
    nameEn: "Head & Shoulders",
    winRate: 95,
    direction: "sell",
    description: "3つの山（左肩・頭・右肩）を形成し、頭が最も高い天井パターン",
  },
  double_top: {
    nameJa: "ダブルトップ",
    nameEn: "Double Top",
    winRate: 93,
    direction: "sell",
    description: "同水準の2つの天井を形成し、ネックライン下抜けで下落転換",
  },
  spike_top: {
    nameJa: "スパイクトップ",
    nameEn: "Spike Top",
    winRate: 90,
    direction: "sell",
    description: "急騰後に急反落する逆V字型の強力な天井打ちパターン",
  },
  triple_top: {
    nameJa: "トリプルトップ",
    nameEn: "Triple Top",
    winRate: 84,
    direction: "sell",
    description: "同水準の3つの天井を形成する強力な天井打ちパターン",
  },
  inverse_v: {
    nameJa: "逆V字",
    nameEn: "Inverted V",
    winRate: 81,
    direction: "sell",
    description: "急騰後に対称的な急落を見せる明確な天井パターン",
  },
  descending_triangle: {
    nameJa: "ディセンディングトライアングル",
    nameEn: "Descending Triangle",
    winRate: 75,
    direction: "sell",
    description: "水平サポートと下降トレンドラインが収束し、下方ブレイクアウト",
  },
  falling_wedge: {
    nameJa: "下降ウェッジ",
    nameEn: "Falling Wedge (bearish)",
    winRate: 72,
    direction: "sell",
    description: "高値・安値の切り下げ幅が収束し、下方ブレイクアウト",
  },
};
