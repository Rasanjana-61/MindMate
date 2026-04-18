import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  History,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { createFocusSession, createTask, deleteTask, fetchFocusOverview, updateTask } from '../lib/auth';

function createInitialTaskForm() {
  return {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    completed: false,
  };
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(Math.abs(totalSeconds) / 60);
  const seconds = Math.floor(Math.abs(totalSeconds) % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDateLabel(dateString) {
  if (!dateString) return 'No due date';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const priorityTheme = {
  high: {
    border: 'border-l-wellness-peach',
    dot: 'bg-wellness-peach',
    badge: 'bg-wellness-peach-light text-wellness-peach',
  },
  medium: {
    border: 'border-l-yellow-400',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-50 text-yellow-700',
  },
  low: {
    border: 'border-l-wellness-green',
    dot: 'bg-wellness-green',
    badge: 'bg-wellness-green-light text-wellness-green',
  },
};

export function FocusTimer({ user }) {
  const initialFocusMinutes = Number(user?.preferences?.focusDuration || 25);
  const initialBreakMinutes = Number(user?.preferences?.breakDuration || 5);

  const [focusMinutes, setFocusMinutes] = useState(initialFocusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initialBreakMinutes);
  const [timeLeft, setTimeLeft] = useState(initialFocusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [taskForm, setTaskForm] = useState(createInitialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [taskErrors, setTaskErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isLoggingSession, setIsLoggingSession] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [overview, setOverview] = useState({
    tasks: [],
    stats: { todayFocusMinutes: 0, weekFocusMinutes: 0, completedTasks: 0, totalTasks: 0, streakDays: 0 },
    chartData: [],
    recentSessions: [],
  });

  const [interruptionLogs, setInterruptionLogs] = useState(() => {
    const saved = localStorage.getItem('focus_interruptions');
    return saved ? JSON.parse(saved) : [];
  });

  const isActiveRef = useRef(isActive);
  const timeLeftRef = useRef(timeLeft);
  const isBreakRef = useRef(isBreak);

  useEffect(() => {
    isActiveRef.current = isActive;
    timeLeftRef.current = timeLeft;
    isBreakRef.current = isBreak;
  }, [isActive, timeLeft, isBreak]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isActiveRef.current && !isBreakRef.current) {
        setIsActive(false);
        const now = new Date();
        const newLog = {
          id: Date.now(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          remaining: formatCountdown(timeLeftRef.current),
          type: 'tab_switch'
        };
        setInterruptionLogs(prev => [newLog, ...prev].slice(0, 10));
        setErrorMessage('Timer paused! Keep your focus on MindMate for maximum efficiency.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  async function loadOverview() {
    setIsLoading(true);
    try {
      const data = await fetchFocusOverview();
      setOverview(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadOverview(); }, []);

  useEffect(() => {
    if (isActive) {
      const interval = window.setInterval(() => {
        if (selectedTaskId) {
          setTimeLeft((current) => current + 1);
        } else if (timeLeft > 0) {
          setTimeLeft((current) => current - 1);
        } else {
          setIsActive(false);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, timeLeft, selectedTaskId]);

  async function endSession(forceComplete = false) {
    const elapsedSeconds = selectedTaskId ? timeLeft : ((isBreak ? breakMinutes : focusMinutes) * 60 - timeLeft);
    const elapsedMinutes = elapsedSeconds / 60;
    setIsActive(false);
    setStatusMessage('Syncing focus data...');
    try {
      if (elapsedSeconds >= 6) {
        await createFocusSession({
          sessionType: isBreak ? 'break' : 'focus',
          plannedDurationMinutes: isBreak ? breakMinutes : focusMinutes,
          completedDurationMinutes: elapsedMinutes,
          completedAt: new Date().toISOString(),
          taskId: !isBreak ? selectedTaskId : null,
        });
      }

      const updatedData = await fetchFocusOverview();
      setOverview(updatedData);
      
      if (selectedTaskId) {
        const task = (updatedData.tasks || []).find(t => t.id === selectedTaskId);
        if (task) {
          if (forceComplete) {
            await updateTask(task.id, { ...task, completed: true });
            setStatusMessage(`"${task.title}" marked as completed.`);
          } else {
            const goalMin = task.priority === 'high' ? 60 : task.priority === 'medium' ? 40 : 20;
            if (task.totalTimeSpent >= goalMin && !task.completed) {
              await updateTask(task.id, { ...task, completed: true });
              setStatusMessage(`Goal reached! "${task.title}" completed.`);
            } else {
              setStatusMessage(`Progress saved for "${task.title}".`);
            }
          }
        }
      } else {
        setStatusMessage('Session finalized.');
      }
    } catch (error) {
      setErrorMessage('Progress logged locally.');
    } finally {
      setSelectedTaskId('');
      setTimeLeft(0);
      loadOverview();
    }
  }

  const getTaskGoalMinutes = () => {
    const task = (overview?.tasks || []).find(t => t.id === selectedTaskId);
    if (!task) return focusMinutes;
    return task.priority === 'high' ? 60 : task.priority === 'medium' ? 40 : 20;
  };

  const progressPercent = selectedTaskId 
    ? Math.round(Math.min(100, (timeLeft / (getTaskGoalMinutes() * 60)) * 100))
    : Math.round((((isBreak ? breakMinutes : focusMinutes) * 60 - timeLeft) / ((isBreak ? breakMinutes : focusMinutes) * 60)) * 100);

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 text-left">
      {/* Premium Hero Header */}
      <div className="bg-gradient-to-br from-[#E2F0E7] to-[#C8E4D1] rounded-[40px] p-10 text-[#2D3E33] relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-bold tracking-tight mb-2 leading-[1.1]">
            Run a study session <br /> with a simple timer.
          </h1>
          <p className="text-[#5F705F] text-lg font-medium opacity-80">Guided focus cycles designed for academic concentration.</p>
        </div>
        
        <div className="relative z-10 bg-white/40 backdrop-blur-md rounded-[32px] p-8 border border-white/20 min-w-[200px] text-center">
          <p className="text-[10px] font-bold text-[#7BAE7F] uppercase tracking-[0.2em] mb-2 text-left">Open Tasks</p>
          <p className="text-4xl font-bold text-[#2D3E33] mb-1 text-left">
            {(overview.tasks || []).filter(t => !t.completed).length}
          </p>
          <p className="text-xs text-[#5F705F] text-left opacity-70">tasks remaining</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7BAE7F]/10 blur-2xl rounded-full translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Main Timer Complex Card */}
      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-[#E8F0E8]">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2D3E33] mb-2">Pomodoro Focus Timer</h2>
            <p className="text-sm text-[#5F705F]">Stay on task with guided focus and break cycles designed for academic work.</p>
          </div>
          <div className="bg-[#E2F0E7] text-[#7BAE7F] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
            Focus Mode
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Circular Timer Display */}
          <div className="lg:col-span-6 bg-[#FAFBF9] rounded-[40px] p-10 border border-[#F0F2F0] flex flex-col items-center">
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Outer Glow Wrapper */}
              <div className={`absolute w-full h-full rounded-full blur-2xl opacity-20 transition-all duration-1000 ${isActive ? (isBreak ? 'bg-amber-400' : 'bg-[#7BAE7F]') : 'bg-gray-200'}`} />
              
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r={radius} fill="white" stroke="#F1F5F0" strokeWidth="6" />
                <circle
                  cx="130" cy="130" r={radius} fill="none"
                  stroke={isBreak ? '#F59E0B' : '#7BAE7F'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute flex flex-col items-center text-center">
                <p className="text-[10px] font-bold text-[#7BAE7F] uppercase tracking-[0.2em] mb-1">Current Session</p>
                <span className="text-7xl font-bold text-[#2D3E33] tracking-tighter">
                  {formatCountdown(timeLeft)}
                </span>
                <p className="text-xs text-[#5F705F] mt-4 max-w-[140px] font-medium leading-relaxed opacity-80 uppercase tracking-widest">
                  Keep one clear study goal for this session.
                </p>
              </div>
            </div>

            {/* Bottom Stat Row below timer */}
            <div className="grid grid-cols-3 gap-4 w-full mt-10">
              <div className="bg-white rounded-2xl p-4 border border-[#F0F2F0] text-center shadow-sm">
                <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider mb-1">Focus</p>
                <p className="text-lg font-bold text-[#2D3E33]">{focusMinutes}m</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-[#F0F2F0] text-center shadow-sm">
                <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider mb-1">Break</p>
                <p className="text-lg font-bold text-[#2D3E33]">{breakMinutes}m</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-[#F0F2F0] text-center shadow-sm">
                <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider mb-1">Mode</p>
                <p className="text-lg font-bold text-[#2D3E33]">{isBreak ? 'Break' : 'Focus'}</p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-4 mt-8 w-full justify-center">
              <button
                onClick={() => setIsActive(!isActive)}
                className="flex-1 bg-[#7BAE7F] hover:bg-[#6B9E6E] text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7BAE7F]/20 transition-all active:scale-95"
              >
                {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isActive ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={() => setIsActive(false)}
                className="bg-white border border-[#E8F0E8] text-[#2D3E33] w-28 h-14 rounded-2xl font-bold hover:bg-[#F6F7F5] transition-all flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={() => endSession(true)}
                className="bg-[#E2F0E7] text-[#7BAE7F] w-40 h-14 rounded-2xl font-bold hover:bg-[#D5EAD8] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </div>
          </div>

          {/* Right Column: Settings and Stats */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xl font-bold text-[#2D3E33]">Session Settings</h3>
                 <button className="flex items-center gap-2 text-xs font-bold text-[#5F705F] bg-[#FAFBF9] border border-[#F0F2F0] px-3 py-1.5 rounded-xl hover:bg-white transition-all shadow-sm">
                   <Activity className="w-3.5 h-3.5" /> Customizable
                 </button>
              </div>
              <p className="text-sm text-[#5F705F] mb-6">Adjust durations to match your revision intensity.</p>

              {/* Intensity Presets */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { name: 'Sprint', focus: 20, break: 5, active: false },
                  { name: 'Classic', focus: 25, break: 5, active: true },
                  { name: 'Deep Work', focus: 45, break: 10, active: false },
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFocusMinutes(preset.focus);
                      setBreakMinutes(preset.break);
                      setTimeLeft(preset.focus * 60);
                      setIsActive(false);
                    }}
                    className={`rounded-2xl p-5 border text-left transition-all shadow-sm ${preset.active ? 'bg-[#E2F0E7] border-[#7BAE7F]/30' : 'bg-white border-[#F0F2F0] hover:border-[#7BAE7F]/30'}`}
                  >
                    <p className={`text-sm font-bold mb-1 ${preset.active ? 'text-[#2D3E33]' : 'text-[#5F705F]'}`}>{preset.name}</p>
                    <p className="text-[10px] text-[#5F705F] opacity-70 font-medium">{preset.focus}/{preset.break}</p>
                  </button>
                ))}
              </div>

              {/* Numeric Inputs Styled as per screenshot */}
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5F705F] uppercase tracking-wider ml-1">Focus duration (minutes)</label>
                  <input 
                    type="number" 
                    value={focusMinutes}
                    onChange={(e) => setFocusMinutes(Number(e.target.value))}
                    className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-2xl px-5 py-4 text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#7BAE7F]/20 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5F705F] uppercase tracking-wider ml-1">Break duration (minutes)</label>
                  <input 
                    type="number" 
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-2xl px-5 py-4 text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#7BAE7F]/20 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#FAFBF9] rounded-2xl p-5 border border-[#F0F2F0] shadow-sm">
                  <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider mb-2">Progress</p>
                  <p className="text-lg font-bold text-[#2D3E33]">{progressPercent}%</p>
                </div>
                <div className="bg-[#FAFBF9] rounded-2xl p-5 border border-[#F0F2F0] shadow-sm">
                  <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider mb-2">Next break</p>
                  <p className="text-lg font-bold text-[#2D3E33]">{isBreak ? 'Now' : `${Math.ceil(timeLeft / 60)} min`}</p>
                </div>
                <div className="bg-[#FAFBF9] rounded-2xl p-5 border border-[#F0F2F0] shadow-sm">
                  <p className="text-[10px] font-bold text-[#5F705F] uppercase tracking-wider mb-2">Focus goal</p>
                  <p className="text-lg font-bold text-[#2D3E33]">{focusMinutes} min</p>
                </div>
              </div>

              <button 
                onClick={() => setTimeLeft(focusMinutes * 60)}
                className="w-full bg-[#7FAF8A] hover:bg-[#6FA5A5] text-white h-16 rounded-[24px] font-bold text-lg shadow-lg shadow-[#7FAF8A]/20 transition-all active:scale-[0.98]"
              >
                Save Timer Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Selection Section (Preserved Functionality) */}
      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-[#E8F0E8]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#2D3E33]">Active Task Tracker</h2>
            <p className="text-sm text-[#5F705F]">Select a task below to start recording live focus time.</p>
          </div>
          <div className="bg-[#FAFBF9] px-6 py-3 rounded-2xl border border-[#F0F2F0] flex flex-col items-end">
            <span className="text-2xl font-bold text-[#7BAE7F]">{progressPercent}%</span>
            <span className="text-[8px] uppercase font-bold text-[#5F705F] tracking-widest">Global Progress</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(overview.tasks || []).filter(t => !t.completed).map(task => {
            const theme = priorityTheme[task.priority];
            const isSelected = selectedTaskId === task.id;
            return (
              <motion.button 
                key={task.id} 
                onClick={() => { setSelectedTaskId(task.id); setTimeLeft(0); setIsActive(true); }}
                className={`text-left p-6 rounded-[32px] border transition-all relative overflow-hidden group hover:shadow-md ${isSelected ? 'bg-[#E2F0E7] border-[#7BAE7F]/30' : 'bg-[#FAFBF9] border-[#F0F2F0]'}`}
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${theme.badge}`}>
                      {task.priority}
                    </span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#7BAE7F] animate-ping" />}
                  </div>
                  <h4 className="font-bold text-lg text-[#2D3E33] mb-2 line-clamp-1">{task.title}</h4>
                  <div className="mt-auto pt-4 flex items-center gap-3 text-xs text-[#5F705F] font-medium opacity-70">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {Math.round(task.totalTimeSpent)}m logged</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDateLabel(task.dueDate)}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BAE7F]/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {statusMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 right-8 bg-[#7BAE7F] text-white px-8 py-4 rounded-[24px] shadow-2xl z-50 flex items-center gap-3 font-bold border border-white/20 backdrop-blur-md">
            <CheckCircle2 className="w-6 h-6" /> <span>{statusMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 right-8 bg-wellness-peach text-white px-8 py-4 rounded-[24px] shadow-2xl z-50 flex items-center gap-3 font-bold border border-white/20 backdrop-blur-md">
            <AlertTriangle className="w-6 h-6" /> <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}
