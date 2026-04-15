import React from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  PenLine,
  CalendarDays,
  User,
  LogOut,
} from 'lucide-react'

const navItems = [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: PenLine,
  },
  {
    id: 'history',
    label: 'History',
    icon: CalendarDays,
  },
]

const QUOTES = [
  "Breathe, darling. This is just a chapter, not your whole story.",
  "You cannot pour from an empty cup. Take care of yourself first.",
  "Your mind is a garden. Your thoughts are the seeds. You can grow flowers, or you can grow weeds.",
  "Progress, not perfection. Every small step counts.",
  "Be gentle with yourself. You're doing the best you can.",
  "There is peace in the pause. Don't forget to take a break today.",
  "Healing isn't a straight line, and that's perfectly okay."
]

export function Sidebar({ activeScreen, onNavigate }) {
  const dailyQuote = QUOTES[new Date().getDay()]
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-warm-white border-r border-sage-light/30 h-screen fixed left-0 top-0">

        {/* Logo */}
        <div className="p-6 border-b border-sage-light/20">
          <div className="flex items-center gap-2 text-center">
            <h1 className="font-lora text-2xl font-semibold text-ink">
              MindMate
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col pt-8 space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors
                  ${isActive
                    ? 'bg-sage-light/40 text-sage border-l-4 border-sage'
                    : 'text-olive hover:bg-sage-wash'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            )
          })}
        </nav>

        {/* Quote of the Day */}
        <div className="p-4 mb-2">
          <div className="bg-sage-wash/40 rounded-xl p-4 border border-sage-light/30">
            <h3 className="text-[10px] font-bold text-sage uppercase tracking-wider mb-2">Quote of the Day</h3>
            <p className="font-lora italic text-sm text-forest/90 leading-relaxed">
              "{dailyQuote}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-sage-light/20 space-y-1">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-olive hover:bg-sage-wash transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Profile</span>
          </motion.button>
          
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-blush hover:bg-blush/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </motion.button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-warm-white border-t border-sage-light/30 z-50">
        <div className="flex justify-around items-center py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                whileTap={{ scale: 0.9 }}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-15
                  ${isActive ? 'text-sage' : 'text-stone'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="mobile-indicator"
                    className="absolute bottom-1 w-1 h-1 bg-sage rounded-full"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>
    </>
  )
}