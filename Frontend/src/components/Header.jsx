import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Search, Settings, ShieldCheck, UserCircle2 } from 'lucide-react';

function UserAvatar({ user, className = '' }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className={`rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`rounded-full flex items-center justify-center font-bold border ${className}`} style={{ backgroundColor: 'rgba(123, 174, 127, 0.2)', color: '#7BAE7F', borderColor: 'rgba(123, 174, 127, 0.2)' }}>
      {user.avatar}
    </div>
  );
}

function formatTimeLabel(dateString) {
  const diffMinutes = Math.round((Date.now() - new Date(dateString).getTime()) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function Header({
  currentPage,
  user,
  onOpenProfile,
  onLogout,
  notifications,
  unreadNotificationCount,
  onOpenNotification,
  onMarkAllNotificationsRead,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'mood':
        return 'Mood & Mental Health';
      case 'focus':
        return 'Focus & Tasks';
      case 'peer':
        return 'Peer Support';
      case 'resources':
        return 'AI Resource Hub';
      case 'profile':
        return 'Profile & Settings';
      default:
        return 'Dashboard';
    }
  };

  const openProfileMenuPage = () => {
    setIsMenuOpen(false);
    onOpenProfile();
  };

  return (
    <header className="hidden md:flex sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-wellness-border h-16 items-center justify-between px-8">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-wellness-text">{getPageTitle()}</h1>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-wellness-text-muted" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 bg-wellness-bg border border-transparent rounded-full focus:bg-white focus:ring-2 outline-none transition-all text-sm"
            style={{ '--tw-ring-color': '#7BAE7F', '--tw-ring-offset-color': 'transparent' }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#7BAE7F';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'transparent';
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 text-wellness-text-sec transition-colors rounded-full hover:bg-wellness-blue-light" style={{ '--hover-color': '#7BAE7F' }}
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-wellness-peach text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            ) : null}
          </button>

          {isNotificationsOpen ? (
            <div className="absolute right-0 mt-3 w-96 bg-white border border-wellness-border rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
              <div className="p-4 bg-wellness-bg/60 border-b border-wellness-border/60 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-wellness-text">Notifications</p>
                  <p className="text-xs text-wellness-text-sec">Live updates from mood, focus, peer, and AI modules</p>
                </div>
                {unreadNotificationCount > 0 ? (
                  <button onClick={onMarkAllNotificationsRead} className="text-xs font-bold" style={{ color: '#7BAE7F' }}>
                    Mark all read
                  </button>
                ) : null}
              </div>
              <div className="max-h-[420px] overflow-y-auto p-2">
                {notifications.length ? (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onOpenNotification(notification);
                      }}
                      className={(notification.isRead ? 'hover:bg-wellness-bg' : 'hover:') + ' w-full text-left px-3 py-3 rounded-xl transition-colors'} style={!notification.isRead ? { backgroundColor: 'rgba(123, 174, 127, 0.15)' } : {}}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-wellness-text">{notification.title}</p>
                          <p className="text-xs text-wellness-text-sec mt-1 leading-5">{notification.message}</p>
                        </div>
                        {!notification.isRead ? <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#7BAE7F' }} /> : null}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-wellness-text-muted">{notification.module}</span>
                        <span className="text-[10px] text-wellness-text-muted">{formatTimeLabel(notification.createdAt)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-wellness-text-sec">No notifications yet.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative pl-4 border-l border-wellness-border" ref={menuRef}>
          <button onClick={() => setIsMenuOpen((prev) => !prev)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <UserAvatar user={user} className="w-8 h-8 text-sm" />
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-wellness-text">{user.name.split(' ')[0]}</span>
              <ChevronDown className={`w-4 h-4 text-wellness-text-muted transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white border border-wellness-border rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
              <div className="p-4 bg-wellness-bg/60 border-b border-wellness-border/60">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} className="w-11 h-11" />
                  <div>
                    <p className="text-sm font-bold text-wellness-text">{user.name}</p>
                    <p className="text-xs text-wellness-text-sec">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-wellness-text-sec border border-wellness-border">{user.faculty}</span>
                  <span className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-wellness-text-sec border border-wellness-border">{user.role}</span>
                </div>
              </div>
              <div className="p-2">
                <button onClick={openProfileMenuPage} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-wellness-bg text-sm text-wellness-text">
                  <UserCircle2 className="w-4 h-4" style={{ color: '#7BAE7F' }} />
                  View Profile
                </button>
                <button onClick={openProfileMenuPage} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-wellness-bg text-sm text-wellness-text">
                  <Settings className="w-4 h-4 text-wellness-green" />
                  Account Settings
                </button>
                <button onClick={openProfileMenuPage} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-wellness-bg text-sm text-wellness-text">
                  <ShieldCheck className="w-4 h-4 text-wellness-peach" />
                  Security & Password
                </button>
              </div>
              <div className="p-2 border-t border-wellness-border/60">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
