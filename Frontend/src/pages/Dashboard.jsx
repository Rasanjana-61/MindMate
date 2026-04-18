import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Leaf,
  Loader2,
  MessageCircle,
  Smile,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchDashboardOverview } from '../lib/auth';

function formatDateLabel(dateString) {
  if (!dateString) {
    return 'No due date';
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Dashboard({ setPage, userName }) {
  const [overview, setOverview] = useState({
    stats: {
      todayFocusLabel: '0m',
      completedTasks: 0,
      totalTasks: 0,
      streakDays: 0,
      averageMood: 0,
      averageMoodEmoji: '😐',
    },
    tasks: [],
    focus: {
      dailyGoalHours: 4,
      goalProgressPercent: 0,
      todayFocusLabel: '0m',
    },
    resources: [],
    peerDiscussions: [],
    wellnessTip: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchDashboardOverview();
        setOverview(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const emojis = ['😊', '😌', '😐', '😔', '😢'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-app-primary to-app-primary-light rounded-3xl p-8 text-white shadow-lg shadow-app-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-wellness-peach/20 rounded-full blur-2xl translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {(userName || 'User').split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg max-w-xl">
              Your dashboard now reflects live mood, focus, task, peer, and AI summary activity.
            </p>
          </div>

          <div className="hidden md:flex gap-3">
            <button onClick={() => setPage('mood-journal')} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <Smile className="w-4 h-4" /> Log today's journal entry
            </button>
            <button onClick={() => setPage('focus')} className="bg-white text-app-primary hover:bg-app-primary-light px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4" /> Start Focus
            </button>
          </div>
        </div>
      </motion.div>


      {errorMessage ? (
        <div className="rounded-2xl border border-app-stress/30 bg-app-stress/10 px-4 py-3 text-sm text-app-stress">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-app-primary mb-4" />
          <p className="text-sm text-app-text-secondary">Loading dashboard data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Feature Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#D7E8DA] rounded-[40px] p-8 lg:p-12 relative overflow-hidden"
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Title and Momentum */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-[#2F3E34] leading-tight max-w-md mb-12">
                    Focus, tasks, and progress in one place.
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/40">
                    <p className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider mb-2">Focus momentum</p>
                    <p className="text-xl font-bold text-app-text-primary">{overview.stats.todayFocusLabel} today</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/40">
                    <p className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider mb-2">Task progress</p>
                    <p className="text-xl font-bold text-app-text-primary">
                      {overview.stats.completedTasks} tasks completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Stats */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/20">
                  <p className="text-[10px] font-bold text-app-primary uppercase tracking-widest mb-1">FOCUS</p>
                  <h3 className="text-2xl font-bold text-app-text-primary mb-1">Keep it simple</h3>
                  <p className="text-sm text-app-text-secondary">One task at a time.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="bg-gradient-to-br from-[#7BAE7F] to-[#5F8C63] rounded-[32px] p-6 flex flex-col items-center justify-center text-white relative shadow-xl shadow-app-primary/20 overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-2">Weekly focus</p>
                    <p className="text-3xl font-bold mb-1">{overview.stats.todayFocusLabel}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/40">
                      <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-widest mb-1">CURRENT STREAK</p>
                      <p className="text-lg font-bold text-app-text-primary">{overview.stats.streakDays} days</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/40">
                      <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-widest mb-1">UPCOMING TASKS</p>
                      <p className="text-lg font-bold text-app-text-primary">{(overview?.tasks || []).filter(t => !t.completed).length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Today's Focus Time", value: overview.stats.todayFocusLabel, icon: Clock, color: 'bg-[#CFE6E6] text-[#6FA5A5]' },
              { label: "Completed Tasks", value: overview.stats.completedTasks, icon: CheckCircle2, color: 'bg-[#DDEAD9] text-[#7BAE7F]' },
              { label: "Current Streak", value: `${overview.stats.streakDays} days`, icon: Flame, color: 'bg-[#E8F0E8] text-[#5F705F]' },
              { label: "Upcoming Tasks", value: (overview?.tasks || []).filter(t => !t.completed).length, icon: ArrowRight, color: 'bg-[#F4EFE7] text-[#C49490]' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[28px] p-6 shadow-sm border border-app-primary-light/30 flex items-center gap-6 group hover:shadow-md transition-all cursor-pointer"
                onClick={() => setPage(idx === 0 ? 'focus' : idx === 1 ? 'focus' : idx === 2 ? 'mood-journal' : 'focus')}
              >
                <div className={`p-4 rounded-2xl ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-app-text-secondary mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-app-text-primary">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Quick Notes */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-app-primary-light/30 h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-app-text-primary">Quick Notes</h2>
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-[#E8F0E8] rounded-full text-app-primary text-xs font-bold uppercase tracking-wider">
                    <Leaf className="w-4 h-4" /> Focus
                  </button>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const nextTask = (overview?.tasks || []).find(t => !t.completed);
                    if (!nextTask) {
                      return (
                        <div className="bg-app-background/50 rounded-2xl p-6 border border-transparent">
                          <p className="text-xs font-bold text-app-text-secondary uppercase tracking-widest mb-2">Next</p>
                          <p className="text-lg font-medium italic text-app-text-secondary">
                            Enjoy your achievement!
                          </p>
                        </div>
                      );
                    }

                    // Calculate goal based on priority
                    const goalMinutes = nextTask.priority === 'high' ? 60 : nextTask.priority === 'medium' ? 40 : 20;
                    const progressPercent = Math.min(100, Math.round((nextTask.totalTimeSpent / goalMinutes) * 100));

                    return (
                      <div className="bg-app-background/50 rounded-2xl p-6 border border-transparent hover:border-app-primary-light transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold text-app-text-secondary uppercase tracking-widest">Next</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            nextTask.priority === 'high' ? 'bg-red-50 text-red-500' : 
                            nextTask.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 
                            'bg-blue-50 text-blue-500'
                          }`}>
                            {nextTask.priority}
                          </span>
                        </div>
                        <p className="text-lg font-medium text-app-text-primary mb-6">
                          {nextTask.title}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-app-text-secondary uppercase tracking-widest">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden border border-app-primary-light/20">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full bg-app-primary"
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-app-background/50 rounded-2xl p-6 border border-transparent hover:border-app-primary-light transition-all">
                    <p className="text-xs font-bold text-app-text-secondary uppercase tracking-widest mb-2">Break reminder</p>
                    <p className="text-sm text-app-text-secondary">
                      You've been focused for a while. Remember to stretch and hydrate!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pages Section */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-app-primary-light/30 h-full">
                <h2 className="text-2xl font-bold text-app-text-primary mb-8">Pages</h2>

                <div className="space-y-4">
                  {[
                    { id: 'focus', title: 'Focus Timer Page', desc: 'Open the timer from the left navigation.' },
                    { id: 'focus', title: 'Tasks Page', desc: 'Manage your tasks on the separate tasks module.' },
                    { id: 'resources', title: 'Resources Hub', desc: 'Access your AI summaries and study materials.' }
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPage(p.id)}
                      className="group cursor-pointer bg-app-background/30 rounded-2xl p-5 border border-transparent hover:border-app-primary-light hover:bg-white transition-all"
                    >
                      <h3 className="font-bold text-app-text-primary mb-1 group-hover:text-app-primary">{p.title}</h3>
                      <p className="text-xs text-app-text-secondary leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

