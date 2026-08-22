import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronLeft,
  Clock,
  Eraser,
  FileUp,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './DashboardLayout.css'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Panel General',
    items: [
      { to: '/dashboard', label: 'Principal', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'Gestión de Datos',
    items: [
      { to: '/dashboard/procesar', label: 'Procesar Datos', icon: FileUp },
      { to: '/dashboard/limpieza', label: 'Limpieza de Datos', icon: Eraser },
      { to: '/dashboard/historial', label: 'Historial de Datos', icon: History },
    ],
  },
]

const BOTTOM_ITEMS: NavItem[] = [
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

const HELP_ITEM: NavItem = {
  to: '/dashboard/ayuda',
  label: 'Ayuda y soporte',
  icon: LifeBuoy,
}

const COLLAPSE_KEY = 'crm_sidebar_collapsed'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const date = now.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return { time, date }
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { time, date } = useClock()

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderLink = ({ to, label, icon: Icon, end }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `sidebar__link ${isActive ? 'is-active' : ''}`
      }
    >
      <span className="sidebar__link-icon">
        <Icon size={21} strokeWidth={2} />
      </span>
      <span className="sidebar__label">{label}</span>
      <span className="sidebar__tooltip" aria-hidden="true">
        {label}
      </span>
    </NavLink>
  )

  return (
    <div className={`shell ${collapsed ? 'shell--collapsed' : ''}`}>
      {mobileOpen && (
        <div
          className="backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? 'is-open' : ''}`}
        data-collapsed={collapsed}
      >
        <div className="sidebar__header">
          <Logo to="/dashboard" />
          <button
            className="sidebar__close"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="sidebar__group">
              <p className="sidebar__section">{group.title}</p>
              {group.items.map(renderLink)}
            </div>
          ))}
          <div className="sidebar__group sidebar__group--bottom">
            <p className="sidebar__section">Soporte</p>
            {renderLink(HELP_ITEM)}
            {BOTTOM_ITEMS.map(renderLink)}
          </div>
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar__collapse-btn"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            onClick={() => setCollapsed((v) => !v)}
          >
            <ChevronLeft
              size={19}
              className={`sidebar__chevron ${collapsed ? 'is-flipped' : ''}`}
            />
            <span className="sidebar__label">Colapsar</span>
          </button>

          <div className="sidebar__user">
            <span className="avatar avatar--sm">
              {initials(user?.name ?? 'U')}
            </span>
            <div className="sidebar__user-info">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
            <button
              className="sidebar__logout"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <button
            className="topbar__menu"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="topbar__search">
            <Search size={18} className="topbar__search-icon" />
            <input type="search" placeholder="Buscar en el panel…" />
            <kbd>⌘K</kbd>
          </div>

          <div className="topbar__actions">
            <div className="topbar__clock" title={date}>
              <Clock size={15} />
              <span className="topbar__clock-time">{time}</span>
              <span className="topbar__clock-date">{date}</span>
            </div>

            <ThemeToggle />

            <button className="topbar__icon-btn" aria-label="Notificaciones">
              <Bell size={20} />
              <span className="topbar__dot" />
            </button>

            <div className="topbar__user" ref={userMenuRef}>
              <button
                className="topbar__user-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
              >
                <span className="avatar">{initials(user?.name ?? 'U')}</span>
                <span className="topbar__user-name">{user?.name}</span>
              </button>
              {userMenuOpen && (
                <div className="topbar__dropdown">
                  <div className="topbar__dropdown-head">
                    <strong>{user?.name}</strong>
                    <small>{user?.email}</small>
                  </div>
                  <button
                    className="topbar__dropdown-item topbar__dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
