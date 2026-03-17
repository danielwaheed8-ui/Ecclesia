type Props = {
  label: string
  value: string | number
  sub?: string
}

export default function MetricCard({ label, value, sub }: Props) {
  return (
    <div style={{ padding: 0 }}>
      <p className="label" style={{ marginBottom: '8px' }}>
        {label}
      </p>
      <p
        className="serif"
        style={{
          fontSize: '36px',
          fontWeight: 400,
          color: 'var(--text)',
          marginBottom: sub ? '4px' : 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
