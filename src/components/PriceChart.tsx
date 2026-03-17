import type { OhlcvPoint, KeyPoint, Direction } from "../types";

interface Props {
  ohlcv: OhlcvPoint[];
  keyPoints: KeyPoint[];
  patternStart: string;
  patternEnd: string;
  direction: Direction;
  height?: number;
}

const PAD = { top: 20, right: 60, bottom: 36, left: 4 };
const VIEW_W = 600;

export function PriceChart({
  ohlcv,
  keyPoints,
  patternStart,
  patternEnd,
  direction,
  height = 220,
}: Props) {
  if (ohlcv.length < 2) return null;

  const sorted = [...ohlcv].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;

  const closes = sorted.map((d) => d.close);
  const rawMin = Math.min(...closes);
  const rawMax = Math.max(...closes);
  const rangePad = (rawMax - rawMin) * 0.08 || rawMax * 0.05;
  const priceMin = rawMin - rangePad;
  const priceMax = rawMax + rangePad;

  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const toX = (i: number) => (i / (n - 1)) * innerW;
  const toY = (price: number) =>
    innerH - ((price - priceMin) / (priceMax - priceMin)) * innerH;

  // Build date → index map for fast lookup
  const dateIndex = new Map(sorted.map((d, i) => [d.date, i]));

  function findNearestIdx(dateStr: string): number {
    if (dateIndex.has(dateStr)) return dateIndex.get(dateStr)!;
    const target = new Date(dateStr).getTime();
    let nearest = 0;
    let minDiff = Infinity;
    sorted.forEach((d, i) => {
      const diff = Math.abs(new Date(d.date).getTime() - target);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = i;
      }
    });
    return nearest;
  }

  const patStartIdx = findNearestIdx(patternStart);
  const patEndIdx = findNearestIdx(patternEnd);

  const linePoints = sorted.map((d, i) => `${toX(i)},${toY(d.close)}`).join(" ");
  const areaPoints = [
    `${toX(0)},${innerH}`,
    ...sorted.map((d, i) => `${toX(i)},${toY(d.close)}`),
    `${toX(n - 1)},${innerH}`,
  ].join(" ");

  const lineColor = direction === "buy" ? "#16a34a" : "#dc2626";
  const fillColor = direction === "buy" ? "#dcfce7" : "#fee2e2";
  const dotColor = direction === "buy" ? "#15803d" : "#b91c1c";
  const patternBg = direction === "buy" ? "#bbf7d0" : "#fecaca";

  // Y-axis: 4 evenly spaced price levels
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const price = priceMin + (priceMax - priceMin) * (i / 3);
    return { price, y: toY(price) };
  });

  // X-axis: up to 5 evenly spaced date labels
  const xTickCount = Math.min(5, n);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / (xTickCount - 1)) * (n - 1));
    return { date: sorted[idx].date, x: toX(idx), isFirst: i === 0, isLast: i === xTickCount - 1 };
  });

  // Key points mapped to closest OHLCV date on chart
  const kpPoints = keyPoints.map((kp) => {
    const idx = findNearestIdx(kp.date);
    const x = toX(idx);
    const y = toY(sorted[idx]?.close ?? kp.price);
    return { label: kp.label, x, y };
  });

  // Current price reference line (last data point)
  const lastY = toY(sorted[n - 1].close);
  const lastPrice = sorted[n - 1].close;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${height}`}
      className="w-full"
      style={{ height }}
      aria-label="daily price chart"
    >
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* Y-axis grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={0}
            y1={t.y}
            x2={innerW}
            y2={t.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        {/* Pattern period background */}
        <rect
          x={toX(patStartIdx)}
          y={0}
          width={Math.max(1, toX(patEndIdx) - toX(patStartIdx))}
          height={innerH}
          fill={patternBg}
          opacity={0.4}
        />
        {/* Pattern period top border */}
        <line
          x1={toX(patStartIdx)}
          y1={0}
          x2={toX(patStartIdx)}
          y2={innerH}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
        />
        <line
          x1={toX(patEndIdx)}
          y1={0}
          x2={toX(patEndIdx)}
          y2={innerH}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
        />

        {/* Area fill under price line */}
        <polygon points={areaPoints} fill={fillColor} opacity={0.2} />

        {/* Current price dashed reference line */}
        <line
          x1={0}
          y1={lastY}
          x2={innerW}
          y2={lastY}
          stroke="#2563eb"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.45}
        />

        {/* Price line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Key points */}
        {kpPoints.map((kp, i) => {
          const labelY = kp.y > innerH - 20 ? kp.y - 10 : kp.y + 16;
          return (
            <g key={i}>
              <circle
                cx={kp.x}
                cy={kp.y}
                r={4.5}
                fill={dotColor}
                stroke="white"
                strokeWidth={1.5}
              />
              <text
                x={kp.x}
                y={labelY}
                textAnchor="middle"
                fontSize={9}
                fill="#6b7280"
                className="select-none"
              >
                {kp.label.replace(/_/g, " ")}
              </text>
            </g>
          );
        })}

        {/* Y-axis price labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={innerW + 5}
            y={t.y + 4}
            fontSize={9}
            fill="#9ca3af"
            className="select-none"
          >
            {t.price >= 1000
              ? `¥${Math.round(t.price).toLocaleString()}`
              : `¥${t.price.toFixed(0)}`}
          </text>
        ))}

        {/* Current price label */}
        <text
          x={innerW + 5}
          y={lastY + 4}
          fontSize={9}
          fontWeight={600}
          fill="#2563eb"
          className="select-none"
        >
          ¥{lastPrice >= 1000
            ? Math.round(lastPrice).toLocaleString()
            : lastPrice.toFixed(0)}
        </text>

        {/* X-axis date labels */}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={innerH + 22}
            textAnchor={t.isFirst ? "start" : t.isLast ? "end" : "middle"}
            fontSize={9}
            fill="#9ca3af"
            className="select-none"
          >
            {t.date.slice(5)}
          </text>
        ))}
      </g>
    </svg>
  );
}
