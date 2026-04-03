import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/adminService'
import toast from 'react-hot-toast'
import { AlertCircle, BarChart3, Flag, Trash2, Users, TrendingUp, MessageSquare, UserCheck, Eye } from 'lucide-react'

// ── Mini bar chart component ────────────────────────────────────────────────
function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.questions), 1)
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const h = Math.max((d.questions / max) * 100, d.questions > 0 ? 8 : 2)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
              {d.label}: {d.questions} posts
            </div>
            <div
              className={`w-full rounded-t-sm transition-all duration-500 ${d.questions > 0 ? 'bg-wellness-blue group-hover:bg-blue-400' : 'bg-gray-700'}`}
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
    blue:   { bg: 'bg-wellness-blue/15', border: 'border-wellness-blue/40', icon: 'bg-wellness-blue/30 text-wellness-blue', text: 'text-wellness-blue' },
    green:  { bg: 'bg-green-500/15', border: 'border-green-500/40', icon: 'bg-green-500/30 text-green-400', text: 'text-green-400' },
    amber:  { bg: 'bg-amber-500/15', border: 'border-amber-500/40', icon: 'bg-amber-500/30 text-amber-400', text: 'text-amber-400' },
    red:    { bg: 'bg-red-500/15', border: 'border-red-500/40', icon: 'bg-red-500/30 text-red-400', text: 'text-red-400' },
    purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/40', icon: 'bg-purple-500/30 text-purple-400', text: 'text-purple-400' },
  }
  
  const colorStyle = colors[color]
  
  return (
    <div className={`border rounded-2xl p-6 ${colorStyle.bg} ${colorStyle.border} backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorStyle.icon}`}>
          <IconComponent size={24} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp size={14} />
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-sm text-wellness-text-sec font-medium">{label}</div>
      {sub && <div className="text-xs text-wellness-text-muted mt-2">{sub}</div>}
    </div>
  )
}

// ── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: IconComponent, label, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-gradient-to-r from-wellness-blue to-blue-500 text-white shadow-lg shadow-wellness-blue/30' : 'text-wellness-text-muted hover:text-wellness-text bg-surface-700/50 hover:bg-surface-700'
      }`}>
      <IconComponent size={18} />
      {label}
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center ml-1">
          {badge}
        </span>
      )}
    </button>
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

  useEffect(() => {
    if (tab === 'reports' && !reports.length) loadReports()
    if (tab === 'users' && !users.length) loadUsers()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-wellness-text-sec">Loading admin stats...</div>
      </div>
    )
  }

  const s = stats?.summary || {}
  const pendingReports = s.reportedQuestions || 0

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="mb-8 pt-6">
        <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-3xl p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Welcome, Admin! 👋</h1>
              <p className="text-wellness-text-sec">Your dashboard now reflects live platform activity across all metrics.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 rounded-xl text-sm font-medium transition-all">
                Generate Report
              </button>
              <button className="px-6 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded-xl text-sm font-medium transition-all">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')} icon={BarChart3} label="Overview" />
        <TabBtn active={tab === 'activity'} onClick={() => setTab('activity')} icon={TrendingUp} label="Activity" />
        <TabBtn active={tab === 'reports'} onClick={() => setTab('reports')} icon={Flag} label="Reports" badge={pendingReports} />
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Users" />
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={Users} label="Total Students" value={s.totalUsers || 0} color="blue" sub={`+${s.newUsersWeek || 0} this week`} trend={s.newUsersWeek} />
            <StatCard icon={MessageSquare} label="Total Posts" value={s.totalPosts || 0} color="purple" sub={`${s.postsWeek || 0} this week`} />
            <StatCard icon={UserCheck} label="Total Replies" value={s.totalReplies || 0} color="green" sub="all time" />
            <StatCard icon={Flag} label="Pending Reports" value={s.reportedPosts || 0} color={s.reportedPosts > 0 ? 'red' : 'amber'} sub="need review" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard icon={TrendingUp} label="Posts This Month" value={s.postsMonth || 0} color="purple" />
            <StatCard icon={MessageSquare} label="Engagement Rate" value={`${s.engagementRate || 0}%`} color="amber" sub="posts with replies" />
            <StatCard icon={AlertCircle} label="Platform Health" value={s.engagementRate > 60 ? '✅ Good' : s.engagementRate > 30 ? '⚠️ Fair' : '🔴 Low'} color="blue" />
          </div>

          {/* Category breakdown & Top questions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-surface-800/80 border border-surface-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-5">
                <BarChart3 className="text-wellness-blue" size={18} />Posts by Category
              </h3>
              <div className="space-y-4">
                {(stats?.categoryBreakdown || []).map((cat) => {
                  const max = stats.categoryBreakdown[0]?.count || 1
                  return (
                    <div key={cat._id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-3 py-1 bg-wellness-blue/20 border border-wellness-blue/30 text-wellness-text text-xs font-medium rounded-full capitalize hover:bg-wellness-blue/30 transition-all cursor-pointer">
                          {cat._id}
                        </span>
                        <span className="text-xs text-wellness-text-muted font-semibold">{cat.count} posts</span>
                      </div>
                      <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-wellness-blue to-blue-400 rounded-full transition-all duration-300"
                          style={{ width: `${(cat.count / max) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top questions */}
            <div className="bg-surface-800/80 border border-surface-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-5">
                <TrendingUp className="text-amber-400" size={18} />Top Questions by Replies
              </h3>
              <div className="space-y-3">
                {(stats?.topQuestions || []).map((q, i) => (
                  <div key={q._id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-700/50 border border-surface-600 transition-all hover:bg-surface-700 hover:border-surface-500 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-wellness-blue to-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {q.content?.substring(0, 50) || 'Question'}...
                      </div>
                      <span className="inline-block px-2 py-0.5 bg-wellness-blue/20 border border-wellness-blue/30 text-xs font-medium text-wellness-text rounded capitalize mt-1">
                        {q.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-wellness-blue flex items-center gap-1 flex-shrink-0 bg-wellness-blue/10 px-2 py-1 rounded-lg">
                      <MessageSquare size={14} />{q.replyCount || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent registrations */}
          <div className="bg-surface-800/80 border border-surface-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-5">
              <UserCheck className="text-green-400" size={18} />Recent Registrations
            </h3>
            <div className="space-y-3">
              {(stats?.recentUsers || []).map(u => (
                <div key={u._id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-700/50 border border-surface-600 transition-all hover:bg-surface-700 hover:border-surface-500">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-wellness-blue to-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {u.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{u.fullName}</div>
                    <div className="text-xs text-wellness-text-muted truncate">{u.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {u.faculty && <div className="text-xs text-wellness-text-muted truncate max-w-[120px]">{u.faculty}</div>}
                    <div className="text-xs text-wellness-text-muted">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {u.role === 'admin' && <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ─────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <div className="bg-surface-800/80 border border-surface-700 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
            <BarChart3 className="text-wellness-blue" size={18} />Posts Per Day — Last 14 Days
          </h3>
          <p className="text-xs text-wellness-text-muted mb-5">Hover bars for details</p>
          <BarChart data={stats?.activity || []} />
          <div className="flex justify-between text-xs text-wellness-text-muted mt-4">
            {(stats?.activity || []).filter((_, i) => i % 2 === 0).map(d => (
              <span key={d.date}>{d.label}</span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-surface-600">
            {[
              { label: 'Total this period', value: (stats?.activity || []).reduce((s, d) => s + d.questions, 0) },
              { label: 'Daily average', value: Math.round((stats?.activity || []).reduce((s, d) => s + d.questions, 0) / 14) },
              { label: 'Peak day', value: Math.max(...(stats?.activity || [{ questions: 0 }]).map(d => d.questions)) },
            ].map(c => (
              <div key={c.label} className="bg-surface-700/50 border border-surface-600 rounded-lg p-4 text-center hover:bg-surface-700 transition-all">
                <div className="text-xl font-bold text-white">{c.value}</div>
                <div className="text-xs text-wellness-text-muted mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ─────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-wellness-text-sec">
              {reportsLoading ? 'Loading...' : `${reports.length} reported ${reports.length === 1 ? 'post' : 'posts'} pending review`}
            </p>
            <button onClick={loadReports} className="text-xs px-3 py-2 rounded-lg text-wellness-blue border border-wellness-blue/30 hover:bg-wellness-blue/10 transition">
              Refresh
            </button>
          </div>

          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-wellness-text-sec">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-surface-800/80 border border-surface-700 rounded-2xl text-center py-12 backdrop-blur-sm">
              <AlertCircle className="text-green-400 mx-auto mb-3" size={48} />
              <div className="font-bold text-white mb-1">All Clear!</div>
              <p className="text-wellness-text-muted text-sm">No pending reports to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <div key={r._id} className="bg-surface-800/80 border-l-4 border-l-red-500 border border-surface-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm mb-2">
                        {r.content?.substring(0, 100) || 'Post'}...
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block px-3 py-1 bg-wellness-blue/20 border border-wellness-blue/30 text-wellness-text text-xs font-medium rounded-full capitalize hover:bg-wellness-blue/30 transition-all cursor-pointer">
                          {r.category}
                        </span>
                        <span className="badge bg-red-500/15 text-red-400 border border-red-500/40 px-3 py-1">
                          {r.reportCount} {r.reportCount === 1 ? 'report' : 'reports'}
                        </span>
                        <span className="text-xs text-wellness-text-muted">
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(r.reports || []).map((rep, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
                        <span className="font-semibold text-red-300 capitalize">{rep.reason}</span>
                        {rep.details && <p className="text-wellness-text-muted mt-1 text-xs">{rep.details}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button disabled className="text-xs px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-wellness-text cursor-not-allowed opacity-50 flex items-center gap-1 hover:bg-surface-700 transition-all">
                      <Eye size={14} />View Post
                    </button>
                    <button onClick={() => handleResolve(r._id)} disabled={resolvingId === r._id} className="text-xs px-3 py-2 text-green-400 border border-green-500/40 bg-green-500/15 hover:bg-green-500/25 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1">
                      {resolvingId === r._id ? '...' : '✓'}Mark Resolved
                    </button>
                    <button onClick={() => handleDelete(r._id)} disabled={deletingId === r._id} className="text-xs px-3 py-2 text-red-400 border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1">
                      <Trash2 size={14} />{deletingId === r._id ? 'Deleting...' : 'Delete Post'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-wellness-text-sec">
              {usersLoading ? 'Loading...' : `${users.length} registered users`}
            </p>
            <button onClick={loadUsers} className="text-xs px-3 py-2 rounded-lg text-wellness-blue border border-wellness-blue/30 hover:bg-wellness-blue/10 transition">
              Refresh
            </button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-wellness-text-sec">Loading users...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u._id} className={`bg-surface-800/80 border border-surface-700 rounded-xl py-4 px-4 flex items-center gap-4 flex-wrap transition-all hover:bg-surface-800 hover:shadow-lg ${!u.isActive ? 'opacity-50' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-wellness-blue to-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {u.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{u.fullName}</span>
                      {u.role === 'admin' && <span className="badge bg-red-500/15 text-red-400 border border-red-500/40 text-xs px-2 py-0.5 rounded">Admin</span>}
                      {!u.isActive && <span className="badge bg-gray-500/15 text-wellness-text-muted border border-gray-500/40 text-xs px-2 py-0.5 rounded">Deactivated</span>}
                    </div>
                    <div className="text-xs text-wellness-text-muted">{u.email}</div>
                    {u.faculty && <div className="text-xs text-wellness-text-muted/80">{u.faculty}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-wellness-text-muted">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleToggleUser(u._id)} disabled={togglingId === u._id}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                        u.isActive
                          ? 'text-red-400 border-red-500/40 bg-red-500/15 hover:bg-red-500/25'
                          : 'text-green-400 border-green-500/40 bg-green-500/15 hover:bg-green-500/25'
                      } disabled:opacity-50 flex items-center gap-1`}>
                      {togglingId === u._id ? '...' : (u.isActive ? 'Deactivate' : 'Activate')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
