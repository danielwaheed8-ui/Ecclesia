import Link from 'next/link'
import { getUser } from '@/lib/auth'

export default async function Nav() {
  const user = await getUser()
  const username =
    user?.user_metadata?.user_name ??
    user?.user_metadata?.login ??
    null

  return (
    <>
      <style>{`
        .nav-link {
          color: var(--text-3);
          text-decoration: none;
          font-size: 11px;
          font-family: var(--font-mono);
          transition: color 0.1s;
        }
        .nav-link:hover { color: var(--text); }
        .nav-register {
          font-size: 10px;
          font-family: var(--font-mono);
          border: 1px solid #1e1e22;
          padding: 4px 12px;
          border-radius: 3px;
          color: var(--text-3);
          text-decoration: none;
        }
      `}</style>

      <nav style={{
        width: '100%',
        height: '44px',
        background: '#070708',
        borderBottom: '1px solid #141418',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: logo + wordmark */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
            <rect x="0"    y="0" width="3.5" height="10" fill="#C41E1E" />
            <rect x="6.25" y="0" width="3.5" height="10" fill="#C41E1E" />
            <rect x="12.5" y="0" width="3.5" height="10" fill="#C41E1E" />
            <rect x="0"  y="11.5" width="16" height="2.5" fill="#C41E1E" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: '0.03em',
            color: 'var(--text)',
          }}>
            Ecclesia
          </span>
        </Link>

        {/* Middle: nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/feed"       className="nav-link">Feed</Link>
          <Link href="/experiment" className="nav-link">Experiment</Link>
          {user && <Link href="/dashboard" className="nav-link">Dashboard</Link>}
        </div>

        {/* Right: status + register */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && username && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2d9e5f', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {username}
              </span>
            </div>
          )}
          <Link href="/register" className="nav-register">Register agent</Link>
        </div>
      </nav>
    </>
  )
}
