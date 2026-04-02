import { useEffect, useMemo, useState } from 'react';
import { Calendar, Download, Info, Lightbulb, Pencil, Save, Trash2, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { createMoodLog, deleteMoodLog, fetchMoodOverview, updateMoodLog } from '../lib/auth';

const moodOptions = [
  { value: 1, icon: '\u{1F622}', label: 'Struggling' },
  { value: 2, icon: '\u{1F614}', label: 'Low' },
  { value: 3, icon: '\u{1F610}', label: 'Okay' },
  { value: 4, icon: '\u{1F60C}', label: 'Good' },
  { value: 5, icon: '\u{1F60A}', label: 'Great' },
];

const sentimentStyles = {
  positive: {
    accent: 'border-l-wellness-green',
    badge: 'bg-wellness-green-light text-wellness-green',
  },
  neutral: {
    accent: 'border-l-wellness-blue',
    badge: 'bg-wellness-blue-light text-wellness-blue',
  },
  negative: {
    accent: 'border-l-wellness-peach',
    badge: 'bg-wellness-peach-light/60 text-wellness-peach',
  },
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialForm() {
  return {
    entryDate: getTodayValue(),
    moodValue: null,
    stressLevel: 5,
    energyLevel: 5,
    note: '',
  };
}

function formatDateLabel(dateString, options = {}) {
  if (!dateString) {
    return '-';
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

function toInputDate(dateString) {
  return new Date(dateString).toISOString().slice(0, 10);
}

function downloadCsv(logs) {
  const rows = [
    ['Date', 'Mood', 'Stress', 'Energy', 'Sentiment', 'Note'],
    ...logs.map((log) => [
      toInputDate(log.entryDate),
      String(log.moodValue),
      String(log.stressLevel),
      String(log.energyLevel),
      log.sentiment,
      `"${(log.note || '').replace(/"/g, '""')}"`,
    ]),
  ];

  const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mood-history-${getTodayValue()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function MoodTracker() {
  const [timeframe, setTimeframe] = useState('week');
  const [form, setForm] = useState(createInitialForm);
  const [editingId, setEditingId] = useState('');
  const [overview, setOverview] = useState({
    logs: [],
    chartData: [],
    stats: {
      totalEntries: 0,
      averageMood: 0,
      averageStress: 0,
      averageEnergy: 0,
      highestMoodDay: null,
      lowestMoodDay: null,
    },
    weeklySummary: {
      summary: '',
      mostStressfulDay: null,
      lowestEnergyDay: null,
    },
    encouragementMessage: '',
    insightCards: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedMood = useMemo(
    () => moodOptions.find((option) => option.value === form.moodValue) || null,
    [form.moodValue]
  );

  async function loadOverview(nextTimeframe = timeframe) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchMoodOverview(nextTimeframe);
      setOverview(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview(timeframe);
  }, [timeframe]);

  function resetForm() {
    setForm(createInitialForm());
    setEditingId('');
    setFieldErrors({});
  }

  function startEditing(log) {
    setEditingId(log.id);
    setForm({
      entryDate: toInputDate(log.entryDate),
      moodValue: log.moodValue,
      stressLevel: log.stressLevel,
      energyLevel: log.energyLevel,
      note: log.note || '',
    });
    setFieldErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  }

  async function handleSubmit() {
    if (!form.moodValue) {
      setFieldErrors({ moodValue: 'Select a mood before saving.' });
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    try {
      const payload = {
        entryDate: form.entryDate,
        moodValue: form.moodValue,
        stressLevel: form.stressLevel,
        energyLevel: form.energyLevel,
        note: form.note,
      };

      const response = editingId
        ? await updateMoodLog(editingId, payload)
        : await createMoodLog(payload);

      setSuccessMessage(response.message);
      resetForm();
      await loadOverview(timeframe);
    } catch (error) {
      setFieldErrors(error.errors || {});
      setErrorMessage(error.message);

      if (error.status === 409 && error.data?.existingLog) {
        startEditing(error.data.existingLog);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(logId) {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteMoodLog(logId);

      if (editingId === logId) {
        resetForm();
      }

      setSuccessMessage('Mood log deleted successfully.');
      await loadOverview(timeframe);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto"
    >
      <motion.div variants={itemVariants} className="card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-wellness-blue-light/40 via-white to-wellness-green-light/20 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wellness-blue mb-2">
                Mood and Mental Health
              </p>
              <h2 className="text-3xl font-bold text-wellness-text mb-2">
                Daily check-ins with real trend tracking
              </h2>
              <p className="text-wellness-text-sec max-w-2xl">
                Log how you feel, record stress and energy, and review weekly patterns from your stored mood history.
              </p>
            </div>

            <div className="bg-white/90 border border-wellness-border rounded-2xl px-5 py-4 min-w-[260px] shadow-sm">
              <p className="text-sm font-semibold text-wellness-text mb-1">Smart encouragement</p>
              <p className="text-sm text-wellness-text-sec">{overview.encouragementMessage || 'Your next check-in will start building your trend line.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
            <div>
              <h3 className="text-lg font-semibold text-center mb-6 text-wellness-text">
                How are you feeling right now?
              </h3>

              <div className="flex justify-between md:justify-center gap-2 md:gap-6 mb-6 bg-wellness-bg/60 p-4 rounded-3xl border border-wellness-border/50">
                {moodOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setForm((current) => ({ ...current, moodValue: option.value }));
                      setFieldErrors((current) => ({ ...current, moodValue: '' }));
                    }}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                      form.moodValue === option.value ? 'scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`text-4xl md:text-5xl p-3 rounded-2xl transition-all duration-300 ${
                        form.moodValue === option.value
                          ? 'bg-white shadow-lg shadow-wellness-blue/20 ring-4 ring-wellness-blue/20'
                          : 'bg-transparent hover:bg-white/60'
                      }`}
                    >
                      {option.icon}
                    </div>
                    <span
                      className={`text-xs md:text-sm font-medium ${
                        form.moodValue === option.value ? 'text-wellness-blue' : 'text-wellness-text-sec'
                      }`}
                    >
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {fieldErrors.moodValue ? (
                <p className="text-sm text-wellness-peach mb-5">{fieldErrors.moodValue}</p>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-wellness-border/60 shadow-sm">
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-semibold text-wellness-text">Date</label>
                    <Calendar className="w-4 h-4 text-wellness-text-muted" />
                  </div>
                  <input
                    type="date"
                    value={form.entryDate}
                    onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))}
                    className="w-full rounded-xl border border-wellness-border bg-wellness-bg px-3 py-2 text-sm outline-none focus:border-wellness-blue"
                  />
                  {fieldErrors.entryDate ? <p className="text-xs text-wellness-peach mt-2">{fieldErrors.entryDate}</p> : null}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-wellness-border/60 shadow-sm">
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-semibold text-wellness-text">Stress Level</label>
                    <span className="text-sm font-bold text-wellness-text-sec">{form.stressLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.stressLevel}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stressLevel: Number(event.target.value) }))
                    }
                    className="w-full h-2 bg-gradient-to-r from-wellness-green via-yellow-400 to-red-400 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-wellness-text-muted mt-3 font-medium">
                    <span>Relaxed</span>
                    <span>Stressed</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-wellness-border/60 shadow-sm">
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-semibold text-wellness-text">Energy Level</label>
                    <span className="text-sm font-bold text-wellness-text-sec">{form.energyLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.energyLevel}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, energyLevel: Number(event.target.value) }))
                    }
                    className="w-full h-2 bg-gradient-to-r from-slate-300 to-yellow-400 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-wellness-text-muted mt-3 font-medium">
                    <span>Exhausted</span>
                    <span>Energized</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-wellness-text mb-2">
                  Reflection note <span className="text-wellness-text-muted font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    maxLength={500}
                    placeholder="Add a short reflection about your day, workload, or wins."
                    className="w-full p-4 bg-wellness-bg border border-transparent rounded-2xl focus:bg-white focus:border-wellness-blue focus:ring-4 focus:ring-wellness-blue/10 outline-none resize-none h-28 text-sm transition-all"
                  />
                  <span className="absolute bottom-3 right-4 text-xs text-wellness-text-muted">
                    {form.note.length}/500
                  </span>
                </div>
                {selectedMood ? (
                  <p className="text-xs text-wellness-text-muted mt-2">
                    Current mood selection: {selectedMood.icon} {selectedMood.label}
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="mb-4 rounded-2xl border border-wellness-peach/30 bg-wellness-peach-light/30 px-4 py-3 text-sm text-wellness-peach">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mb-4 rounded-2xl border border-wellness-green/30 bg-wellness-green-light/40 px-4 py-3 text-sm text-wellness-green">
                  {successMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                {editingId ? (
                  <button
                    onClick={resetForm}
                    className="btn-secondary px-5 py-3 flex items-center gap-2"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                ) : null}

                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`btn-primary px-8 py-3 shadow-lg shadow-wellness-blue/20 flex items-center gap-2 ${
                    isSaving ? 'opacity-60 cursor-not-allowed shadow-none' : ''
                  }`}
                  type="button"
                >
                  {editingId ? <Save className="w-4 h-4" /> : null}
                  {isSaving ? 'Saving...' : editingId ? 'Update Log' : 'Log Mood'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
                <div className="bg-white border border-wellness-border/60 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-medium text-wellness-text-sec mb-2">Entries saved</p>
                  <p className="text-3xl font-bold text-wellness-text">{overview.stats.totalEntries}</p>
                </div>
                <div className="bg-white border border-wellness-border/60 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-medium text-wellness-text-sec mb-2">Average mood</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-wellness-blue">{overview.stats.averageMood || 0}</p>
                    <span className="text-lg mb-1">/5</span>
                  </div>
                </div>
                <div className="bg-white border border-wellness-border/60 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-medium text-wellness-text-sec mb-2">Average stress</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-wellness-peach">{overview.stats.averageStress || 0}</p>
                    <span className="text-lg mb-1">/10</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-wellness-border/60 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-semibold text-wellness-text mb-2">Weekly insight summary</p>
                <p className="text-sm text-wellness-text-sec leading-6">{overview.weeklySummary.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl bg-wellness-bg px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-wellness-text-muted mb-1">Most stressful day</p>
                    <p className="text-sm font-semibold text-wellness-text">
                      {overview.weeklySummary.mostStressfulDay
                        ? `${formatDateLabel(overview.weeklySummary.mostStressfulDay.entryDate)} (${overview.weeklySummary.mostStressfulDay.stressLevel}/10)`
                        : 'No data'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-wellness-bg px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-wellness-text-muted mb-1">Lowest energy day</p>
                    <p className="text-sm font-semibold text-wellness-text">
                      {overview.weeklySummary.lowestEnergyDay
                        ? `${formatDateLabel(overview.weeklySummary.lowestEnergyDay.entryDate)} (${overview.weeklySummary.lowestEnergyDay.energyLevel}/10)`
                        : 'No data'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-wellness-blue" />
            Mood History Dashboard
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-wellness-bg rounded-xl p-1 border border-wellness-border/50">
              <button
                onClick={() => setTimeframe('week')}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                  timeframe === 'week'
                    ? 'bg-white shadow-sm font-semibold text-wellness-text'
                    : 'text-wellness-text-sec hover:text-wellness-text'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                  timeframe === 'month'
                    ? 'bg-white shadow-sm font-semibold text-wellness-text'
                    : 'text-wellness-text-sec hover:text-wellness-text'
                }`}
              >
                Month
              </button>
            </div>

            <button
              className="p-2 text-wellness-text-sec hover:text-wellness-blue hover:bg-wellness-blue-light rounded-lg transition-colors"
              title="Export data"
              onClick={() => downloadCsv(overview.logs)}
              type="button"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="h-72 mb-8 mt-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-wellness-text-sec">
              Loading mood history...
            </div>
          ) : overview.chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B9FD4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6B9FD4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CFE3D2" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#718096', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#718096', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px',
                  }}
                  formatter={(value) => {
                    const mood = moodOptions.find((option) => option.value === value);
                    return [`${mood?.icon || ''} ${value}/5`, 'Mood'];
                  }}
                  labelFormatter={(label, payload) => {
                    if (!payload?.[0]?.payload?.entryDate) {
                      return label;
                    }

                    return formatDateLabel(payload[0].payload.entryDate);
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="moodValue"
                  stroke="#6FA5A5"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorMood)"
                  activeDot={{ r: 6, fill: '#6B9FD4', strokeWidth: 4, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-3xl border border-dashed border-wellness-border flex items-center justify-center text-center px-8 text-sm text-wellness-text-sec">
              No stored mood history yet. Your first saved entry will appear here.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-wellness-blue-light/50 border border-wellness-blue/10 p-5 rounded-2xl">
            <p className="text-sm font-medium text-wellness-text-sec mb-2">Average mood</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-wellness-blue">{overview.stats.averageMood || 0}</p>
              <span className="text-lg mb-1">/5</span>
            </div>
          </div>

          <div className="bg-wellness-green-light/50 border border-wellness-green/10 p-5 rounded-2xl">
            <p className="text-sm font-medium text-wellness-text-sec mb-2">Highest mood day</p>
            <p className="text-xl font-bold text-wellness-green">
              {overview.stats.highestMoodDay ? formatDateLabel(overview.stats.highestMoodDay.entryDate) : 'No data'}
            </p>
            <p className="text-xs font-medium text-wellness-green/70 mt-1">
              {overview.stats.highestMoodDay ? `Mood ${overview.stats.highestMoodDay.moodValue}/5` : 'Log data to unlock'}
            </p>
          </div>

          <div className="bg-wellness-peach-light/30 border border-wellness-peach/10 p-5 rounded-2xl">
            <p className="text-sm font-medium text-wellness-text-sec mb-2">Lowest mood day</p>
            <p className="text-xl font-bold text-wellness-peach">
              {overview.stats.lowestMoodDay ? formatDateLabel(overview.stats.lowestMoodDay.entryDate) : 'No data'}
            </p>
            <p className="text-xs font-medium text-wellness-peach/70 mt-1">
              {overview.stats.lowestMoodDay ? `Mood ${overview.stats.lowestMoodDay.moodValue}/5` : 'Log data to unlock'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-wellness-text flex items-center gap-2 px-1">
            <div className="bg-yellow-100 p-1.5 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            AI Emotion Insights
          </h3>

          {overview.insightCards.length ? (
            overview.insightCards.map((card) => {
              const sentiment = sentimentStyles[card.sentiment] || sentimentStyles.neutral;
              return (
                <div
                  key={card.id}
                  className={`card p-5 bg-gradient-to-r from-white to-wellness-bg border-l-4 ${sentiment.accent}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2 rounded-full shrink-0 mt-0.5 shadow-sm">
                      <Info className="w-4 h-4 text-wellness-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <p className="text-sm font-bold text-wellness-text">{card.title}</p>
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${sentiment.badge}`}>
                          {card.sentiment}
                        </span>
                      </div>
                      <p className="text-sm text-wellness-text-sec leading-relaxed">{card.message}</p>
                      <p className="text-xs text-wellness-text-muted mt-2">{formatDateLabel(card.entryDate)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card p-5 text-sm text-wellness-text-sec">
              Add a reflection note to a mood entry and the AI insight panel will summarize the tone with gentle wellness suggestions.
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className="text-lg font-semibold text-wellness-text">Stored mood logs</h3>
            <p className="text-sm text-wellness-text-muted">{overview.logs.length} total</p>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {overview.logs.length ? (
              overview.logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-wellness-border/60 bg-white p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {moodOptions.find((option) => option.value === log.moodValue)?.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-wellness-text">{formatDateLabel(log.entryDate)}</p>
                          <p className="text-xs text-wellness-text-muted">
                            Mood {log.moodValue}/5, Stress {log.stressLevel}/10, Energy {log.energyLevel}/10
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-wellness-text-sec leading-6">{log.note || 'No reflection added for this entry.'}</p>
                      <p className="text-xs text-wellness-text-muted mt-2">
                        Sentiment: <span className="font-semibold capitalize">{log.sentiment}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 rounded-lg bg-wellness-bg text-wellness-text-sec hover:text-wellness-blue"
                        onClick={() => startEditing(log)}
                        title="Edit log"
                        type="button"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg bg-wellness-bg text-wellness-text-sec hover:text-wellness-peach"
                        onClick={() => handleDelete(log.id)}
                        title="Delete log"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-wellness-border p-6 text-sm text-wellness-text-sec text-center">
                No mood logs have been saved yet.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
