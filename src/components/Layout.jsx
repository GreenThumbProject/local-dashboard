import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Sliders, Settings, Sprout } from 'lucide-react'
import { useSystemState } from '../api/piApi'

const NAV = [
  { to: '/',            label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/graphs',      label: 'Graphs',      Icon: TrendingUp },
  { to: '/thresholds',  label: 'Thresholds',  Icon: Sliders },
  { to: '/settings',    label: 'Settings',    Icon: Settings },
  { to: '/cultivation', label: 'Cultivation', Icon: Sprout },
]

export default function Layout() {
  const { data: state } = useSystemState()
  const safetyMode = state?.safety_mode

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-800">
          <h1 className="text-brand-500 font-bold text-lg tracking-tight">GreenThumb</h1>
          <p className="text-gray-500 text-xs mt-0.5">Local Dashboard</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-900/60 text-brand-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-400">
          {safetyMode && (
            <span
              className="badge-red mb-2 flex justify-center"
              title="Safety mode disables actuators to protect plants"
            >
              ⚠ Safety Mode
            </span>
          )}
          <div>Pi API — local</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
