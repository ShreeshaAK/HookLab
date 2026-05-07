import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const BASE = 'http://127.0.0.1:8000'
const STATUS_OPTIONS = ['DRAFT', 'SCRIPTING', 'READY', 'PUBLISHED']
const STATUS_COLORS = {
  DRAFT:      'bg-slate-100 text-slate-600',
  SCRIPTING:  'bg-yellow-100 text-yellow-700',
  READY:      'bg-green-100 text-green-700',
  PUBLISHED:  'bg-blue-100 text-blue-700',
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg border
            ${t.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [token, setToken]               = useState(localStorage.getItem('access_token'))
  const [dashboardData, setDashboard]   = useState(null)
  const [selectedVideo, setSelected]    = useState(null)
  const [view, setView]                 = useState('pipeline')
  const [toasts, setToasts]             = useState([])

  // ── Auth form states ──
  const [authMode, setAuthMode]         = useState('login')  // 'login' | 'signup'
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [authErr, setAuthErr]           = useState('')
  const [authLoading, setAuthLoading]   = useState(false)
  const [successMsg, setSuccessMsg]     = useState('')

  // ── Pipeline form states ──
  const [newVideoTitle, setNewTitle]    = useState('')
  const [newHookText, setNewHookText]   = useState('')
  const [newHookScore, setNewHookScore] = useState(50)
  const [viewInputs, setViewInputs]     = useState({})

  const headers = { Authorization: `Bearer ${token}` }

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const addToast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  // ─── Fetchers ─────────────────────────────────────────────────────────────
  const fetchPipeline = () => {
    axios.get(`${BASE}/api/dashboard/`, { headers })
      .then(res => setDashboard(res.data))
      .catch(() => handleLogout())
  }

  const fetchVideoDetail = (id) => {
    axios.get(`${BASE}/api/video/${id}/performance/`, { headers })
      .then(res => {
        setSelected({ ...res.data, id })
        const inputs = {}
        res.data.hook_ids.forEach((hid, i) => { inputs[hid] = res.data.views[i] })
        setViewInputs(inputs)
        setView('detail')
      })
      .catch(() => addToast('Failed to load video detail', 'error'))
  }

  useEffect(() => { if (token) fetchPipeline() }, [token])

  // ─── Switch between login / signup ────────────────────────────────────────
  const switchMode = (mode) => {
    setAuthMode(mode)
    setAuthErr('')
    setSuccessMsg('')
    setUsername('')
    setPassword('')
    setConfirm('')
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault()
    setAuthErr('')
    if (!username.trim() || !password) { setAuthErr('Please fill in all fields.'); return }
    setAuthLoading(true)
    axios.post(`${BASE}/api/token/`, { username, password })
      .then(res => {
        localStorage.setItem('access_token', res.data.access)
        setToken(res.data.access)
      })
      .catch(() => setAuthErr('Invalid username or password.'))
      .finally(() => setAuthLoading(false))
  }

  // ─── SIGNUP ───────────────────────────────────────────────────────────────
  const handleSignup = (e) => {
    e.preventDefault()
    setAuthErr('')
    setSuccessMsg('')
    if (!username.trim() || !password || !confirmPassword) {
      setAuthErr('Please fill in all fields.'); return
    }
    if (password.length < 6) {
      setAuthErr('Password must be at least 6 characters.'); return
    }
    if (password !== confirmPassword) {
      setAuthErr('Passwords do not match.'); return
    }
    setAuthLoading(true)
    axios.post(`${BASE}/api/signup/`, { username, password })
      .then(() => {
        setSuccessMsg('Account created! Redirecting to login...')
        setTimeout(() => switchMode('login'), 1500)
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Signup failed. Try again.'
        setAuthErr(msg)
      })
      .finally(() => setAuthLoading(false))
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setToken(null); setDashboard(null); setSelected(null); setView('pipeline')
  }

  // ─── VIDEO ACTIONS ────────────────────────────────────────────────────────
  const handleAddVideo = (e) => {
    e.preventDefault()
    if (!newVideoTitle.trim()) return
    axios.post(`${BASE}/api/dashboard/`, { title: newVideoTitle }, { headers })
      .then(() => { setNewTitle(''); fetchPipeline(); addToast('Video idea added!') })
      .catch(() => addToast('Failed to add video', 'error'))
  }

  const handleStatusChange = (e, videoId) => {
    e.stopPropagation()
    const newStatus = e.target.value
    axios.patch(`${BASE}/api/video/${videoId}/manage/`, { status: newStatus }, { headers })
      .then(() => {
        setDashboard(prev => ({
          ...prev,
          pipeline: prev.pipeline.map(v => v.id === videoId ? { ...v, status: newStatus } : v)
        }))
        addToast(`Status updated to ${newStatus}`)
      })
      .catch(() => addToast('Failed to update status', 'error'))
  }

  const handleDeleteVideo = (e, videoId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this video and all its hooks? This cannot be undone.')) return
    axios.delete(`${BASE}/api/video/${videoId}/manage/`, { headers })
      .then(() => {
        setDashboard(prev => ({
          ...prev,
          analytics: { ...prev.analytics, total_videos: prev.analytics.total_videos - 1 },
          pipeline: prev.pipeline.filter(v => v.id !== videoId)
        }))
        addToast('Video deleted')
      })
      .catch(() => addToast('Failed to delete video', 'error'))
  }

  // ─── HOOK ACTIONS ─────────────────────────────────────────────────────────
  const handleAddHook = (e) => {
    e.preventDefault()
    if (!newHookText.trim()) return
    axios.post(`${BASE}/api/video/${selectedVideo.id}/add-hook/`,
      { hook_text: newHookText, predicted_score: newHookScore }, { headers })
      .then(() => {
        setNewHookText(''); setNewHookScore(50)
        fetchVideoDetail(selectedVideo.id); fetchPipeline()
        addToast('Hook added!')
      })
      .catch(() => addToast('Failed to add hook', 'error'))
  }

  const handleUpdateViews = (hookId) => {
    const views = viewInputs[hookId]
    if (views === undefined || views === '') return
    axios.patch(`${BASE}/api/hook/${hookId}/manage/`, { actual_views: views }, { headers })
      .then(() => {
        setSelected(prev => {
          const idx = prev.hook_ids.indexOf(hookId)
          const newViews = [...prev.views]
          newViews[idx] = Number(views)
          return { ...prev, views: newViews }
        })
        addToast('Views updated!')
      })
      .catch(() => addToast('Failed to update views', 'error'))
  }

  const handleDeleteHook = (hookId) => {
    if (!window.confirm('Delete this hook variant?')) return
    axios.delete(`${BASE}/api/hook/${hookId}/manage/`, { headers })
      .then(() => {
        setSelected(prev => {
          const idx = prev.hook_ids.indexOf(hookId)
          return {
            ...prev,
            hook_ids: prev.hook_ids.filter((_, i) => i !== idx),
            labels:   prev.labels.filter((_, i) => i !== idx),
            views:    prev.views.filter((_, i) => i !== idx),
            scores:   prev.scores.filter((_, i) => i !== idx),
          }
        })
        setViewInputs(prev => { const n = { ...prev }; delete n[hookId]; return n })
        fetchPipeline()
        addToast('Hook deleted')
      })
      .catch(() => addToast('Failed to delete hook', 'error'))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (!token) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Tab switcher */}
        <div className="flex border-b">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-4 text-sm font-bold transition
              ${authMode === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 hover:text-slate-600'}`}
          >
            Log In
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-4 text-sm font-bold transition
              ${authMode === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 hover:text-slate-600'}`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900">HookLab</h1>
            <p className="text-slate-400 text-sm mt-1">
              {authMode === 'login' ? 'Welcome back to your studio' : 'Create your creator account'}
            </p>
          </div>

          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                <input type="text" placeholder="your_username" value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="border-2 p-3 rounded-lg outline-none focus:border-blue-500 transition text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="border-2 p-3 rounded-lg outline-none focus:border-blue-500 transition text-sm" />
              </div>
              {authErr && (
                <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{authErr}</p>
              )}
              <button disabled={authLoading}
                className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-2">
                {authLoading ? 'Signing in...' : 'Enter Studio →'}
              </button>
              <p className="text-center text-sm text-slate-400">
                No account?{' '}
                <button type="button" onClick={() => switchMode('signup')}
                  className="text-blue-600 font-semibold hover:underline">
                  Sign up free
                </button>
              </p>
            </form>
          )}

          {/* SIGNUP FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                <input type="text" placeholder="choose_a_username" value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="border-2 p-3 rounded-lg outline-none focus:border-blue-500 transition text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                <input type="password" placeholder="min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="border-2 p-3 rounded-lg outline-none focus:border-blue-500 transition text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                <input type="password" placeholder="repeat your password" value={confirmPassword}
                  onChange={e => setConfirm(e.target.value)}
                  className="border-2 p-3 rounded-lg outline-none focus:border-blue-500 transition text-sm" />
              </div>
              {authErr && (
                <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{authErr}</p>
              )}
              {successMsg && (
                <p className="text-green-600 text-sm text-center bg-green-50 py-2 rounded-lg font-medium">{successMsg}</p>
              )}
              <button disabled={authLoading}
                className="bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 mt-2">
                {authLoading ? 'Creating account...' : 'Create Account →'}
              </button>
              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')}
                  className="text-blue-600 font-semibold hover:underline">
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  if (!dashboardData) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 font-medium animate-pulse">Loading Studio...</p>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN APP
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Toast toasts={toasts} />

      {/* HEADER */}
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HookLab</h1>
          {view === 'detail' && (
            <button onClick={() => { setView('pipeline'); setSelected(null) }}
              className="text-sm text-slate-500 hover:text-slate-800 transition">
              ← Pipeline
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            @<span className="font-semibold text-slate-700">{dashboardData.creator}</span>
          </span>
          <button onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-600 font-medium transition">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">

        {/* ════════════ PIPELINE VIEW ════════════ */}
        {view === 'pipeline' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl border border-b-4 border-b-blue-500">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Views Tracked</p>
                <p className="text-4xl font-black">{dashboardData.analytics.total_views.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-b-4 border-b-emerald-400">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Videos in Pipeline</p>
                <p className="text-4xl font-black text-emerald-600">{dashboardData.analytics.total_videos}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-b-4 border-b-purple-400">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Hooks Tested</p>
                <p className="text-4xl font-black text-purple-600">{dashboardData.analytics.total_hooks_tested}</p>
              </div>
            </div>

            <form onSubmit={handleAddVideo} className="flex gap-3 mb-6">
              <input value={newVideoTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="New video idea title..."
                className="flex-1 border-2 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <button className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-slate-700 transition text-sm whitespace-nowrap">
                + Add Idea
              </button>
            </form>

            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase border-b">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Hooks</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboardData.pipeline.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">
                      No videos yet. Add your first idea above.
                    </td></tr>
                  )}
                  {dashboardData.pipeline.map(v => (
                    <tr key={v.id} className="hover:bg-blue-50/40 transition cursor-pointer"
                      onClick={() => fetchVideoDetail(v.id)}>
                      <td className="px-5 py-4 font-semibold text-slate-800 max-w-xs truncate">{v.title}</td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <select value={v.status} onChange={e => handleStatusChange(e, v.id)}
                          className={`text-xs font-bold px-2 py-1 rounded-md border-0 outline-none cursor-pointer ${STATUS_COLORS[v.status]}`}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-sm">
                        {v.hook_count} variant{v.hook_count !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => fetchVideoDetail(v.id)}
                            className="text-blue-600 font-bold text-sm hover:underline">Open Lab →</button>
                          <button onClick={e => handleDeleteVideo(e, v.id)}
                            className="text-red-400 hover:text-red-600 font-bold text-lg leading-none transition"
                            title="Delete video">×</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ════════════ DETAIL VIEW ════════════ */}
        {view === 'detail' && selectedVideo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-5">

              <div className="bg-white p-5 rounded-xl border">
                <h2 className="font-black text-slate-900 text-lg leading-tight mb-3">{selectedVideo.video_title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">Status</span>
                  <select
                    value={dashboardData.pipeline.find(v => v.id === selectedVideo.id)?.status || 'DRAFT'}
                    onChange={e => handleStatusChange(e, selectedVideo.id)}
                    className={`text-xs font-bold px-2 py-1 rounded-md border-0 outline-none cursor-pointer
                      ${STATUS_COLORS[dashboardData.pipeline.find(v => v.id === selectedVideo.id)?.status || 'DRAFT']}`}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border">
                <h2 className="text-base font-black mb-4 uppercase tracking-tight">Add New Hook</h2>
                <form onSubmit={handleAddHook} className="space-y-3">
                  <textarea value={newHookText} onChange={e => setNewHookText(e.target.value)}
                    placeholder="Enter your hook script..."
                    className="w-full border rounded-lg p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-blue-400 resize-none" required />
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase">Predicted Score</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="0" max="100" value={newHookScore}
                        onChange={e => setNewHookScore(Number(e.target.value))} className="w-24" />
                      <span className="text-xs font-black text-blue-600 w-8 text-right">{newHookScore}</span>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition text-sm">
                    Save to A/B Test
                  </button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-xl border">
                <h2 className="text-base font-black mb-4 uppercase tracking-tight">
                  Hook Variants
                  <span className="ml-2 text-slate-400 font-normal text-sm normal-case">
                    ({selectedVideo.hook_ids.length})
                  </span>
                </h2>
                {selectedVideo.hook_ids.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No hooks yet.</p>
                )}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {selectedVideo.hook_ids.map((hookId, idx) => (
                    <div key={hookId} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2 leading-snug">{selectedVideo.labels[idx]}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Score: {selectedVideo.scores[idx]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" value={viewInputs[hookId] ?? 0}
                          onChange={e => setViewInputs(prev => ({ ...prev, [hookId]: e.target.value }))}
                          className="border rounded-md p-1.5 text-xs w-full outline-none focus:ring-1 focus:ring-emerald-400" />
                        <button onClick={() => handleUpdateViews(hookId)}
                          className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-md hover:bg-emerald-600 transition whitespace-nowrap uppercase">
                          Save
                        </button>
                        <button onClick={() => handleDeleteHook(hookId)}
                          className="text-red-400 hover:text-red-600 font-bold text-lg leading-none transition flex-shrink-0"
                          title="Delete hook">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-xl border h-full min-h-[500px]">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Performance Matrix</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase mt-1">
                    Actual views vs predicted score per hook variant
                  </p>
                </div>
                {selectedVideo.hook_ids.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-slate-300 text-sm">
                    Add hooks to see the chart
                  </div>
                ) : (
                  <div className="h-[400px]">
                    <Bar
                      data={{
                        labels: selectedVideo.labels,
                        datasets: [
                          { label: 'Actual Views',
                            data: selectedVideo.hook_ids.map(hid => Number(viewInputs[hid] ?? 0)),
                            backgroundColor: '#3b82f6', borderRadius: 6 },
                          { label: 'Predicted Score (×100)',
                            data: selectedVideo.scores.map(s => s * 100),
                            backgroundColor: '#10b981', borderRadius: 6 },
                        ],
                      }}
                      options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: { y: { beginAtZero: true } },
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}