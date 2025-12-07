import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

interface NavItem {
  path: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/council', label: 'War Council', icon: '🏛️' },
  { path: '/agents/regs', label: 'RegsBot', icon: '📜' },
  { path: '/agents/requirements', label: 'RequirementsBot', icon: '📋' },
  { path: '/agents/dahs', label: 'DAHSBot', icon: '🖥️' },
  { path: '/agents/figma', label: 'FigmaBot', icon: '🎨' },
  { path: '/agents/testing', label: 'TestingBot', icon: '🧪' },
]

function Sidebar(): React.JSX.Element {
  return (
    <nav className={styles['sidebar']} aria-label="Main navigation">
      <div className={styles['brand']}>
        <span className={styles['logo']}>🤖</span>
        <span className={styles['title']}>NERO</span>
      </div>

      <div className={styles['subtitle']}>Multi-Agent Orchestration</div>

      <ul className={styles['nav']}>
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }): string =>
                `${styles['navLink'] ?? ''} ${isActive ? (styles['active'] ?? '') : ''}`
              }
              end={item.path === '/'}
            >
              <span className={styles['icon']}>{item.icon}</span>
              <span className={styles['label']}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles['footer']}>
        <div className={styles['status']}>
          <span className={styles['statusDot']} />
          <span>System Online</span>
        </div>
      </div>
    </nav>
  )
}

export default Sidebar
