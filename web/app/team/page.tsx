'use client'
import { useCallback, useEffect, useState } from 'react'

type Staff = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  consultTypeIds: string[]
  weeklyHours: { day: number; start: string; end: string }[]
  leave: { from: string; to: string }[]
  password?: string
  phone?: string
}

type ConsultType = {
  id: string
  title: string
  durationMins: number
  priceINR: number
  bufferMins: number
}

type Booking = {
  id: string
  typeId: string
  staffId: string
  startAt: string
  endAt: string
  status: string
  parentName: string
  email: string
  phone: string
  childName: string
  childAge: string
  concern: string
  createdAt?: string
}

type AuthUser = {
  id: string
  name: string
  role: string
  email: string
  isAdmin: boolean
  token: string
}

const DAYS: [number, string, string][] = [
  [1, 'Monday', 'Mon'],
  [2, 'Tuesday', 'Tue'],
  [3, 'Wednesday', 'Wed'],
  [4, 'Thursday', 'Thu'],
  [5, 'Friday', 'Fri'],
  [6, 'Saturday', 'Sat'],
  [0, 'Sunday', 'Sun'],
]

const STAFF_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'dr-manasi': { bg: '#eef6ff', border: '#7bb2ff', text: '#1e40af', badge: '#3b82f6' },
  'ananya-sridhar': { bg: '#fff7ed', border: '#f97316', text: '#9a3412', badge: '#ea580c' },
  'dr-radhika': { bg: '#ecfdf5', border: '#05b076', text: '#065f46', badge: '#10b981' },
  'kavitha-s': { bg: '#fefce8', border: '#eab308', text: '#854d0e', badge: '#ca8a04' },
  'arun-kumar': { bg: '#fdf4ff', border: '#c084fc', text: '#6b21a8', badge: '#a855f7' },
}

const DEFAULT_COLOR = { bg: '#f3f4f6', border: '#9ca3af', text: '#374151', badge: '#6b7280' }

const parts = (iso: string) => {
  const d = new Date(Date.parse(iso) + 19800000)
  return {
    date: d.toISOString().slice(0, 10),
    mins: d.getUTCHours() * 60 + d.getUTCMinutes(),
  }
}

const addDays = (d: string, n: number) =>
  new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10)

const labelDate = (d: string) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

const hmTime = (iso: string) =>
  new Date(Date.parse(iso) + 19800000).toISOString().slice(11, 16)

export default function TeamPortal() {
  // Session & Auth
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loginMode, setLoginMode] = useState<'specialist' | 'admin'>('specialist')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ananya-sridhar')
  const [loginPassword, setLoginPassword] = useState<string>('ananya123')
  const [loginError, setLoginError] = useState<string>('')
  const [loginLoading, setLoginLoading] = useState<boolean>(false)

  // Data & Workspace
  const [data, setData] = useState<{ staff: Staff[]; types: ConsultType[]; bookings: Booking[] } | null>(null)
  const [activeStaffId, setActiveStaffId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'availability' | 'calendar' | 'leaves' | 'quick-book' | 'admin-members'>('availability')

  // Calendar navigation
  const [week, setWeek] = useState('')
  const [today, setToday] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Availability editing state for active staff
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [availSaving, setAvailSaving] = useState(false)
  const [availMsg, setAvailMsg] = useState('')

  // Live Consult Preview Date
  const [previewDate, setPreviewDate] = useState('')

  // New leave state
  const [newLeave, setNewLeave] = useState({ from: '', to: '' })
  const [leaveMsg, setLeaveMsg] = useState('')

  // Manual booking form state
  const [mbStaffId, setMbStaffId] = useState('')
  const [mbTypeId, setMbTypeId] = useState('')
  const [mbDate, setMbDate] = useState('')
  const [mbTime, setMbTime] = useState('10:00')
  const [mbParentName, setMbParentName] = useState('')
  const [mbEmail, setMbEmail] = useState('')
  const [mbPhone, setMbPhone] = useState('')
  const [mbChildName, setMbChildName] = useState('')
  const [mbChildAge, setMbChildAge] = useState('')
  const [mbConcern, setMbConcern] = useState('')
  const [mbSaving, setMbSaving] = useState(false)
  const [mbMsg, setMbMsg] = useState('')

  // Admin: Add new member modal & state
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberTypes, setNewMemberTypes] = useState<string[]>(['free-counselling', 'expert-consultation'])
  const [addMemberSaving, setAddMemberSaving] = useState(false)
  const [addMemberMsg, setAddMemberMsg] = useState('')

  // Fetch full team data with given key/token
  const loadData = useCallback(async (k: string) => {
    try {
      const r = await fetch('/api/team/bookings', { headers: { 'x-team-key': k } })
      if (!r.ok) {
        return false
      }
      const json = await r.json()
      setData(json)
      return true
    } catch {
      return false
    }
  }, [])

  // Initial load & check persisted session
  useEffect(() => {
    const t = parts(new Date().toISOString()).date
    const dow = new Date(t + 'T00:00:00Z').getUTCDay()
    setToday(t)
    setWeek(addDays(t, -((dow + 6) % 7))) // Monday of current week
    setMbDate(t)
    setPreviewDate(t)

    // Load public staff roster first for login dropdown
    fetch('/api/team/members')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.staff) {
          setData((prev) => (prev ? { ...prev, staff: res.staff } : { staff: res.staff, types: res.consultTypes || [], bookings: [] }))
        }
      })
      .catch(() => {})

    // Check existing session
    const saved = sessionStorage.getItem('team-auth-session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.user && parsed.token) {
          setCurrentUser(parsed.user)
          loadData(parsed.token)
          if (!parsed.user.isAdmin) {
            setActiveStaffId(parsed.user.id)
            setActiveTab('availability')
          } else {
            setActiveStaffId('all')
            setActiveTab('admin-members')
          }
        }
      } catch {}
    }
  }, [loadData])

  // Handle Login
  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const r = await fetch('/api/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: loginMode === 'specialist' ? selectedStaffId : undefined,
          password: loginPassword,
          asAdmin: loginMode === 'admin',
        }),
      })

      const res = await r.json()
      setLoginLoading(false)

      if (!r.ok || !res.ok) {
        setLoginError(res.error || 'Invalid credentials. Please verify password.')
        return
      }

      const authSession: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        role: res.user.role,
        email: res.user.email,
        isAdmin: Boolean(res.user.isAdmin),
        token: res.token,
      }

      setCurrentUser(authSession)
      sessionStorage.setItem('team-auth-session', JSON.stringify({ user: authSession, token: res.token }))

      // Load full data with token
      await loadData(res.token)

      if (authSession.isAdmin) {
        setActiveStaffId('all')
        setActiveTab('admin-members')
      } else {
        setActiveStaffId(authSession.id)
        setActiveTab('availability')
      }
    } catch {
      setLoginLoading(false)
      setLoginError('Network error connecting to team authentication.')
    }
  }

  // Handle Logout
  function handleLogout() {
    sessionStorage.removeItem('team-auth-session')
    setCurrentUser(null)
    setLoginPassword('')
    setLoginError('')
  }

  // Sync editStaff whenever data loads or active staff changes
  useEffect(() => {
    if (!data || !data.staff) return
    const target =
      currentUser && !currentUser.isAdmin
        ? data.staff.find((s) => s.id === currentUser.id)
        : data.staff.find((s) => s.id === (activeStaffId === 'all' ? data.staff[0]?.id : activeStaffId))

    if (target) {
      setEditStaff(JSON.parse(JSON.stringify(target)))
      setMbStaffId(target.id)
    }
    if (data.types?.length && !mbTypeId) {
      setMbTypeId(data.types[0].id)
    }
  }, [data, activeStaffId, currentUser, mbTypeId])

  // Cancel booking
  async function cancelBooking(b: Booking) {
    if (!confirm(`Are you sure you want to cancel the booking for ${b.parentName} (${b.childName})?`)) return
    const token = currentUser?.token || 'manas2026'
    try {
      const r = await fetch('/api/team/cancel', {
        method: 'POST',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id }),
      })
      if (r.ok) {
        setSelectedBooking(null)
        loadData(token)
      } else {
        alert('Failed to cancel booking.')
      }
    } catch {
      alert('Network error while cancelling booking.')
    }
  }

  // Save weekly hours
  async function saveAvailability() {
    if (!editStaff) return
    setAvailSaving(true)
    setAvailMsg('')
    const token = currentUser?.token || 'manas2026'

    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editStaff.id,
          active: editStaff.active,
          weeklyHours: editStaff.weeklyHours,
          leave: editStaff.leave,
        }),
      })
      const res = await r.json()
      setAvailSaving(false)
      if (r.ok) {
        setAvailMsg('Weekly shift hours saved successfully! Live booking slots on /consult are now updated.')
        loadData(token)
        setTimeout(() => setAvailMsg(''), 4500)
      } else {
        setAvailMsg(res.error || 'Failed to update schedule.')
      }
    } catch {
      setAvailSaving(false)
      setAvailMsg('Network error while saving schedule.')
    }
  }

  // Add Time Off / Leave
  async function handleAddLeave() {
    if (!editStaff) return
    if (!newLeave.from || !newLeave.to) {
      setLeaveMsg('Please select both start and end dates.')
      return
    }
    if (newLeave.from > newLeave.to) {
      setLeaveMsg('Start date must be before or on end date.')
      return
    }

    const updatedLeave = [...editStaff.leave, newLeave].sort((a, b) => a.from.localeCompare(b.from))
    setAvailSaving(true)
    setLeaveMsg('')
    const token = currentUser?.token || 'manas2026'

    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editStaff.id,
          active: editStaff.active,
          weeklyHours: editStaff.weeklyHours,
          leave: updatedLeave,
        }),
      })
      setAvailSaving(false)
      if (r.ok) {
        setEditStaff({ ...editStaff, leave: updatedLeave })
        setNewLeave({ from: '', to: '' })
        setLeaveMsg('Time off scheduled successfully. Slots on /consult during these dates are now blocked.')
        loadData(token)
        setTimeout(() => setLeaveMsg(''), 4500)
      } else {
        const j = await r.json()
        setLeaveMsg(j.error || 'Could not save time off.')
      }
    } catch {
      setAvailSaving(false)
      setLeaveMsg('Network error saving time off.')
    }
  }

  // Delete Leave
  async function handleDeleteLeave(index: number) {
    if (!editStaff) return
    const updatedLeave = editStaff.leave.filter((_, idx) => idx !== index)
    const token = currentUser?.token || 'manas2026'
    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editStaff.id,
          active: editStaff.active,
          weeklyHours: editStaff.weeklyHours,
          leave: updatedLeave,
        }),
      })
      if (r.ok) {
        setEditStaff({ ...editStaff, leave: updatedLeave })
        loadData(token)
      }
    } catch {
      alert('Could not delete time off.')
    }
  }

  // Admin: Add New Member
  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newMemberName || !newMemberRole || !newMemberEmail) {
      setAddMemberMsg('Name, role, and email are required.')
      return
    }
    setAddMemberSaving(true)
    setAddMemberMsg('')
    const token = currentUser?.token || 'manasadmin'

    try {
      const r = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName,
          role: newMemberRole,
          email: newMemberEmail,
          phone: newMemberPhone,
          password: newMemberPassword || `${newMemberName.toLowerCase().split(' ')[0]}123`,
          consultTypeIds: newMemberTypes,
        }),
      })
      const res = await r.json()
      setAddMemberSaving(false)
      if (r.ok) {
        setAddMemberMsg(`Specialist ${newMemberName} added successfully!`)
        setNewMemberName('')
        setNewMemberRole('')
        setNewMemberEmail('')
        setNewMemberPhone('')
        setNewMemberPassword('')
        setShowAddMember(false)
        loadData(token)
      } else {
        setAddMemberMsg(res.error || 'Failed to add specialist.')
      }
    } catch {
      setAddMemberSaving(false)
      setAddMemberMsg('Network error creating team member.')
    }
  }

  // Admin: Remove Member
  async function handleRemoveMember(staffId: string, staffName: string) {
    if (!confirm(`Are you sure you want to remove ${staffName} from the clinical team roster? Their profile will no longer appear on /consult.`)) return
    const token = currentUser?.token || 'manasadmin'
    try {
      const r = await fetch(`/api/team/members?id=${staffId}`, {
        method: 'DELETE',
        headers: { 'x-team-key': token },
      })
      const res = await r.json()
      if (r.ok) {
        loadData(token)
      } else {
        alert(res.error || 'Failed to remove specialist.')
      }
    } catch {
      alert('Network error while removing specialist.')
    }
  }

  // Admin: Toggle Active Status
  async function handleToggleActive(member: Staff) {
    const token = currentUser?.token || 'manasadmin'
    try {
      const r = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          active: !member.active,
        }),
      })
      if (r.ok) {
        loadData(token)
      }
    } catch {
      alert('Failed to update status.')
    }
  }

  // Manual Booking / Slot Block
  async function handleManualBook(e: React.FormEvent) {
    e.preventDefault()
    if (!mbStaffId || !mbTypeId || !mbDate || !mbTime || !mbParentName) {
      setMbMsg('Please fill in specialist, type, date, time and client name.')
      return
    }
    setMbSaving(true)
    setMbMsg('')
    const token = currentUser?.token || 'manas2026'

    const isoStart = new Date(`${mbDate}T${mbTime}:00+05:30`).toISOString()

    try {
      const r = await fetch('/api/team/manual-book', {
        method: 'POST',
        headers: { 'x-team-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: mbStaffId,
          typeId: mbTypeId,
          startAt: isoStart,
          parentName: mbParentName,
          email: mbEmail,
          phone: mbPhone,
          childName: mbChildName || 'Self / Client',
          childAge: mbChildAge || 'N/A',
          concern: mbConcern || 'Scheduled via Team Portal',
        }),
      })
      const res = await r.json()
      setMbSaving(false)
      if (r.ok) {
        setMbMsg('Appointment booked and slot blocked successfully on /consult!')
        setMbParentName('')
        setMbEmail('')
        setMbPhone('')
        setMbChildName('')
        setMbChildAge('')
        setMbConcern('')
        loadData(token)
        setActiveTab('calendar')
      } else {
        setMbMsg(res.error || 'Failed to book slot.')
      }
    } catch {
      setMbSaving(false)
      setMbMsg('Network error while booking slot.')
    }
  }

  // Compute live consult preview slots for editStaff
  const getPreviewSlots = () => {
    if (!editStaff || !editStaff.active || !previewDate) return []
    // Check if on leave
    if (editStaff.leave?.some((l) => previewDate >= l.from && previewDate <= l.to)) return []
    const dow = new Date(previewDate + 'T00:00:00Z').getUTCDay()
    const shift = editStaff.weeklyHours?.find((h) => h.day === dow)
    if (!shift) return []

    // 45 min consult + 15 min buffer = 60 min slots
    const slots: string[] = []
    const [sH, sM] = shift.start.split(':').map(Number)
    const [eH, eM] = shift.end.split(':').map(Number)
    let currentMins = sH * 60 + sM
    const endMins = eH * 60 + eM

    while (currentMins + 45 <= endMins) {
      const h = Math.floor(currentMins / 60)
      const m = currentMins % 60
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 || 12
      const timeStr = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`

      // Check if blocked by existing booking
      const slotIso = `${previewDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`
      const slotMs = Date.parse(slotIso)
      const isBooked = data?.bookings?.some(
        (b) =>
          b.staffId === editStaff.id &&
          b.status !== 'cancelled' &&
          Math.abs(Date.parse(b.startAt) - slotMs) < 40 * 60000
      )

      slots.push(`${timeStr}${isBooked ? ' (Reserved)' : ' (Available)'}`)
      currentMins += 60 // 45 min duration + 15 min buffer
    }

    return slots
  }

  // -------------------------------------------------------------
  // 1. LOGIN SCREEN (When not authenticated)
  // -------------------------------------------------------------
  if (!currentUser) {
    const staffList = data?.staff || [
      { id: 'ananya-sridhar', name: 'Ananya Sridhar', role: 'Senior Special Educator & Remedial Specialist' },
      { id: 'dr-manasi', name: 'Dr. Manasi Valluri', role: 'Founder & Developmental Specialist' },
      { id: 'dr-radhika', name: 'Dr. Radhika Sharma', role: 'Occupational Therapist & Sensory Specialist' },
      { id: 'kavitha-s', name: 'Kavitha Sundaram', role: 'Speech-Language Pathologist' },
      { id: 'arun-kumar', name: 'Arun Kumar', role: 'Clinical Child Psychologist' },
    ]

    return (
      <main className="min-h-screen bg-[#faf8f5] px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>MANAS Learning Clinical Team</span>
            </span>
            <h1 className="mt-3 font-patrick text-3xl sm:text-4xl font-bold text-text-brown">
              Specialist &amp; Admin Workspace
            </h1>
            <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
              Sign in with your specialist password to configure your free slots and shift hours for parents on{' '}
              <a href="/consult" target="_blank" className="text-primary font-bold underline hover:text-orange-700">
                /consult
              </a>
              , or enter as Admin to manage clinical team members.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-[#e8e4dc] bg-white p-6 sm:p-8 shadow-xl">
            {/* Mode Selector */}
            <div className="flex rounded-2xl bg-cream-dark p-1.5 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('specialist')
                  setLoginPassword('ananya123')
                  setLoginError('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                  loginMode === 'specialist' ? 'bg-white text-text-brown shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Specialist Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('admin')
                  setLoginPassword('manasadmin')
                  setLoginError('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                  loginMode === 'admin' ? 'bg-white text-text-brown shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Clinic Administrator</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginMode === 'specialist' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Select Your Profile
                    </label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => {
                        const id = e.target.value
                        setSelectedStaffId(id)
                        const defaultPw = `${id.split('-')[0] === 'dr' ? id.split('-')[1] : id.split('-')[0]}123`
                        setLoginPassword(defaultPw)
                      }}
                      className="w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    >
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                        Unique Password
                      </label>
                      <span className="text-xs text-primary font-semibold">e.g. ananya123, manasi123</span>
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your specialist password"
                      required
                      className="w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Admin Password
                    </label>
                    <span className="text-xs text-emerald-600 font-semibold">pass: manasadmin</span>
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter clinic admin password"
                    required
                    className="w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              {loginError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-200 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg disabled:opacity-50"
              >
                {loginLoading ? 'Signing in...' : loginMode === 'specialist' ? 'Sign In to My Schedule' : 'Access Admin Dashboard'}
              </button>
            </form>

            {/* Quick Demo Logins Bar */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Quick 1-Click Specialist Logins:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ananya-sridhar', name: 'Ananya S.', pw: 'ananya123' },
                  { id: 'dr-manasi', name: 'Dr. Manasi', pw: 'manasi123' },
                  { id: 'dr-radhika', name: 'Dr. Radhika', pw: 'radhika123' },
                  { id: 'kavitha-s', name: 'Kavitha S.', pw: 'kavitha123' },
                  { id: 'arun-kumar', name: 'Arun K.', pw: 'arun123' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLoginMode('specialist')
                      setSelectedStaffId(item.id)
                      setLoginPassword(item.pw)
                      setLoginError('')
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                      selectedStaffId === item.id && loginMode === 'specialist'
                        ? 'border-primary bg-orange-50 text-primary font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('admin')
                    setLoginPassword('manasadmin')
                    setLoginError('')
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                    loginMode === 'admin'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  Admin (manasadmin)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED WORKSPACE (Specialist or Admin)
  // -------------------------------------------------------------
  const allStaff = data?.staff || []
  const currentSpecialist = editStaff || allStaff[0]
  const color = STAFF_COLORS[currentSpecialist?.id] || DEFAULT_COLOR

  // Filter bookings for specialist vs admin
  const filteredBookings = (data?.bookings || []).filter((b) => {
    if (currentUser.isAdmin && activeStaffId === 'all') return true
    const targetId = currentUser.isAdmin ? activeStaffId : currentUser.id
    return b.staffId === targetId
  })

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 text-gray-900">
      {/* Top Banner & Header */}
      <header className="border-b border-[#e8e4dc] bg-white sticky top-0 z-30 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-lg shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-patrick text-xl font-bold text-text-brown leading-tight">
                  {currentUser.name}
                </span>
                {currentUser.isAdmin ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Administrator
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Live on /consult
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-tight">{currentUser.role} • {currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/consult"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              title="View live parent booking experience"
            >
              <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>View /consult</span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Navigation Tabs Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-2 shadow-sm border border-cream-dark">
          <div className="flex flex-wrap gap-1.5">
            {/* Free Slots / Shift Hours Tab */}
            <button
              onClick={() => setActiveTab('availability')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'availability' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>My Free Slots &amp; Shift Hours</span>
            </button>

            {/* Appointments Tab */}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Appointments ({filteredBookings.length})</span>
            </button>

            {/* Time Off Tab */}
            <button
              onClick={() => setActiveTab('leaves')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'leaves' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m11.32-11.32l1.41-1.41" />
              </svg>
              <span>Time Off &amp; Leaves</span>
            </button>

            {/* Book / Block Slot */}
            <button
              onClick={() => setActiveTab('quick-book')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'quick-book' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Book / Block Slot</span>
            </button>

            {/* Admin Management Tab */}
            {currentUser.isAdmin && (
              <button
                onClick={() => setActiveTab('admin-members')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'admin-members' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Manage Team Members ({allStaff.length})</span>
              </button>
            )}
          </div>

          {/* Admin Switch View Pill */}
          {currentUser.isAdmin && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-gray-400">View As:</span>
              <select
                value={activeStaffId}
                onChange={(e) => setActiveStaffId(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-800"
              >
                <option value="all">All Specialists (Overview)</option>
                {allStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: FREE SLOTS & SHIFT HOURS (Weekly Schedule + Live /consult sync) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'availability' && editStaff && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shift Editor Column */}
            <div className="lg:col-span-2 rounded-3xl border border-[#e8e4dc] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="font-patrick text-2xl font-bold text-text-brown">
                    Weekly Shift Hours for {editStaff.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Set your working hours for each day. These hours generate the available consultation slots shown to parents on{' '}
                    <a href="/consult" target="_blank" className="text-primary underline font-bold">
                      /consult
                    </a>
                    .
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-600">Accept Bookings:</label>
                  <input
                    type="checkbox"
                    checked={editStaff.active}
                    onChange={(e) => setEditStaff({ ...editStaff, active: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </div>
              </div>

              {/* Day-by-Day Shift Hours List */}
              <div className="space-y-3">
                {DAYS.map(([dayNum, dayFull]) => {
                  const shift = editStaff.weeklyHours.find((h) => h.day === dayNum)
                  const isWorking = Boolean(shift)

                  return (
                    <div
                      key={dayNum}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                        isWorking ? 'border-orange-200 bg-orange-50/20' : 'border-gray-200 bg-gray-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isWorking}
                          onChange={(e) => {
                            let next = [...editStaff.weeklyHours]
                            if (e.target.checked) {
                              next.push({ day: dayNum, start: '10:00', end: '17:00' })
                            } else {
                              next = next.filter((h) => h.day !== dayNum)
                            }
                            setEditStaff({ ...editStaff, weeklyHours: next })
                          }}
                          className="h-4 w-4 rounded accent-primary"
                        />
                        <span className="font-patrick text-lg font-bold text-gray-800 w-28">{dayFull}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isWorking ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isWorking ? 'Available' : 'Day Off'}
                        </span>
                      </div>

                      {isWorking && shift && (
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                          <span>From:</span>
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => {
                              const val = e.target.value
                              const updated = editStaff.weeklyHours.map((h) =>
                                h.day === dayNum ? { ...h, start: val } : h
                              )
                              setEditStaff({ ...editStaff, weeklyHours: updated })
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-bold"
                          />
                          <span>To:</span>
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => {
                              const val = e.target.value
                              const updated = editStaff.weeklyHours.map((h) =>
                                h.day === dayNum ? { ...h, end: val } : h
                              )
                              setEditStaff({ ...editStaff, weeklyHours: updated })
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-bold"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Feedback and Save Button */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                {availMsg && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    {availMsg}
                  </div>
                )}
                <div className="sm:ml-auto">
                  <button
                    type="button"
                    onClick={saveAvailability}
                    disabled={availSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>{availSaving ? 'Saving...' : 'Save Availability to /consult'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Consult Preview Card */}
            <div className="rounded-3xl border border-[#e8e4dc] bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-patrick text-xl font-bold text-text-brown">Live /consult Preview</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                This shows the exact 45-min consultation slots parents will see on{' '}
                <a href="/consult" target="_blank" className="text-primary underline font-bold">
                  /consult
                </a>{' '}
                for your profile.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Preview Date:</label>
                <input
                  type="date"
                  value={previewDate}
                  onChange={(e) => setPreviewDate(e.target.value)}
                  className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-96 rounded-2xl bg-cream/50 border border-cream-dark p-3 space-y-1.5">
                {getPreviewSlots().length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No slots available on this date (Day off, on leave, or outside hours).
                  </div>
                ) : (
                  getPreviewSlots().map((s, idx) => {
                    const isReserved = s.includes('(Reserved)')
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${
                          isReserved
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-white text-emerald-800 border border-emerald-200 shadow-xs'
                        }`}
                      >
                        <span>{s.split(' ')[0]} {s.split(' ')[1]}</span>
                        <span className="text-[10px] uppercase tracking-wider">
                          {isReserved ? 'Reserved' : 'Available'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                Formula: Shift start to end, 45 min consult + 15 min buffer.
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: APPOINTMENTS & CALENDAR */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Week navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm border border-cream-dark">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeek(addDays(week, -7))}
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-bold hover:bg-gray-50"
                >
                  ← Previous Week
                </button>
                <button
                  type="button"
                  onClick={() => setWeek(today)}
                  className="rounded-xl border border-primary bg-orange-50 px-3 py-1.5 text-xs font-bold text-primary"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setWeek(addDays(week, 7))}
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-bold hover:bg-gray-50"
                >
                  Next Week →
                </button>
              </div>

              <div className="font-patrick text-xl font-bold text-text-brown">
                Week of {labelDate(week)} — {labelDate(addDays(week, 6))}
              </div>
            </div>

            {/* 7-Day Calendar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const date = addDays(week, offset)
                const dayBookings = filteredBookings.filter((b) => parts(b.startAt).date === date)
                const isToday = date === today

                return (
                  <div
                    key={date}
                    className={`rounded-2xl border p-3 flex flex-col min-h-[260px] ${
                      isToday ? 'border-primary bg-orange-50/20' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">{labelDate(date).split(',')[0]}</span>
                      <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-gray-800'}`}>
                        {date.slice(8)}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayBookings.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-gray-400">No bookings</div>
                      ) : (
                        dayBookings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            className="cursor-pointer rounded-xl border border-blue-200 bg-blue-50/80 p-2 text-xs transition hover:shadow-md"
                          >
                            <div className="font-bold text-blue-900">{hmTime(b.startAt)} - {hmTime(b.endAt)}</div>
                            <div className="font-semibold text-gray-800 truncate">{b.childName} ({b.childAge || 'child'})</div>
                            <div className="text-[11px] text-gray-500 truncate">{b.concern}</div>
                            <span className="mt-1 inline-block rounded-md bg-blue-200/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-900">
                              {b.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: TIME OFF & LEAVES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'leaves' && editStaff && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Leave Form */}
            <div className="rounded-3xl border border-[#e8e4dc] bg-white p-6 shadow-sm">
              <h2 className="font-patrick text-2xl font-bold text-text-brown mb-2">Schedule Time Off</h2>
              <p className="text-xs text-gray-500 mb-4">
                When you schedule time off, your consultation slots on{' '}
                <a href="/consult" target="_blank" className="text-primary font-bold underline">
                  /consult
                </a>{' '}
                are automatically blocked out during these dates.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">From Date:</label>
                  <input
                    type="date"
                    value={newLeave.from}
                    onChange={(e) => setNewLeave({ ...newLeave, from: e.target.value })}
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">To Date:</label>
                  <input
                    type="date"
                    value={newLeave.to}
                    onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })}
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2.5 text-xs font-bold"
                  />
                </div>

                {leaveMsg && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    {leaveMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddLeave}
                  disabled={availSaving}
                  className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition"
                >
                  {availSaving ? 'Saving...' : 'Add Time Off Period'}
                </button>
              </div>
            </div>

            {/* Existing Leaves List */}
            <div className="lg:col-span-2 rounded-3xl border border-[#e8e4dc] bg-white p-6 shadow-sm">
              <h2 className="font-patrick text-2xl font-bold text-text-brown mb-2">
                Active Leaves for {editStaff.name}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Current dates blocked off from parent booking availability:
              </p>

              {(!editStaff.leave || editStaff.leave.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-400">
                  No scheduled leaves. You are active on all regular weekly shift days.
                </div>
              ) : (
                <div className="space-y-2">
                  {editStaff.leave.map((l, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-primary font-bold">
                          🏖️
                        </span>
                        <div>
                          <div className="text-xs font-bold text-gray-800">
                            {labelDate(l.from)} — {labelDate(l.to)}
                          </div>
                          <div className="text-[11px] text-gray-500">All consult slots blocked</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLeave(idx)}
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: QUICK BOOK / BLOCK SLOT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'quick-book' && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-[#e8e4dc] bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="font-patrick text-2xl font-bold text-text-brown mb-2">Book / Block Slot Manually</h2>
            <p className="text-xs text-gray-500 mb-6">
              Quickly reserve a slot for offline client consultations, phone bookings, or internal assessments.
            </p>

            <form onSubmit={handleManualBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Specialist</label>
                  <select
                    value={mbStaffId}
                    onChange={(e) => setMbStaffId(e.target.value)}
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  >
                    {allStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Consultation Type</label>
                  <select
                    value={mbTypeId}
                    onChange={(e) => setMbTypeId(e.target.value)}
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  >
                    {(data?.types || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.durationMins} mins)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={mbDate}
                    onChange={(e) => setMbDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Start Time (IST)</label>
                  <input
                    type="time"
                    value={mbTime}
                    onChange={(e) => setMbTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Parent / Client Name</label>
                <input
                  type="text"
                  value={mbParentName}
                  onChange={(e) => setMbParentName(e.target.value)}
                  placeholder="e.g. Radhika Iyer"
                  required
                  className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={mbPhone}
                    onChange={(e) => setMbPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={mbEmail}
                    onChange={(e) => setMbEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Child Name</label>
                  <input
                    type="text"
                    value={mbChildName}
                    onChange={(e) => setMbChildName(e.target.value)}
                    placeholder="e.g. Aarav"
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Child Age</label>
                  <input
                    type="text"
                    value={mbChildAge}
                    onChange={(e) => setMbChildAge(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Primary Concern</label>
                <textarea
                  rows={2}
                  value={mbConcern}
                  onChange={(e) => setMbConcern(e.target.value)}
                  placeholder="Notes for the consultation session..."
                  className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs"
                />
              </div>

              {mbMsg && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                  {mbMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={mbSaving}
                className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition disabled:opacity-50"
              >
                {mbSaving ? 'Booking...' : 'Confirm Booking & Block Slot'}
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: ADMIN MANAGE TEAM MEMBERS (Add / Remove People) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'admin-members' && currentUser.isAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 border border-[#e8e4dc] shadow-sm">
              <div>
                <h2 className="font-patrick text-3xl font-bold text-text-brown">
                  Clinical Team Roster &amp; Access Control
                </h2>
                <p className="text-xs text-gray-500">
                  Add new specialists, remove team members, or reset passwords. Every specialist logs in with their own password to manage their free slots for{' '}
                  <a href="/consult" target="_blank" className="text-primary underline font-bold">
                    /consult
                  </a>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Team Member</span>
              </button>
            </div>

            {/* Modal: Add New Team Member */}
            {showAddMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                <div className="w-full max-w-lg rounded-3xl border border-[#e8e4dc] bg-white p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <h3 className="font-patrick text-2xl font-bold text-text-brown">Add New Specialist</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateMember} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="e.g. Dr. Pooja Hegde"
                        required
                        className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Role / Clinical Title</label>
                      <input
                        type="text"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        placeholder="e.g. Behavioral Therapist &amp; Autism Specialist"
                        required
                        className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="pooja@manaslearning.com"
                          required
                          className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Unique Login Password</label>
                        <input
                          type="text"
                          value={newMemberPassword}
                          onChange={(e) => setNewMemberPassword(e.target.value)}
                          placeholder="e.g. pooja123"
                          className="w-full rounded-xl border border-cream-dark bg-cream px-3 py-2 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Consultation Types Offered on /consult
                      </label>
                      <div className="space-y-1.5 rounded-xl border border-cream-dark bg-cream/40 p-2.5">
                        {[
                          { id: 'free-counselling', title: 'Free Counselling (30m)' },
                          { id: 'expert-consultation', title: 'Expert Consultation (45m)' },
                          { id: 'iep-consultation', title: 'IEP Consultation (45m)' },
                        ].map((t) => (
                          <label key={t.id} className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                            <input
                              type="checkbox"
                              checked={newMemberTypes.includes(t.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewMemberTypes([...newMemberTypes, t.id])
                                } else {
                                  setNewMemberTypes(newMemberTypes.filter((x) => x !== t.id))
                                }
                              }}
                              className="h-3.5 w-3.5 rounded accent-primary"
                            />
                            <span>{t.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {addMemberMsg && (
                      <div className="rounded-xl bg-orange-50 p-2.5 text-xs font-bold text-primary border border-orange-200">
                        {addMemberMsg}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addMemberSaving}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {addMemberSaving ? 'Saving...' : 'Add Specialist'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Specialist Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allStaff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-primary font-bold text-lg">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-patrick text-xl font-bold text-gray-900 leading-tight">{member.name}</h3>
                          <p className="text-xs text-gray-500 leading-tight">{member.role}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          member.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {member.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="space-y-1.5 my-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-400">Email:</span>
                        <span className="font-medium truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-400">Login Pwd:</span>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-bold text-primary">
                          {member.password || `${member.id.split('-')[0]}123`}
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-400">Weekly Shifts:</span>
                        <span className="font-bold text-gray-800">{member.weeklyHours?.length || 0} days / week</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {member.consultTypeIds?.map((tid) => (
                        <span
                          key={tid}
                          className="rounded-md bg-cream-dark px-2 py-0.5 text-[10px] font-bold text-text-brown"
                        >
                          {tid === 'free-counselling' ? 'Free Counselling' : tid === 'expert-consultation' ? 'Expert Consult' : 'IEP'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStaffId(member.id)
                        setActiveTab('availability')
                      }}
                      className="rounded-xl border border-primary bg-orange-50 px-3 py-1.5 text-xs font-bold text-primary hover:bg-orange-100 transition"
                    >
                      Edit Availability
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Booking Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-[#e8e4dc] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <span className="font-patrick text-2xl font-bold text-text-brown">Booking Details</span>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-gray-700">
                <div><strong>Parent:</strong> {selectedBooking.parentName}</div>
                <div><strong>Child:</strong> {selectedBooking.childName} (Age: {selectedBooking.childAge || 'N/A'})</div>
                <div><strong>Time:</strong> {labelDate(parts(selectedBooking.startAt).date)} at {hmTime(selectedBooking.startAt)} - {hmTime(selectedBooking.endAt)} (IST)</div>
                <div><strong>Email:</strong> {selectedBooking.email}</div>
                <div><strong>Phone:</strong> {selectedBooking.phone}</div>
                <div><strong>Primary Concern:</strong> {selectedBooking.concern}</div>
                <div><strong>Status:</strong> <span className="uppercase font-bold text-primary">{selectedBooking.status}</span></div>
              </div>

              <div className="mt-6 flex justify-between gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => cancelBooking(selectedBooking)}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                >
                  Cancel Booking
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
