import { LayoutDashboard, Smile, Timer, MessageCircle, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';
export function BottomNav({ currentPage, setPage }) {
    const navItems = [
        {
            id: 'dashboard',
            label: 'Home',
            icon: LayoutDashboard
        },
        {
            id: 'mood',
            label: 'Mood',
            icon: Smile
        },
        {
            id: 'focus',
            label: 'Focus',
            icon: Timer
        },
        {
            id: 'peer',
            label: 'Peer',
            icon: MessageCircle
        },
        {
            id: 'resources',
            label: 'Hub',
            icon: BookOpen
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: User
        }
    ];
    return (<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-wellness-border shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] z-30 pb-safe">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (<button key={item.id} onClick={() => setPage(item.id)} className="flex flex-col items-center justify-center w-14 gap-1 relative py-1">

              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-wellness-blue text-white shadow-md transform -translate-y-1' : 'text-wellness-text-muted hover:bg-wellness-bg'}`}>

                <Icon className="w-5 h-5"/>
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-wellness-blue' : 'text-wellness-text-muted'}`}>

                {item.label}
              </span>
              {isActive &&
                    <motion.div layoutId="mobileActiveTab" className="absolute -top-2 w-1.5 h-1.5 rounded-full bg-wellness-blue" initial={false} transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                        }}/>}
            </button>);
        })}
      </div>
    </nav>);
}
