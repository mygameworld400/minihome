/* 카테고리별 금액 원형(도넛) 그래프.
   라이브러리 없이 SVG 원호로 그린다. slices 는
   [{ id, name, emoji, color, value, pct }] 형태. */

export default function Donut({ slices, size = 168, thickness = 26, center }) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const total = slices.reduce((a, s) => a + s.value, 0)

  let offset = 0

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        {/* 바탕 링 */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--line)" strokeWidth={thickness}
        />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * c
            const el = (
              <circle
                key={s.id}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
              >
                <title>{`${s.name} ${s.pct.toFixed(1)}%`}</title>
              </circle>
            )
            offset += len
            return el
          })}
      </svg>
      {center && <div className="donut-center">{center}</div>}
    </div>
  )
}
