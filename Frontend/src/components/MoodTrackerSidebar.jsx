import { BarChart3, BookOpenText, ClipboardPen, House, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: House },
  { id: 'journal', label: 'Journal', icon: ClipboardPen },
  { id: 'history', label: 'History', icon: BarChart3 },
];

function UserAvatar({ user }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user?.name || 'User'} className="h-10 w-10 rounded-full object-cover" />;
  }

  const initial = String(user?.name || 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-wash text-sage font-semibold">
      {initial}
    </div>
  );
}

export function MoodTrackerSidebar({ currentScreen, onNavigate, onExit, onLogout, user }) {
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 shrink-0 border-r border-sage-soft/70 bg-warm-white/95">
      <div className="flex h-full w-full flex-col overflow-hidden p-3">
        <div className="rounded-xl border border-sage-soft/90 bg-cream px-4 py-3.5 shadow-card">
          <p className="font-lora text-[1.15rem] leading-tight font-semibold text-ink">MindMate</p>
        </div>

        <nav className="mt-5 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            const label =
              item.id === 'dashboard'
                ? 'Dashboard'
                : item.id === 'journal'
                  ? 'Journal Entry'
                  : item.id === 'history'
                    ? 'Journal History'
                    : item.label;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? 'bg-sage-wash text-forest'
                    : 'text-olive hover:bg-sage-wash/70 hover:text-forest'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mood-sidebar-active"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sage"
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  />
                ) : null}
                <Icon className="h-4 w-4" />
                <span className="text-base font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <div className="rounded-xl border border-sage-soft/80 bg-cream p-3 shadow-card">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-sage">Quote Of The Day</p>
            <p className="mt-2 font-lora text-[0.86rem] italic text-forest">"Healing isn't a straight line, and that's perfectly okay."</p>
          </div>

          <div className="rounded-xl border border-sage-soft/80 bg-cream p-3 shadow-card">
          <button
            type="button"
            onClick={onExit}
            className="flex w-full items-center gap-2 rounded-lg border border-sage-soft bg-warm-white px-2.5 py-1.5 text-sm font-medium text-olive hover:text-forest hover:bg-sage-wash/50 transition-colors"
          >
            <BookOpenText className="h-3.5 w-3.5" />
            Main Dashboard
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="mt-1.5 flex w-full items-center gap-2 rounded-lg border border-sage-soft bg-warm-white px-2.5 py-1.5 text-sm font-medium text-olive hover:text-forest hover:bg-sage-wash/50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
