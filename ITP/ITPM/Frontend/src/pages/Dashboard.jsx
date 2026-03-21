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
        className="bg-gradient-to-r from-wellness-blue to-blue-500 rounded-3xl p-8 text-white shadow-lg shadow-wellness-blue/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-wellness-peach/20 rounded-full blur-2xl translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {userName.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg max-w-xl">
              Your dashboard now reflects live mood, focus, task, peer, and AI summary activity.
            </p>
          </div>

          <div className="hidden md:flex gap-3">
            <button onClick={() => setPage('mood')} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <Smile className="w-4 h-4" /> Log Mood
            </button>
            <button onClick={() => setPage('focus')} className="bg-white text-wellness-blue hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4" /> Start Focus
            </button>
          </div>
        </div>
      </motion.div>

      {errorMessage ? (
        <div className="rounded-2xl border border-wellness-peach/30 bg-wellness-peach-light/30 px-4 py-3 text-sm text-wellness-peach">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-wellness-blue mb-4" />
          <p className="text-sm text-wellness-text-sec">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants} className="card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-wellness-blue-light p-2 rounded-lg text-wellness-blue">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-wellness-text-sec">Today's Focus</span>
              </div>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-wellness-text">{overview.stats.todayFocusLabel}</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-wellness-green-light p-2 rounded-lg text-wellness-green">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-wellness-text-sec">Tasks Done</span>
              </div>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-wellness-text">
                  {overview.stats.completedTasks}
                  <span className="text-lg text-wellness-text-muted">/{overview.stats.totalTasks}</span>
                </h3>
              </div>
              <div className="w-full bg-wellness-bg h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-wellness-green h-full rounded-full"
                  style={{
                    width: `${overview.stats.totalTasks ? (overview.stats.completedTasks / overview.stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-wellness-peach-light/50 p-2 rounded-lg text-wellness-peach">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-wellness-text-sec">Current Streak</span>
              </div>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-wellness-text">{overview.stats.streakDays} Days</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-wellness-lavender/30 p-2 rounded-lg text-purple-600">
                  <Smile className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-wellness-text-sec">Avg Mood</span>
              </div>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-wellness-text">{overview.stats.averageMood || 0}</h3>
                <span className="text-xl mb-0.5">{overview.stats.averageMoodEmoji}</span>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="card p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-wellness-peach-light/40 to-transparent rounded-bl-full -z-10" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Smile className="w-5 h-5 text-wellness-peach" />
                      Mood Check-in
                    </h2>
                  </div>
                  <p className="text-sm text-wellness-text-sec mb-6">
                    Your recent average mood is {overview.stats.averageMood || 0}/5.
                  </p>

                  <div className="flex justify-between items-center mb-6 bg-wellness-bg/50 p-4 rounded-2xl border border-wellness-border/50">
                    {emojis.map((emoji, index) => (
                      <button key={index} onClick={() => setPage('mood')} className="text-3xl hover:scale-125 transition-transform p-2 rounded-full hover:bg-white hover:shadow-sm">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setPage('mood')} className="text-wellness-blue text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all w-fit">
                  View detailed history <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-wellness-green" />
                    Today's Tasks
                  </h2>
                  <button onClick={() => setPage('focus')} className="text-wellness-blue text-sm hover:underline font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {overview.tasks.length ? (
                    overview.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-wellness-border/50 hover:border-wellness-blue/30 hover:shadow-sm transition-all group">
                        <button className="mt-0.5 text-wellness-text-muted group-hover:text-wellness-blue transition-colors">
                          {task.completed ? <CheckCircle2 className="w-5 h-5 text-wellness-green" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${task.completed ? 'text-wellness-text-muted line-through' : 'text-wellness-text'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-wellness-text-muted mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDateLabel(task.dueDate)}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${task.priority === 'high' ? 'bg-wellness-peach' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-wellness-green'}`} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-wellness-text-sec">No tasks created yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6 flex flex-col justify-between bg-gradient-to-br from-white to-wellness-blue-light/30 border-wellness-blue-light">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Flame className="w-5 h-5 text-wellness-blue" />
                      Focus Session
                    </h2>
                  </div>

                  <div className="flex items-center gap-8 mb-6">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#E8F4FD" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#6B9FD4"
                          strokeWidth="8"
                          strokeDasharray="283"
                          strokeDashoffset={283 - (overview.focus.goalProgressPercent / 100) * 283}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold text-wellness-text">{overview.focus.todayFocusLabel}</span>
                        <span className="text-[10px] text-wellness-text-muted uppercase tracking-wider font-medium">Today</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-wellness-text-sec mb-2">Daily Goal: {overview.focus.dailyGoalHours}h</p>
                      <div className="w-full bg-wellness-bg h-2 rounded-full mb-2 overflow-hidden">
                        <div className="bg-wellness-blue h-full rounded-full" style={{ width: `${overview.focus.goalProgressPercent}%` }} />
                      </div>
                      <p className="text-sm font-medium text-wellness-text">
                        {overview.focus.goalProgressPercent >= 100
                          ? 'Daily goal reached. Nice work.'
                          : `${overview.focus.goalProgressPercent}% of your daily goal is complete.`}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setPage('focus')} className="btn-primary w-full flex justify-center items-center gap-2 shadow-md shadow-wellness-blue/20">
                  Continue Session
                </button>
              </div>

              <div className="card p-6 bg-gradient-to-r from-wellness-blue-light/40 to-white border-l-4 border-l-wellness-blue">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-wellness-blue shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-wellness-text mb-1">AI Resources</h3>
                    <p className="text-sm text-wellness-text-sec mb-4">
                      {overview.resources.length
                        ? `You have ${overview.resources.length} recent AI summaries ready for revision.`
                        : 'Upload readings and get instant key points, definitions, and revision summaries.'}
                    </p>
                    <button onClick={() => setPage('resources')} className="btn-secondary text-sm py-2 px-5">
                      {overview.resources.length ? 'Open Summaries' : 'Try it now'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-wellness-lavender" />
                    Community Trending
                  </h2>
                </div>
                <div className="space-y-4 mb-5">
                  {overview.peerDiscussions.length ? (
                    overview.peerDiscussions.map((discussion) => (
                      <div key={discussion.id} className="group cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-wellness-text mb-1 group-hover:text-wellness-blue transition-colors line-clamp-2">
                              {discussion.title}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-wellness-bg rounded-md text-wellness-text-sec">
                                {discussion.tag}
                              </span>
                              <span className="text-xs text-wellness-text-muted flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> {discussion.replies}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-wellness-text-sec">No peer discussions yet in your faculty feed.</p>
                  )}
                </div>
                <button onClick={() => setPage('peer')} className="text-wellness-blue text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Join the discussion <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-wellness-green-light/50 border border-wellness-green/30 rounded-2xl p-4 flex items-start gap-4 relative group">
            <div className="bg-white p-2.5 rounded-xl text-wellness-green shrink-0 shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="pr-6">
              <h4 className="font-semibold text-wellness-green mb-1 text-sm">Daily Wellness Tip</h4>
              <p className="text-sm text-wellness-text-sec leading-relaxed">{overview.wellnessTip}</p>
            </div>
            <button className="absolute top-4 right-4 text-wellness-green/50 hover:text-wellness-green transition-colors opacity-0 group-hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
