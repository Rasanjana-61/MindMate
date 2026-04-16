import { House, PencilLine, ScrollText } from 'lucide-react';
import { MoodTrackerSidebar } from './MoodTrackerSidebar';

const MOBILE_TABS = [
  { id: 'dashboard', label: 'Overview', icon: House },
  { id: 'journal', label: 'Journal', icon: PencilLine },
  { id: 'history', label: 'History', icon: ScrollText },
];

export function MoodTrackerLayout({ currentScreen, onNavigate, onLogout, onExit, user, children }) {
  return (
    <div className="min-h-screen bg-warm-sand lg:flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <MoodTrackerSidebar
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onExit={onExit}
        user={user}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="lg:hidden">
            <div className="mx-auto flex w-full max-w-[1300px] gap-2 overflow-x-auto px-4 py-2 md:px-6">
              {MOBILE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentScreen === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onNavigate(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-sage bg-sage-wash text-forest'
                        : 'border-sage-soft bg-cream text-olive hover:text-forest'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

        <main className="mx-auto w-full max-w-[1300px] flex-1 px-4 py-5 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
