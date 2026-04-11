import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI } from '../lib/adminService'
import toast from 'react-hot-toast'
import { AlertCircle, BarChart3, Flag, Trash2, Users, TrendingUp, MessageSquare, UserCheck, Eye, BookOpen, Check, X } from 'lucide-react'

// ── Mini bar chart component ────────────────────────────────────────────────
function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.questions), 1)
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const h = Math.max((d.questions / max) * 100, d.questions > 0 ? 8 : 2)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
              {d.label}: {d.questions} posts
            </div>
            <div
              className={`w-full rounded-t-sm transition-all duration-500 ${d.questions > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-200'}`}
              style={{ height: `${h}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: IconComponent, label, value, sub, color = 'blue', trend }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-600',
    green:  'bg-green-50 border-green-200 text-green-600',
    amber:  'bg-amber-50 border-amber-200 text-amber-600',
    red:    'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`border rounded-3xl p-6 bg-white shadow-sm hover:shadow-lg transition-all ${colors[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <IconComponent size={20} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp size={14} />
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </motion.div>
  )
}

// ── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: IconComponent, label, badge }) {
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
      }`}>
      <IconComponent size={18} />
      {label}
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </motion.button>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [resolvingId, setResolvingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load admin stats'))
      .finally(() => setLoading(false))
  }, [])

  const loadReports = async () => {
    setReportsLoading(true)
    try { 
      const r = await adminAPI.getReports()
      setReports(r.data) 
    }
    catch { 
      toast.error('Failed to load reports') 
    } 
    finally { 
      setReportsLoading(false) 
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try { 
      const r = await adminAPI.getUsers()
      setUsers(r.data) 
    }
    catch { 
      toast.error('Failed to load users') 
    } 
    finally { 
      setUsersLoading(false) 
    }
  }

  const loadResources = async () => {
    setResourcesLoading(true)
    try {
      const r = await adminAPI.getPendingResources()
      setResources(r.data)
    } catch {
      toast.error('Failed to load pending resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'reports' && !reports.length) loadReports()
    if (tab === 'users' && !users.length) loadUsers()
    if (tab === 'resources' && !resources.length) loadResources()
  }, [tab])

  const handleResolve = async (postId) => {
    setResolvingId(postId)
    try { 
      await adminAPI.resolveReport(postId)
      setReports(p => p.filter(r => r._id !== postId))
      toast.success('Reports resolved') 
    }
    catch { 
      toast.error('Failed to resolve reports') 
    } 
    finally { 
      setResolvingId(null) 
    }
  }

  const handleDelete = async (postId) => {
    if (!confirm('Permanently remove this post?')) return
    setDeletingId(postId)
    try { 
      await adminAPI.deletePost(postId)
      setReports(p => p.filter(r => r._id !== postId))
      toast.success('Post removed') 
    }
    catch { 
      toast.error('Failed to delete post') 
    } 
    finally { 
      setDeletingId(null) 
    }
  }

  const handleToggleUser = async (userId) => {
    setTogglingId(userId)
    try {
      const r = await adminAPI.toggleUser(userId)
      setUsers(p => p.map(u => u._id === userId ? { ...u, isActive: r.isActive } : u))
      toast.success(r.message)
    } 
    catch { 
      toast.error('Failed to toggle user') 
    } 
    finally { 
      setTogglingId(null) 
    }
  }

  const handleApproveResource = async (id) => {
    setApprovingId(id)
    try {
      const r = await adminAPI.approveResource(id)
      setResources(p => p.filter(res => res._id !== id))
      toast.success(r.message)
      // Update global stats
      setStats(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          pendingResources: Math.max(0, prev.summary.pendingResources - 1)
        }
      }))
    } catch {
      toast.error('Failed to approve resource')
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectResource = async (id) => {
    setRejectingId(id)
    try {
      const r = await adminAPI.rejectResource(id)
      setResources(p => p.filter(res => res._id !== id))
      toast.success(r.message)
      // Update global stats
      setStats(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          pendingResources: Math.max(0, prev.summary.pendingResources - 1)
        }
      }))
    } catch {
      toast.error('Failed to reject resource')
    } finally {
      setRejectingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF8F3]">
        <div className="text-slate-600">Loading admin stats...</div>
      </div>
    )
  }

  const s = stats?.summary || {}
  const pendingReports = s.reportedPosts || 0
  const pendingResources = s.pendingResources || 0

  return (
    <div className="min-h-screen p-8 bg-[#FBF8F3]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12 pt-2"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-600 mt-1">Platform overview, moderation, and user management</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider">
            Admin Only
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-10 overflow-x-auto pb-2 flex-wrap"
        >
          <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')} icon={BarChart3} label="Overview" />
          <TabBtn active={tab === 'activity'} onClick={() => setTab('activity')} icon={TrendingUp} label="Activity" />
          <TabBtn active={tab === 'reports'} onClick={() => setTab('reports')} icon={Flag} label="Reports" badge={pendingReports} />
          <TabBtn active={tab === 'resources'} onClick={() => setTab('resources')} icon={BookOpen} label="Resources" badge={pendingResources} />
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Users" />
        </motion.div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Total Students" value={s.totalUsers || 0} color="blue" sub={`+${s.newUsersWeek || 0} this week`} trend={s.newUsersWeek} />
            <StatCard icon={MessageSquare} label="Total Posts" value={s.totalPosts || 0} color="purple" sub={`${s.postsWeek || 0} this week`} />
            <StatCard icon={UserCheck} label="Total Replies" value={s.totalReplies || 0} color="green" sub="all time" />
            <StatCard icon={BookOpen} label="Pending Resources" value={s.pendingResources || 0} color={s.pendingResources > 0 ? 'amber' : 'green'} sub="need review" />
            <StatCard icon={Flag} label="Pending Reports" value={s.reportedPosts || 0} color={s.reportedPosts > 0 ? 'red' : 'amber'} sub="need review" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} label="Posts This Month" value={s.postsMonth || 0} color="purple" />
            <StatCard icon={MessageSquare} label="Engagement Rate" value={`${s.engagementRate || 0}%`} color="amber" sub="posts with replies" />
            <StatCard icon={AlertCircle} label="Platform Health" value={s.engagementRate > 60 ? '✅ Good' : s.engagementRate > 30 ? '⚠️ Fair' : '🔴 Low'} color="blue" />
          </div>

          {/* Category breakdown & Top questions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all"
            >
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-6">
                <BarChart3 className="text-emerald-600" size={20} />Posts by Category
              </h3>
              <div className="space-y-4">
                {(stats?.categoryBreakdown || []).map((cat) => {
                  const max = stats.categoryBreakdown[0]?.count || 1
                  return (
                    <div key={cat._id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full capitalize">
                          {cat._id}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">{cat.count} posts</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(cat.count / max) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Top questions */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all"
            >
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-6">
                <TrendingUp className="text-amber-600" size={20} />Top Questions by Replies
              </h3>
              <div className="space-y-3">
                {(stats?.topQuestions || []).map((q, i) => (
                  <div key={q._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 transition-all hover:bg-slate-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {q.content?.substring(0, 50) || 'Question'}...
                      </div>
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-xs font-medium text-emerald-700 rounded capitalize mt-1">
                        {q.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 flex-shrink-0">
                      <MessageSquare size={14} />{q.replyCount || 0}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent registrations */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all"
          >
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-6">
              <UserCheck className="text-green-600" size={20} />Recent Registrations
            </h3>
            <div className="space-y-3">
              {(stats?.recentUsers || []).map(u => (
                <motion.div 
                  key={u._id} 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {u.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{u.fullName}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {u.faculty && <div className="text-xs text-slate-500 truncate max-w-[120px]">{u.faculty}</div>}
                    <div className="text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {u.role === 'admin' && <span className="px-3 py-1 bg-red-100 text-red-600 border border-red-200 rounded text-xs font-bold">Admin</span>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── ACTIVITY TAB ─────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all"
        >
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-2">
            <BarChart3 className="text-emerald-600" size={20} />Posts Per Day — Last 14 Days
          </h3>
          <p className="text-sm text-slate-500 mb-6">Hover bars for details</p>
          <BarChart data={stats?.activity || []} />
          <div className="flex justify-between text-xs text-slate-500 mt-5">
            {(stats?.activity || []).filter((_, i) => i % 2 === 0).map(d => (
              <span key={d.date}>{d.label}</span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
            {[
              { label: 'Total this period', value: (stats?.activity || []).reduce((s, d) => s + d.questions, 0) },
              { label: 'Daily average', value: Math.round((stats?.activity || []).reduce((s, d) => s + d.questions, 0) / 14) },
              { label: 'Peak day', value: Math.max(...(stats?.activity || [{ questions: 0 }]).map(d => d.questions)) },
            ].map(c => (
              <motion.div 
                key={c.label} 
                whileHover={{ y: -2 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center hover:shadow-md transition-all"
              >
                <div className="text-2xl font-bold text-slate-900">{c.value}</div>
                <div className="text-xs text-slate-500 mt-2">{c.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── REPORTS TAB ─────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-600 font-medium">
              {reportsLoading ? 'Loading...' : `${reports.length} reported ${reports.length === 1 ? 'post' : 'posts'} pending review`}
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadReports} 
              className="text-xs px-4 py-2 rounded-xl text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition font-medium"
            >
              Refresh
            </motion.button>
          </div>

          {reportsLoading ? (
            <div className="flex justify-center py-16">
              <div className="text-slate-600">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-3xl text-center py-16 shadow-sm"
            >
              <AlertCircle className="text-green-600 mx-auto mb-4" size={56} />
              <div className="font-bold text-slate-900 mb-2 text-xl">All Clear!</div>
              <p className="text-slate-500">No pending reports to review</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {reports.map((r, idx) => (
                <motion.div 
                  key={r._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border-l-4 border-l-red-500 border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm mb-3">
                        {r.content?.substring(0, 100) || 'Post'}...
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full capitalize">
                          {r.category}
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-full">
                          {r.reportCount} {r.reportCount === 1 ? 'report' : 'reports'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {(r.reports || []).map((rep, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                        <span className="font-semibold text-red-600 capitalize">{rep.reason}</span>
                        {rep.details && <p className="text-slate-600 mt-1 text-xs">{rep.details}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button disabled className="text-xs px-3 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed opacity-50 flex items-center gap-1 font-medium">
                      <Eye size={14} />View Post
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleResolve(r._id)} 
                      disabled={resolvingId === r._id} 
                      className="text-xs px-3 py-2 text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg transition disabled:opacity-50 flex items-center gap-1 font-medium"
                    >
                      {resolvingId === r._id ? '...' : '✓'} Mark Resolved
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDelete(r._id)} 
                      disabled={deletingId === r._id} 
                      className="text-xs px-3 py-2 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50 flex items-center gap-1 font-medium"
                    >
                      <Trash2 size={14} />{deletingId === r._id ? 'Deleting...' : 'Delete Post'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-600 font-medium">
              {usersLoading ? 'Loading...' : `${users.length} registered users`}
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadUsers} 
              className="text-xs px-4 py-2 rounded-xl text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition font-medium"
            >
              Refresh
            </motion.button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-16">
              <div className="text-slate-600">Loading users...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u, idx) => (
                <motion.div 
                  key={u._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`bg-white border border-slate-100 rounded-xl py-4 px-5 flex items-center gap-4 flex-wrap transition-all shadow-sm hover:shadow-md ${!u.isActive ? 'opacity-60 bg-slate-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {u.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{u.fullName}</span>
                      {u.role === 'admin' && <span className="px-2 py-0.5 bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded">Admin</span>}
                      {!u.isActive && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 border border-slate-300 text-xs font-bold rounded">Deactivated</span>}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                    {u.faculty && <div className="text-xs text-slate-500">{u.faculty}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {u.role !== 'admin' && (
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleUser(u._id)} 
                      disabled={togglingId === u._id}
                      className={`text-xs px-3 py-2 rounded-lg border transition-all flex-shrink-0 font-medium ${
                        u.isActive
                          ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                          : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
                      } disabled:opacity-50 flex items-center gap-1`}
                    >
                      {togglingId === u._id ? '...' : (u.isActive ? 'Deactivate' : 'Activate')}
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── RESOURCES TAB ─────────────────────────────────────────────── */}
      {tab === 'resources' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">
              {resourcesLoading ? 'Loading...' : `${resources.length} resources pending approval`}
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadResources} 
              className="text-xs px-4 py-2 rounded-xl text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition font-medium"
            >
              Refresh
            </motion.button>
          </div>

          {resourcesLoading ? (
            <div className="flex justify-center py-16">
              <div className="text-slate-600">Loading pending resources...</div>
            </div>
          ) : resources.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-3xl text-center py-16 shadow-sm"
            >
              <BookOpen className="text-green-600 mx-auto mb-4" size={56} />
              <div className="font-bold text-slate-900 mb-2 text-xl">Queue Empty</div>
              <p className="text-slate-500">No materials awaiting approval</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resources.map((res, idx) => (
                <motion.div 
                  key={res._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{res.subject || res.originalFileName}</h4>
                          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{res.resourceType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">{res.faculty}</span>
                        <p className="text-[11px] text-slate-500 mt-1.5">{res.year} • {res.semester}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-5 line-clamp-2 italic">
                      "{res.description || 'No description provided'}"
                    </p>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-5 border border-slate-200">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">
                        {res.user?.fullName?.charAt(0) || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{res.user?.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{res.user?.studentId}</p>
                      </div>
                      <div className="text-[11px] text-slate-500 text-right flex-shrink-0">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApproveResource(res._id)}
                        disabled={approvingId === res._id || rejectingId === res._id}
                        className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-all font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {approvingId === res._id ? <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <Check size={15} />}
                        Approve
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRejectResource(res._id)}
                        disabled={approvingId === res._id || rejectingId === res._id}
                        className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {rejectingId === res._id ? <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <X size={15} />}
                        Reject
                      </motion.button>
                      <motion.a 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={`http://localhost:5000${res.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all"
                        title="Preview File"
                      >
                        <Eye size={17} />
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      </div>
    </div>
  )
}
