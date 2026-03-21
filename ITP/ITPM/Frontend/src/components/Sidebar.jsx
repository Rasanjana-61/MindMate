import { BookOpen, LayoutDashboard, Leaf, LogOut, MessageCircle, Smile, Timer, User } from 'lucide-react';
import { motion } from 'framer-motion';

function SidebarAvatar({ user }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />;
  }

  return (
    <div className="w-8 h-8 rounded-full bg-wellness-blue-light flex items-center justify-center text-wellness-blue font-bold text-xs">
      {user.avatar}
    </div>
  );
}

export function Sidebar({ currentPage, setPage, user, onLogout }) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mood', label: 'Mood Tracker', icon: Smile },
    { id: 'focus', label: 'Focus & Tasks', icon: Timer },
  ];

  const communityNavItems = [
    { id: 'peer', label: 'Peer Support', icon: MessageCircle },
    { id: 'resources', label: 'Resource Hub', icon: BookOpen },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;

    return (
      <button
        key={item.id}
        onClick={() => setPage(item.id)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 relative group ${isActive ? 'bg-wellness-blue-light text-wellness-blue font-medium' : 'text-wellness-text-sec hover:bg-gray-50 hover:text-wellness-text'}`}
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute left-0 w-1 h-8 bg-wellness-blue rounded-r-full"
            initial={false}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-wellness-blue' : 'text-wellness-text-muted group-hover:text-wellness-blue'}`} />
          {item.label}
        </div>
        {item.badge && <span className="bg-wellness-peach text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-wellness-border fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3 text-wellness-blue font-bold text-xl border-b border-wellness-border/50">
        <div className="bg-wellness-blue-light p-2 rounded-xl shadow-sm">
          <Leaf className="w-6 h-6 text-wellness-green" />
        </div>
        StudentWell
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
        <nav className="space-y-1">
          <p className="px-4 text-xs font-semibold text-wellness-text-muted uppercase tracking-wider mb-2">Menu</p>
          {mainNavItems.map(renderNavItem)}
        </nav>

        <nav className="space-y-1">
          <p className="px-4 text-xs font-semibold text-wellness-text-muted uppercase tracking-wider mb-2">Community</p>
          {communityNavItems.map(renderNavItem)}
        </nav>
      </div>

      <div className="p-4 border-t border-wellness-border bg-gray-50/50">
        <button
          onClick={() => setPage('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${currentPage === 'profile' ? 'bg-wellness-blue-light text-wellness-blue font-medium' : 'text-wellness-text-sec hover:bg-white hover:shadow-sm hover:text-wellness-text'}`}
        >
          <User className={`w-5 h-5 ${currentPage === 'profile' ? 'text-wellness-blue' : 'text-wellness-text-muted'}`} />
          Profile Settings
        </button>

        <div className="flex items-center justify-between px-4 py-2 mt-2">
          <div className="flex items-center gap-3">
            <SidebarAvatar user={user} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-wellness-text leading-tight">{user.name}</span>
              <span className="text-[10px] text-wellness-text-muted">{user.role}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-wellness-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
