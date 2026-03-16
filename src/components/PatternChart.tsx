import type { KeyPoint, Direction } from "../types";

interface Props {
  keyPoints: KeyPoint[];
  direction: Direction;
  width?: number;
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 28, left: 8 };

export function PatternChart({ keyPoints, direction, width = 320, height = 130 }: Props) {
  if (keyPoints.length < 2) return null;

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  const prices = keyPoints.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Map index → x, price → y (inverted: high price = low y)
  const toX = (i: number) => (i / (keyPoints.length - 1)) * innerW;
  const toY = (price: number) => innerH - ((price - minPrice) / priceRange) * innerH;

  const points = keyPoints.map((kp, i) => ({
    x: toX(i),
    y: toY(kp.price),
    ...kp,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const strokeColor = direction === "buy" ? "#16a34a" : "#dc2626";
  const fillColor = direction === "buy" ? "#dcfce7" : "#fee2e2";
  const dotColor = direction === "buy" ? "#15803d" : "#b91c1c";

  // Fill area under/above the line
  const areaPoints = [
    `${points[0].x},${innerH}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${innerH}`,
  ].join(" ");

  // Signal price line (horizontal reference) — use second-to-last or last non-breakout point
  const signalPointIdx = points.length >= 2 ? points.length - 2 : 0;
  const signalY = points[signalPointIdx].y;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-label="pattern chart"
    >
      <g transform={`translate(${PADDING.left},${PADDING.top})`}>
        {/* Area fill */}
        <polygon points={areaPoints} fill={fillColor} opacity={0.4} />

        {/* Signal price reference line */}
        <line
          x1={0}
          y1={signalY}
          x2={innerW}
          y2={signalY}
          stroke={strokeColor}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />

        {/* Pattern line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Key points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill={dotColor}
              stroke="white"
              strokeWidth={1.5}
            />
            {/* Label below the dot (or above if near bottom) */}
            <text
              x={p.x}
              y={p.y > innerH - 16 ? p.y - 8 : p.y + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#6b7280"
              className="select-none"
            >
              {p.label.replace(/_/g, " ")}
            </text>
          </g>
        ))}

        {/* X-axis dates */}
        {points
          .filter((_, i) => i === 0 || i === points.length - 1)
          .map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={innerH + 18}
              textAnchor={i === 0 ? "start" : "end"}
              fontSize={9}
              fill="#9ca3af"
              className="select-none"
            >
              {p.date.slice(5)} {/* MM-DD */}
            </text>
          ))}
      </g>
    </svg>
  );
}
