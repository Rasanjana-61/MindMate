import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Loader2,
  Layout,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTask, deleteTask, fetchFocusOverview, updateTask } from '../lib/auth';

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
    bg: 'bg-red-50 text-red-600 border-red-100',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    bg: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    bg: 'bg-green-50 text-green-600 border-green-100',
    badge: 'bg-green-100 text-green-700',
  },
};

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [categoryError, setCategoryError] = useState('');

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    nextStep: '',
  });

  async function loadTasks() {
    setIsLoading(true);
    try {
      const data = await fetchFocusOverview();
      setTasks(data.tasks || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setCategoryError('');

    // Category Validation: IT, SE, DS, BS + 4 digits
    const categoryRegex = /^(IT|SE|DS|BS)\d{4}$/;
    if (!taskForm.category || !categoryRegex.test(taskForm.category)) {
      setCategoryError('Must start with IT, SE, DS, or BS followed by 4 digits (e.g., IT1010)');
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskForm);
      } else {
        await createTask(taskForm);
      }
      setIsAddingTask(false);
      setEditingTask(null);
      setCategoryError('');
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', category: '', nextStep: '' });
      loadTasks();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      loadTasks();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await updateTask(task.id, { ...task, completed: !task.completed });
      loadTasks();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'completed' && t.completed) || 
                         (filter === 'pending' && !t.completed);
    return matchesSearch && matchesFilter;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 text-left">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#E2F0E7] to-[#C8E4D1] rounded-[40px] p-10 text-[#2D3E33] relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-bold tracking-tight mb-2 leading-[1.1]">
            View, add, and update <br /> your study tasks.
          </h1>
          <p className="text-[#5F705F] text-lg font-medium opacity-80">Organize your academic workload with ease.</p>
        </div>
        
        <div className="relative z-10 bg-white/40 backdrop-blur-md rounded-[32px] p-8 border border-white/20 min-w-[200px] text-center">
          <p className="text-[10px] font-bold text-[#7BAE7F] uppercase tracking-[0.2em] mb-2 text-left">Completed</p>
          <p className="text-4xl font-bold text-[#2D3E33] mb-1 text-left">
            {completedCount}
          </p>
          <p className="text-xs text-[#5F705F] text-left opacity-70">tasks done</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-[#E8F0E8]">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <h2 className="text-3xl font-bold text-[#2D3E33]">Task Manager</h2>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 bg-[#7BAE7F] hover:bg-[#6B9E6E] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#7BAE7F]/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Task
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8C0B8]" />
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-[24px] pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-[#7BAE7F]/20 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="flex p-1 bg-[#FAFBF9] border border-[#F0F2F0] rounded-[24px]">
            {['all', 'pending', 'in-progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-[20px] text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white text-[#7BAE7F] shadow-sm' : 'text-[#5F705F] opacity-70 hover:opacity-100'}`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Visible tasks', value: filteredTasks.length },
            { label: 'Completed', value: completedCount },
            { label: 'High priority', value: highPriorityCount }
          ].map((stat, i) => (
            <div key={i} className="bg-[#FAFBF9] rounded-[32px] p-8 border border-[#F0F2F0]">
              <p className="text-xs font-bold text-[#5F705F] uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-4xl font-bold text-[#2D3E33]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#7BAE7F]" />
              <p className="text-[#5F705F] font-medium">Loading tasks...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={task.id} 
                className={`bg-white rounded-[40px] p-10 border border-[#E8F0E8] shadow-sm hover:shadow-md transition-shadow relative group ${task.completed ? 'opacity-80' : ''}`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-[#E2F0E7] text-[#7BAE7F] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {task.category || 'General Study'}
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold text-[#2D3E33] ${task.completed ? 'line-through opacity-50' : ''}`}>
                      {task.title}
                    </h3>
                    <p className="text-[#5F705F] text-sm leading-relaxed max-w-2xl">
                      {task.description || 'No description provided.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => toggleComplete(task)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${task.completed ? 'bg-[#7BAE7F] text-white' : 'bg-[#FAFBF9] text-[#7BAE7F] border border-[#F0F2F0] hover:bg-[#E2F0E7]'}`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${priorityTheme[task.priority].bg}`}>
                    {task.priority}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${task.completed ? 'bg-[#E2F0E7] text-[#7BAE7F]' : 'bg-gray-100 text-gray-500'}`}>
                    {task.completed ? 'Completed' : 'Pending'}
                  </span>
                  <span className="bg-[#FAFBF9] border border-[#F0F2F0] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5F705F]">
                    {Math.ceil(task.totalTimeSpent / 25)} Pomodoros
                  </span>
                </div>

                {/* Next Step Box */}
                {task.nextStep && (
                  <div className="bg-[#FAFBF9] rounded-[24px] p-6 border border-[#F0F2F0] mb-8">
                    <p className="text-[10px] font-bold text-[#7BAE7F] uppercase tracking-[0.2em] mb-2">Next</p>
                    <p className="text-sm font-medium text-[#2D3E33]">{task.nextStep}</p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-2 mb-10">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#5F705F]">
                    <span>Progress</span>
                    <span>{task.completed ? '100%' : 'In Progress'}</span>
                  </div>
                  <div className="h-2 bg-[#FAFBF9] rounded-full overflow-hidden border border-[#F0F2F0]">
                    <motion.div 
                      className="h-full bg-[#7BAE7F] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: task.completed ? '100%' : '40%' }} // Mock progress for pending
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setEditingTask(task);
                      setTaskForm(task);
                      setIsAddingTask(true);
                    }}
                    className="flex items-center gap-2 bg-white border border-[#E8F0E8] px-6 py-3 rounded-2xl text-xs font-bold text-[#5F705F] hover:bg-[#F6F7F5] transition-all"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center bg-[#FAFBF9] border-2 border-dashed border-[#F0F2F0] rounded-[40px]">
              <p className="text-[#5F705F] font-medium italic">No tasks found. Click "Add Task" to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTask(false)}
              className="absolute inset-0 bg-[#2D3E33]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              <h2 className="text-3xl font-bold text-[#2D3E33] mb-8">{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
              <form onSubmit={handleSaveTask} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#5F705F] uppercase tracking-wider mb-2 ml-2">Task Title</label>
                  <input 
                    required
                    type="text" 
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    placeholder="e.g. Submit mobile UX reflection"
                    className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-2xl px-6 py-4 text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#7BAE7F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5F705F] uppercase tracking-wider mb-2 ml-2">Description</label>
                  <textarea 
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    placeholder="Enter task details..."
                    className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-2xl px-6 py-4 text-sm font-medium text-[#2D3E33] min-h-[120px] focus:ring-2 focus:ring-[#7BAE7F]/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5F705F] uppercase tracking-wider mb-2 ml-2">Category</label>
                    <input 
                      type="text" 
                      value={taskForm.category}
                      onChange={(e) => {
                        setTaskForm({...taskForm, category: e.target.value.toUpperCase()});
                        if (categoryError) setCategoryError('');
                      }}
                      placeholder="e.g. IT1010"
                      className={`w-full bg-[#FAFBF9] border ${categoryError ? 'border-red-400' : 'border-[#F0F2F0]'} rounded-2xl px-6 py-4 text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#7BAE7F]/20 outline-none transition-all`}
                    />
                    {categoryError && <p className="text-[10px] text-red-500 font-bold mt-2 ml-2">{categoryError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5F705F] uppercase tracking-wider mb-2 ml-2">Priority</label>
                    <select 
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-2xl px-6 py-4 text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#7BAE7F]/20 outline-none transition-all"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5F705F] uppercase tracking-wider mb-2 ml-2">Next Step (Reminder)</label>
                  <input 
                    type="text" 
                    value={taskForm.nextStep}
                    onChange={(e) => setTaskForm({...taskForm, nextStep: e.target.value})}
                    placeholder="What's the immediate next thing to do?"
                    className="w-full bg-[#FAFBF9] border border-[#F0F2F0] rounded-2xl px-6 py-4 text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#7BAE7F]/20 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4 mt-10">
                  <button 
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="flex-1 bg-white border border-[#E8F0E8] h-16 rounded-2xl font-bold text-[#5F705F] hover:bg-[#F6F7F5] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#7BAE7F] text-white h-16 rounded-2xl font-bold shadow-lg shadow-[#7BAE7F]/20 hover:bg-[#6FA5A5] transition-all"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
