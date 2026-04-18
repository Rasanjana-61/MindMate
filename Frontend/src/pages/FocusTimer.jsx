import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
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
import { motion } from 'framer-motion';
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
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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

const priorityTheme = {
  high: {
    border: 'border-l-wellness-peach',
    dot: 'bg-wellness-peach',
    badge: 'bg-wellness-peach-light/50 text-wellness-peach',
  },
  medium: {
    border: 'border-l-yellow-400',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
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
    stats: {
      todayFocusMinutes: 0,
      weekFocusMinutes: 0,
      completedTasks: 0,
      pendingTasks: 0,
      totalTasks: 0,
      streakDays: 0,
    },
    chartData: [],
    recentSessions: [],
  });

  const currentDurationSeconds = (isBreak ? breakMinutes : focusMinutes) * 60;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / currentDurationSeconds) * circumference;

  async function loadOverview() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchFocusOverview();
      setOverview(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const [autoPauseInfo, setAutoPauseInfo] = useState(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isActive) {
        setIsActive(false);
        setAutoPauseInfo({
          pausedAt: new Date(),
        });
      } else if (document.visibilityState === 'visible' && autoPauseInfo) {
        const now = new Date();
        const pausedDurationSeconds = Math.round((now.getTime() - autoPauseInfo.pausedAt.getTime()) / 1000);
        const minutes = Math.floor(pausedDurationSeconds / 60);
        const seconds = pausedDurationSeconds % 60;
        
        const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        const timeString = autoPauseInfo.pausedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        setStatusMessage(`Auto-paused at ${timeString}. You were away for ${durationText}.`);
        setAutoPauseInfo(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, autoPauseInfo]);

  useEffect(() => {
    if (isActive) {
      const interval = window.setInterval(() => {
        if (selectedTaskId) {
          // Count UP mode for task tracking
          setTimeLeft((current) => current + 1);
        } else if (timeLeft > 0) {
          // Count DOWN mode for standard pomodoro
          setTimeLeft((current) => current - 1);
        } else {
          // Pomodoro finished
          setIsActive(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [isActive, timeLeft, selectedTaskId]);

  useEffect(() => {
    // Only auto-finalize for standard Pomodoro (count down)
    // If a task is selected, we use count up (stopwatch) and finalize manually via "End"
    if (selectedTaskId || timeLeft !== 0 || !isActive || isLoggingSession) {
      return;
    }

    async function finalizeSession() {
      setIsActive(false);
      setIsLoggingSession(true);
      setStatusMessage('');
      setErrorMessage('');

      try {
        await createFocusSession({
          sessionType: isBreak ? 'break' : 'focus',
          plannedDurationMinutes: isBreak ? breakMinutes : focusMinutes,
          completedDurationMinutes: isBreak ? breakMinutes : focusMinutes,
          completedAt: new Date().toISOString(),
          taskId: !isBreak ? selectedTaskId : null,
        });

        setStatusMessage(
          isBreak
            ? 'Break finished. Ready for the next focus block.'
            : 'Focus session completed and saved.'
        );

        setIsBreak((current) => !current);
        setTimeLeft((isBreak ? focusMinutes : breakMinutes) * 60);
        await loadOverview();
      } catch (error) {
        setErrorMessage(error.message);
        setTimeLeft((isBreak ? breakMinutes : focusMinutes) * 60);
      } finally {
        setIsLoggingSession(false);
      }
    }

    finalizeSession();
  }, [timeLeft, isActive, isBreak, focusMinutes, breakMinutes, isLoggingSession]);

  useEffect(() => {
    // Only reset timer to presets if NO task is selected
    if (!selectedTaskId) {
      setTimeLeft((isBreak ? breakMinutes : focusMinutes) * 60);
    } else {
      setTimeLeft(0);
    }
  }, [focusMinutes, breakMinutes, isBreak, selectedTaskId]);

  async function endSession() {
    const elapsedSeconds = selectedTaskId ? timeLeft : (currentDurationSeconds - timeLeft);
    const elapsedMinutes = elapsedSeconds / 60; // Precise decimal minutes

    setIsActive(false);
    setStatusMessage('Concluding session...');

    try {
      // 1. Save time spent if it's a meaningful session (6s+)
      if (elapsedSeconds >= 6) {
        await createFocusSession({
          sessionType: isBreak ? 'break' : 'focus',
          plannedDurationMinutes: isBreak ? breakMinutes : focusMinutes,
          completedDurationMinutes: elapsedMinutes,
          completedAt: new Date().toISOString(),
          taskId: !isBreak ? selectedTaskId : null,
        });
      }

      // 2. Fetch fresh data to check goals
      const updatedData = await fetchFocusOverview();
      setOverview(updatedData);
      
      // 3. Handle task completion logic if applicable
      if (selectedTaskId) {
        const task = (updatedData.tasks || []).find(t => t.id === selectedTaskId);
        if (task) {
          const goalMin = task.priority === 'high' ? 60 : task.priority === 'medium' ? 40 : 20;
          const isGoalReached = (task.totalTimeSpent || 0) >= goalMin;

          if (isGoalReached && !task.completed) {
            await updateTask(selectedTaskId, { ...task, completed: true });
            setStatusMessage(`Goal reached! "${task.title}" completed.`);
          } else {
            setStatusMessage(`Progress saved for "${task.title}".`);
          }
        }
      } else {
        setStatusMessage('Session ended.');
      }
    } catch (error) {
      console.error('Finalize session error:', error);
      setErrorMessage('Progress logged, but failed to sync dashboard immediately. Refresh to update.');
    } finally {
      // 4. ALWAYS reset UI state regardless of success/fail
      setSelectedTaskId('');
      setTimeLeft(0);
      setIsActive(false);
      await loadOverview();
    }
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      priority: task.priority,
      completed: task.completed,
    });
    setTaskErrors({});
    setStatusMessage('');
    setErrorMessage('');
  }

  function resetTaskForm() {
    setEditingTaskId('');
    setTaskForm(createInitialTaskForm());
    setTaskErrors({});
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    setIsSavingTask(true);
    setTaskErrors({});
    setStatusMessage('');
    setErrorMessage('');

    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || null,
      };

      const response = editingTaskId
        ? await updateTask(editingTaskId, payload)
        : await createTask(payload);

      setStatusMessage(response.message);
      resetTaskForm();
      await loadOverview();
    } catch (error) {
      setTaskErrors(error.errors || {});
      setErrorMessage(error.message);
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleToggleTask(task) {
    setStatusMessage('');
    setErrorMessage('');

    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        priority: task.priority,
        completed: !task.completed,
      });
      await loadOverview();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteTask(taskId) {
    setStatusMessage('');
    setErrorMessage('');

    try {
      await deleteTask(taskId);
      if (editingTaskId === taskId) {
        resetTaskForm();
      }
      setStatusMessage('Task deleted successfully.');
      await loadOverview();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const completedRatio = overview.stats.totalTasks
    ? Math.round((overview.stats.completedTasks / overview.stats.totalTasks) * 100)
    : 0;

  const nextDueTask = useMemo(
    () => overview.tasks.find((task) => !task.completed && task.dueDate) || null,
    [overview.tasks]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };


  const presets = [
    { name: 'Sprint', focus: 20, break: 5 },
    { name: 'Classic', focus: 25, break: 5 },
    { name: 'Deep Work', focus: 45, break: 10 },
  ];

  const handlePresetChange = (preset) => {
    setFocusMinutes(preset.focus);
    setBreakMinutes(preset.break);
    if (!isActive) {
      setTimeLeft(preset.focus * 60);
      setIsBreak(false);
    }
  };

  // Calculate progress goal based on priority if a task is selected
  const getTaskGoalMinutes = () => {
    const task = (overview?.tasks || []).find(t => t.id === selectedTaskId);
    if (!task) return focusMinutes;
    
    switch (task.priority) {
      case 'high': return 60;
      case 'medium': return 40;
      case 'low': return 20;
      default: return focusMinutes;
    }
  };

  const taskGoalMinutes = getTaskGoalMinutes();

  const progressPercent = selectedTaskId 
    ? Math.round(Math.min(100, (timeLeft / (taskGoalMinutes * 60)) * 100))
    : Math.round(((currentDurationSeconds - timeLeft) / currentDurationSeconds) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2F3E34]">Pomodoro Focus Timer</h1>
          <p className="text-[#6B7C72] mt-1 italic">Stay on task with guided focus and break cycles designed for academic work.</p>
        </div>
        <div className="bg-[#CFE6E6] text-[#6FA5A5] px-6 py-2 rounded-full text-sm font-bold shadow-sm border border-[#6FA5A5]/20">
          Focus Mode
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#D7E8DA]/50 relative overflow-hidden">
        {/* Live Progress Background Line */}
        {selectedTaskId && isActive && (
          <motion.div 
            className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-[#7BAE7F] to-[#6FA5A5] shadow-[0_0_10px_rgba(123,174,127,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (timeLeft / (taskGoalMinutes * 60)) * 100)}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 50 }}
          />
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-colors ${isActive ? 'bg-[#7BAE7F] text-white' : 'bg-[#F6F7F5] text-[#7BAE7F]'}`}>
              <CheckCircle2 className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-widest">
                {isActive ? 'Currently Tracking' : 'Active Task Tracking'}
              </p>
              <h3 className="text-lg font-bold text-[#2F3E34]">
                {selectedTaskId ? (overview?.tasks || []).find(t => t.id === selectedTaskId)?.title : "No task selected"}
              </h3>
            </div>
          </div>
          <div className="w-full md:w-auto min-w-[300px]">
            <select 
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-[#F6F7F5] border-none rounded-2xl px-6 py-4 text-[#2F3E34] focus:ring-2 focus:ring-[#7BAE7F]/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="">Select a task to track...</option>
              {(overview?.tasks || []).filter(t => !t.completed).map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Card: Timer Display */}
        <div className="lg:col-span-7 bg-white rounded-[40px] p-10 shadow-sm border border-[#D7E8DA]/50 flex flex-col items-center">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Outer Circle Ring */}
            <div className="absolute inset-0 rounded-full border-[16px] border-[#E8F0E8]" />
            
            {/* Progress Circle */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 320 320">
              <circle
                cx="160"
                cy="160"
                r="144"
                fill="none"
                stroke={isBreak ? '#B8D0B8' : '#7BAE7F'}
                strokeWidth="16"
                strokeDasharray="904.78"
                strokeDashoffset={904.78 - (timeLeft / currentDurationSeconds) * 904.78}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Timer Text */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold text-[#6B7C72] uppercase tracking-[0.2em] mb-4">
                {selectedTaskId ? "TRACKING TASK" : "CURRENT SESSION"}
              </p>
              <h2 className="text-8xl font-bold text-[#2F3E34] font-mono leading-none tracking-tighter">
                {formatCountdown(timeLeft)}
              </h2>
              <p className="text-sm text-[#6B7C72] mt-8 max-w-[180px] leading-relaxed">
                {selectedTaskId ? "Viewing live time for selected task." : "Keep one clear study goal for this session."}
              </p>
            </div>
          </div>

          {/* Session Info Tabs */}
          <div className="grid grid-cols-3 gap-4 w-full mt-12">
            <div className="bg-[#F6F7F5] rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-[#6B7C72] uppercase mb-1">Focus</p>
              <p className="text-lg font-bold text-[#2F3E34]">{focusMinutes}m</p>
            </div>
            <div className="bg-[#F6F7F5] rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-[#6B7C72] uppercase mb-1">Break</p>
              <p className="text-lg font-bold text-[#2F3E34]">{breakMinutes}m</p>
            </div>
            <div className="bg-[#F6F7F5] rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-[#6B7C72] uppercase mb-1">Mode</p>
              <p className="text-lg font-bold text-[#2F3E34]">{isBreak ? 'Break' : 'Focus'}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setIsActive(!isActive)}
              className="bg-[#6FA5A5] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-[#6FA5A5]/30 hover:bg-[#5E9494] transition-all hover:-translate-y-1 active:scale-95"
            >
              {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={endSession}
              className="bg-[#DDEAD9] text-[#4F7D5C] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-[#CFE3D2] transition-all hover:-translate-y-1 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              End Session
            </button>
          </div>
        </div>

        {/* Right Card: Settings */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-[40px] p-10 shadow-sm border border-[#D7E8DA]/50 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-[#2F3E34]">Session Settings</h2>
              <button className="flex items-center gap-2 text-xs font-bold text-[#6B7C72] border border-[#DDEAD9] px-3 py-1.5 rounded-lg hover:bg-[#F6F7F5]">
                <Activity className="w-4 h-4" /> Customizable
              </button>
            </div>
            <p className="text-sm text-[#6B7C72] mb-8">Adjust durations to match your revision intensity.</p>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetChange(preset)}
                  className={`p-4 rounded-2xl text-left transition-all border ${
                    focusMinutes === preset.focus && breakMinutes === preset.break
                      ? 'bg-[#D7E8DA] border-[#7BAE7F] ring-2 ring-[#7BAE7F]/20'
                      : 'bg-[#F6F7F5] border-transparent hover:border-[#DDEAD9]'
                  }`}
                >
                  <p className="font-bold text-[#2F3E34] text-sm">{preset.name}</p>
                  <p className="text-[10px] text-[#6B7C72] mt-1">{preset.focus}/{preset.break}</p>
                </button>
              ))}
            </div>

            {/* Duration Inputs */}
            <div className="space-y-6 flex-1">
              <div>
                <label className="text-sm font-medium text-[#6B7C72] block mb-2">Focus duration (minutes)</label>
                <input
                  type="number"
                  value={focusMinutes}
                  onChange={(e) => setFocusMinutes(Number(e.target.value))}
                  className="w-full bg-[#F6F7F5] border-none rounded-2xl px-6 py-4 text-[#2F3E34] focus:ring-2 focus:ring-[#7BAE7F]/20 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B7C72] block mb-2">Break duration (minutes)</label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full bg-[#F6F7F5] border-none rounded-2xl px-6 py-4 text-[#2F3E34] focus:ring-2 focus:ring-[#7BAE7F]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-3 gap-3 pt-8 mt-8 border-t border-[#F6F7F5]">
              <div className="text-left">
                <p className="text-[10px] text-[#6B7C72] font-bold uppercase mb-1">Progress</p>
                <p className="text-lg font-bold text-[#2F3E34]">{progressPercent}%</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-[#6B7C72] font-bold uppercase mb-1">Next break</p>
                <p className="text-lg font-bold text-[#2F3E34]">{breakMinutes} min</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-[#6B7C72] font-bold uppercase mb-1">Focus goal</p>
                <p className="text-lg font-bold text-[#2F3E34]">{focusMinutes} min</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                if (selectedTaskId) {
                  setTimeLeft(0);
                } else {
                  setTimeLeft((isBreak ? breakMinutes : focusMinutes) * 60);
                }
                setStatusMessage('Settings applied and timer reset.');
                setTimeout(() => setStatusMessage(''), 3000);
              }}
              className="w-full mt-8 bg-[#6FA5A5] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#6FA5A5]/20 hover:bg-[#5E9494] transition-all active:scale-[0.98]"
            >
              Save Timer Settings
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 bg-[#7BAE7F] text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" /> {statusMessage}
        </motion.div>
      )}
    </div>
  );
}
