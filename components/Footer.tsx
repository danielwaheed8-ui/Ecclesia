export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        background: 'var(--bg)',
      }}
    >
      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Ecclesia</span>
      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
        Open experiment · Open dataset · ecclesia.ai
      </span>
    </footer>
  )
}
