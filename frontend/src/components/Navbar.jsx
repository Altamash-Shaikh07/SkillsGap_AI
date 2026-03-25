import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, Map, MessageSquare } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Upload',    icon: Brain },
  { to: '/dashboard', label: 'Analysis',  icon: LayoutDashboard },
  { to: '/roadmap',   label: 'Roadmap',   icon: Map },
  { to: '/interview', label: 'Interview', icon: MessageSquare },
]

export default function Navbar({ appState }) {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0d1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            SkillGap <span className="text-primary-500">AI</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Status chip */}
        {appState.sessionId && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Session active
          </div>
        )}
      </div>
    </header>
  )
}
