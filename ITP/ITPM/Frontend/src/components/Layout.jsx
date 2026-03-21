import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout({
  children,
  currentPage,
  setPage,
  user,
  onLogout,
  notifications,
  unreadNotificationCount,
  onOpenNotification,
  onMarkAllNotificationsRead,
  toastNotifications,
}) {
  return (
    <div className="min-h-screen bg-wellness-bg flex">
      <Sidebar currentPage={currentPage} setPage={setPage} user={user} onLogout={onLogout} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          user={user}
          onOpenProfile={() => setPage('profile')}
          onLogout={onLogout}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
          onOpenNotification={onOpenNotification}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
        />

        <main className="flex-1 pb-24 md:pb-8 pt-6 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="fixed top-20 right-4 z-40 space-y-3 w-[320px] hidden md:block pointer-events-none">
        {toastNotifications.map((notification) => (
          <div
            key={notification.id}
            className="pointer-events-auto rounded-2xl border border-wellness-border bg-white/95 backdrop-blur px-4 py-3 shadow-xl shadow-slate-200/60"
          >
            <p className="text-sm font-bold text-wellness-text">{notification.title}</p>
            <p className="text-xs text-wellness-text-sec mt-1 leading-5">{notification.message}</p>
          </div>
        ))}
      </div>

      <BottomNav currentPage={currentPage} setPage={setPage} />
    </div>
  );
}
