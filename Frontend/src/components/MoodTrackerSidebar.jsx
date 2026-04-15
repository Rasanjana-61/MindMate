import { LogOut, User, Sparkles, LayoutDashboard, NotebookPen, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

function SidebarAvatar({ user }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user?.name} className="w-8 h-8 rounded-full object-cover" />;
  }

  return (
    <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center text-sage font-bold text-xs">
      {user?.avatar || 'U'}
    </div>
  );
}

export function MoodTrackerSidebar({ currentPage, setPage, user, onLogout }) {
  const mainNavItems = [
    { id: 'mood-dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'mood-journal', label: 'Journal Entry', icon: NotebookPen },
    { id: 'mood-history', label: 'History', icon: CalendarDays },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;

    return (
      <button
        key={item.id}
        onClick={() => setPage(item.id)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 relative group ${
          isActive
            ? 'bg-sage-wash text-sage font-medium'
            : 'text-olive hover:bg-gray-50 hover:text-forest'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute left-0 w-1 h-8 bg-sage rounded-r-full"
            initial={false}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <div className="flex items-center gap-3">
          <Icon
            className={`w-5 h-5 transition-colors ${
              isActive
                ? 'text-sage'
                : 'text-stone group-hover:text-sage'
            }`}
          />
          {item.label}
        </div>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-cream-white border-r border-sage-light/30 fixed left-0 top-0 z-20">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 text-sage font-bold text-xl border-b border-sage-light/30">
        <Sparkles className="w-6 h-6" />
        <span className="font-lora">MindMate</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
        <nav className="space-y-1">
          <p className="px-4 text-xs font-semibold text-stone uppercase tracking-wider mb-2 font-lora">
            Tracking
          </p>
          {mainNavItems.map(renderNavItem)}
        </nav>
      </div>

      {/* Footer - User Profile */}
      <div className="p-4 border-t border-sage-light/30 bg-warm-sand/20">
        <button
          onClick={() => setPage('mood-dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
            currentPage === 'mood-dashboard'
              ? 'bg-sage-wash text-sage font-medium'
              : 'text-olive hover:bg-white hover:shadow-sm hover:text-forest'
          }`}
        >
          <User className={`w-5 h-5 ${currentPage === 'mood-dashboard' ? 'text-sage' : 'text-stone'}`} />
          Profile
        </button>

        <div className="flex items-center justify-between px-4 py-2 mt-2">
          <div className="flex items-center gap-3">
            <SidebarAvatar user={user} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ink leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] text-stone">{user?.role || 'User'}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-stone hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
