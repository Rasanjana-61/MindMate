import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Hourglass,
  Leaf,
  Loader2,
  MessageCircle,
  Smile,
  Sparkles,
  Users,
  X,
  ClipboardList,
  Layout,
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
    <div className="space-y-8 p-1">
      {isLoading ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-app-primary mb-4" />
          <p className="text-sm text-app-text-secondary">Loading your dashboard...</p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#E2F0E7] to-[#C8E4D1] rounded-[40px] p-10 text-[#2D3E33] relative overflow-hidden shadow-sm"
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <h1 className="text-5xl font-bold tracking-tight mb-8 leading-[1.1]">
                  Focus, tasks, and <br /> progress in one place.
                </h1>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 min-w-[240px] border border-white/20">
                    <p className="text-xs font-semibold text-[#5F705F] uppercase tracking-wider mb-2">Focus momentum</p>
                    <p className="text-xl font-bold">{overview.stats.todayFocusLabel} today</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 min-w-[240px] border border-white/20">
                    <p className="text-xs font-semibold text-[#5F705F] uppercase tracking-wider mb-2">Task progress</p>
                    <p className="text-xl font-bold">{overview.stats.completedTasks} tasks completed</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                 <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <p className="text-[10px] font-bold text-[#7BAE7F] uppercase tracking-widest mb-1">Focus</p>
                    <h3 className="text-xl font-bold mb-1">Keep it simple</h3>
                    <p className="text-sm text-[#5F705F]">One task at a time.</p>
                 </div>

                 <div className="flex gap-4">
                    <div className="bg-gradient-to-br from-[#6B9E78] to-[#4F7D5C] rounded-3xl p-6 flex-1 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full py-4">
                         <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-2">Weekly focus</p>
                         <p className="text-4xl font-bold mb-1">0 min</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                       <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                          <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider">Current Streak</p>
                          <p className="text-lg font-bold">{overview.stats.streakDays} days</p>
                       </div>
                       <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                          <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider">Upcoming Tasks</p>
                          <p className="text-lg font-bold">{overview.tasks.filter(t => !t.completed).length}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>

          {errorMessage && (
            <div className="rounded-2xl border border-app-stress/30 bg-app-stress/10 px-4 py-3 text-sm text-app-stress">
              {errorMessage}
            </div>
          )}

          {/* Middle Stats Cards */}
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { label: "Today's Focus Time", value: overview.stats.todayFocusLabel, icon: Hourglass },
              { label: "Completed Tasks", value: overview.stats.completedTasks, icon: CheckCircle2 },
              { label: "Current Streak", value: `${overview.stats.streakDays} days`, icon: Flame },
              { label: "Upcoming Tasks", value: overview.tasks.filter(t => !t.completed).length, icon: BarChart3 }
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8F0E8] flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="bg-[#E8F0E8] p-4 rounded-2xl text-[#7BAE7F]">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-app-text-secondary mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-app-text-primary">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-[#E8F0E8] h-full">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-bold text-app-text-primary">Quick Notes</h2>
                  <div className="flex items-center gap-2 bg-[#F6F7F5] px-5 py-2.5 rounded-full text-xs font-bold text-[#7BAE7F]">
                    <Flame className="w-4 h-4" /> Focus
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#FAFBF9] rounded-3xl p-8 border border-[#F0F2F0]">
                    <p className="text-xs font-bold text-app-text-secondary uppercase tracking-wider mb-3">Next task</p>
                    <p className="text-lg text-app-text-primary font-medium">
                      {overview.tasks.find(t => !t.completed)?.title || "Read database normalization chapter"}
                    </p>
                  </div>

                  <div className="bg-[#FAFBF9] rounded-3xl p-8 border border-[#F0F2F0]">
                    <p className="text-xs font-bold text-app-text-secondary uppercase tracking-wider mb-3">Break reminder</p>
                    <p className="text-lg text-app-text-primary font-medium">Drink water and stretch.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-[#E8F0E8] h-full">
                <h2 className="text-3xl font-bold text-app-text-primary mb-10">Pages</h2>
                
                <div className="space-y-6">
                  {[
                    { title: "Focus Timer Page", desc: "Open the timer from the left navigation.", page: 'focus' },
                    { title: "Tasks Page", desc: "Manage your tasks on the separate tasks page.", page: 'tasks' }
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => setPage(item.page)}
                      className="w-full text-left bg-[#FAFBF9] rounded-3xl p-8 border border-[#F0F2F0] hover:border-[#7BAE7F]/30 hover:bg-white transition-all group shadow-sm hover:shadow-md"
                    >
                      <p className="text-lg font-bold text-app-text-primary mb-2 group-hover:text-[#7BAE7F] transition-colors">{item.title}</p>
                      <p className="text-sm text-app-text-secondary italic">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Wellness Tip */}
          {overview.wellnessTip && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#7BAE7F]/10 border border-[#7BAE7F]/20 rounded-3xl p-6 flex items-start gap-4"
            >
              <div className="bg-white p-3 rounded-2xl text-[#7BAE7F] shadow-sm">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#4F7D5C] mb-1">Daily Wellness Tip</h4>
                <p className="text-sm text-app-text-secondary leading-relaxed">{overview.wellnessTip}</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

