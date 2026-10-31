'use client'
import { useCallback, useEffect, useState } from 'react'

type Staff = {
  id: string
  name: string
  role: string
  active: boolean
  weeklyHours: { day: number; start: string; end: string }[]
  leave: { from: string; to: string }[]
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
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState<{ staff: Staff[]; types: ConsultType[]; bookings: Booking[] } | null>(null)

  // Active specialist identity
  const [activeStaffId, setActiveStaffId] = useState<string>('all')

  // UI Tabs: 'calendar' | 'availability' | 'leaves' | 'quick-book'
  const [activeTab, setActiveTab] = useState<'calendar' | 'availability' | 'leaves' | 'quick-book'>('calendar')

  // Calendar navigation
  const [week, setWeek] = useState('')
  const [today, setToday] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Availability editing state for active staff
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [availSaving, setAvailSaving] = useState(false)
  const [availMsg, setAvailMsg] = useState('')

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

  const loadData = useCallback(async (k: string) => {
    try {
      const r = await fetch('/api/team/bookings', { headers: { 'x-team-key': k } })
      if (!r.ok) {
        setAuthed(false)
        setErr('Incorrect team password. Please try again.')
        return
      }
      const json = await r.json()
      setData(json)
      setAuthed(true)
      setErr('')
      sessionStorage.setItem('team-key', k)
    } catch {
      setAuthed(false)
      setErr('Failed to load team data. Check network connection.')
    }
  }, [])

  useEffect(() => {
    const t = parts(new Date().toISOString()).date
    const dow = new Date(t + 'T00:00:00Z').getUTCDay()
    setToday(t)
    setWeek(addDays(t, -((dow + 6) % 7))) // Monday of current week
    setMbDate(t)

    const savedKey = sessionStorage.getItem('team-key') || 'manas2026'
    if (savedKey) {
      setKey(savedKey)
      loadData(savedKey)
    }
  }, [loadData])

  // Sync editStaff whenever data loads or active staff changes
  useEffect(() => {
    if (!data) return
    const target = data.staff.find((s) => s.id === (activeStaffId === 'all' ? data.staff[0]?.id : activeStaffId))
    if (target) {
      setEditStaff(JSON.parse(JSON.stringify(target)))
      setMbStaffId(target.id)
    }
    if (data.types.length && !mbTypeId) {
      setMbTypeId(data.types[0].id)
    }
  }, [data, activeStaffId, mbTypeId])

  // Cancel booking
  async function cancelBooking(b: Booking) {
    if (!confirm(`Are you sure you want to cancel the booking for ${b.parentName} (${b.childName})?`)) return
    try {
      const r = await fetch('/api/team/cancel', {
        method: 'POST',
        headers: { 'x-team-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id }),
      })
      if (r.ok) {
        setSelectedBooking(null)
        loadData(key)
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
    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'x-team-key': key, 'Content-Type': 'application/json' },
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
        setAvailMsg('Weekly hours saved successfully! Live booking slots updated.')
        loadData(key)
      } else {
        setAvailMsg(res.error || 'Failed to update schedule.')
      }
    } catch {
      setAvailSaving(false)
      setAvailMsg('Network error while saving schedule.')
    }
  }

  // Add Time Off
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

    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'x-team-key': key, 'Content-Type': 'application/json' },
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
        setLeaveMsg('Time off scheduled successfully.')
        loadData(key)
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
    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'x-team-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editStaff.id,
          active: editStaff.active,
          weeklyHours: editStaff.weeklyHours,
          leave: updatedLeave,
        }),
      })
      if (r.ok) {
        setEditStaff({ ...editStaff, leave: updatedLeave })
        loadData(key)
      }
    } catch {
      alert('Could not delete time off.')
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

    const isoStart = new Date(`${mbDate}T${mbTime}:00+05:30`).toISOString()

    try {
      const r = await fetch('/api/team/manual-book', {
        method: 'POST',
        headers: { 'x-team-key': key, 'Content-Type': 'application/json' },
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
        setMbMsg('Appointment booked and slot blocked successfully!')
        setMbParentName('')
        setMbEmail('')
        setMbPhone('')
        setMbChildName('')
        setMbChildAge('')
        setMbConcern('')
        loadData(key)
        setActiveTab('calendar')
      } else {
        setMbMsg(res.error || 'Failed to book slot.')
      }
    } catch {
      setMbSaving(false)
      setMbMsg('Network error while booking slot.')
    }
  }

  // Login Screen
  if (!authed || !data) {
    return (
      <main className="min-h-screen bg-[#faf8f5] px-4 py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-[#e8e4dc] bg-white p-8 shadow-xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-orange-100 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Specialist Portal
            </span>
            <h1 className="mt-3 font-patrick text-3xl font-bold text-[#1f2937]">MANAS Team Portal</h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to manage your consultations, shift hours, and client appointments.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              loadData(key)
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700">Team Passcode</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter team passcode (default: manas2026)"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white"
              />
            </div>

            {err && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">
                {err}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-orange hover:shadow-lg"
            >
              Sign In to Portal
            </button>
            <p className="text-center text-xs text-gray-400">
              Hint: Default specialist passcode is <code className="font-mono text-gray-600">manas2026</code>
            </p>
          </form>
        </div>
      </main>
    )
  }

  const days = week ? Array.from({ length: 7 }, (_, i) => addDays(week, i)) : []
  const filteredBookings = data.bookings.filter(
    (b) => activeStaffId === 'all' || b.staffId === activeStaffId
  )
  const currentStaff = data.staff.find((s) => s.id === activeStaffId)

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header & Specialist Switcher */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                Live Portal
              </span>
              <span className="text-xs text-gray-500">MANAS Learning Clinical Team</span>
            </div>
            <h1 className="mt-1 font-patrick text-3xl font-extrabold text-[#111827] sm:text-4xl">
              Specialist Workspace
            </h1>
          </div>

          {/* Quick Specialist Identity Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Switch View:</span>
            <button
              onClick={() => setActiveStaffId('all')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                activeStaffId === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Team
            </button>
            {data.staff.map((s) => {
              const active = activeStaffId === s.id
              const colors = STAFF_COLORS[s.id] || DEFAULT_COLOR
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStaffId(s.id)}
                  style={{
                    backgroundColor: active ? colors.badge : '#ffffff',
                    color: active ? '#ffffff' : '#374151',
                    borderColor: active ? colors.badge : '#e5e7eb',
                  }}
                  className="rounded-full border px-3.5 py-1.5 text-xs font-bold transition shadow-sm hover:opacity-90"
                >
                  {s.name.split(' ')[0]} {s.name.split(' ')[1]?.[0] || ''}.
                </button>
              )
            })}
          </div>
        </div>

        {/* Current Active Specialist Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white shadow-sm"
              style={{
                backgroundColor: currentStaff
                  ? STAFF_COLORS[currentStaff.id]?.badge || '#3b82f6'
                  : '#111827',
              }}
            >
              {currentStaff ? (
                currentStaff.name.charAt(0)
              ) : (
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {currentStaff ? currentStaff.name : 'All Specialists (Clinic Overview)'}
                </h2>
                {currentStaff && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      currentStaff.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentStaff.active ? 'Accepting Bookings' : 'Away / Paused'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {currentStaff ? currentStaff.role : 'Managing multi-specialist clinical schedule'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Calendar & Appointments ({filteredBookings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === 'availability' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Weekly Shift Hours</span>
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === 'leaves' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m11.32-11.32l1.41-1.41" />
              </svg>
              <span>Time Off & Leaves</span>
            </button>
            <button
              onClick={() => setActiveTab('quick-book')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
                activeTab === 'quick-book' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Book / Block Slot</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: CALENDAR & APPOINTMENTS ================= */}
        {activeTab === 'calendar' && (
          <div className="mt-6 space-y-6">
            {/* Week Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeek(addDays(week, -7))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  ← Previous Week
                </button>
                <button
                  onClick={() => {
                    const t = parts(new Date().toISOString()).date
                    const dow = new Date(t + 'T00:00:00Z').getUTCDay()
                    setWeek(addDays(t, -((dow + 6) % 7)))
                  }}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
                >
                  This Week
                </button>
                <button
                  onClick={() => setWeek(addDays(week, 7))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Next Week →
                </button>
              </div>

              <div className="text-center font-bold text-sm text-gray-800">
                {week && `${labelDate(week)} — ${labelDate(addDays(week, 6))}`}
              </div>

              <div className="text-xs text-gray-500">
                All timings in Indian Standard Time (IST)
              </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
              {days.map((day) => {
                const isToday = day === today
                const dayBookings = filteredBookings.filter((b) => parts(b.startAt).date === day)
                const dObj = new Date(day + 'T00:00:00Z')
                const dayName = dObj.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })
                const dayNum = dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

                return (
                  <div
                    key={day}
                    className={`flex flex-col rounded-2xl border p-3 min-h-[280px] transition ${
                      isToday
                        ? 'border-primary/40 bg-orange-50/30 shadow-sm'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                          {dayName}
                        </span>
                        <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-gray-800'}`}>
                          {dayNum}
                        </p>
                      </div>
                      {dayBookings.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex-1 space-y-2">
                      {dayBookings.length === 0 ? (
                        <p className="pt-6 text-center text-xs text-gray-400 italic">No bookings</p>
                      ) : (
                        dayBookings.map((b) => {
                          const staffMeta = data.staff.find((s) => s.id === b.staffId)
                          const typeMeta = data.types.find((t) => t.id === b.typeId)
                          const colors = STAFF_COLORS[b.staffId] || DEFAULT_COLOR
                          const isCancelled = b.status === 'cancelled'

                          return (
                            <button
                              key={b.id}
                              onClick={() => setSelectedBooking(b)}
                              style={{
                                backgroundColor: isCancelled ? '#f3f4f6' : colors.bg,
                                borderColor: isCancelled ? '#d1d5db' : colors.border,
                              }}
                              className={`w-full text-left rounded-xl border p-2.5 transition hover:shadow-md ${
                                isCancelled ? 'opacity-60 line-through' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-extrabold">
                                <span style={{ color: isCancelled ? '#6b7280' : colors.text }}>
                                  {hmTime(b.startAt)} - {hmTime(b.endAt)}
                                </span>
                                <span
                                  className="rounded px-1.5 py-0.2 text-[9px] uppercase font-bold"
                                  style={{
                                    backgroundColor: isCancelled ? '#9ca3af' : colors.badge,
                                    color: '#ffffff',
                                  }}
                                >
                                  {b.status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-bold text-gray-900 truncate">
                                {b.parentName}
                              </p>
                              <p className="text-[10px] text-gray-600 truncate">
                                Child: {b.childName} ({b.childAge}y)
                              </p>
                              <p className="text-[10px] font-medium text-gray-500 truncate mt-0.5">
                                {typeMeta?.title || 'Consultation'}
                              </p>
                              {activeStaffId === 'all' && staffMeta && (
                                <p className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-gray-600 truncate">
                                  <svg className="h-2.5 w-2.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                                    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                                    <circle cx="20" cy="10" r="2" />
                                  </svg>
                                  <span>{staffMeta.name.split(' ')[0]}</span>
                                </p>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Booking Modal / Detail Sheet */}
            {selectedBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800">
                        Appointment Details
                      </span>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {selectedBooking.parentName}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition"
                      aria-label="Close details"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="font-semibold text-gray-500">Date & Time (IST)</span>
                      <p className="mt-1 font-bold text-gray-900">
                        {labelDate(parts(selectedBooking.startAt).date)}
                      </p>
                      <p className="text-gray-700">
                        {hmTime(selectedBooking.startAt)} — {hmTime(selectedBooking.endAt)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="font-semibold text-gray-500">Specialist</span>
                      <p className="mt-1 font-bold text-gray-900">
                        {data.staff.find((s) => s.id === selectedBooking.staffId)?.name || selectedBooking.staffId}
                      </p>
                      <p className="text-gray-600">
                        {data.staff.find((s) => s.id === selectedBooking.staffId)?.role}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="font-semibold text-gray-500">Child Info</span>
                      <p className="mt-1 font-bold text-gray-900">
                        {selectedBooking.childName} ({selectedBooking.childAge} years)
                      </p>
                      <p className="text-gray-600">Concern: {selectedBooking.concern}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <span className="font-semibold text-gray-500">Parent Contact</span>
                      <p className="mt-1 font-bold text-gray-900">{selectedBooking.phone || 'No phone'}</p>
                      <p className="text-gray-600 truncate">{selectedBooking.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                    <span className="font-semibold text-gray-500">Session Type:</span>
                    <p className="font-bold text-gray-900">
                      {data.types.find((t) => t.id === selectedBooking.typeId)?.title || selectedBooking.typeId}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
                    {selectedBooking.status !== 'cancelled' && (
                      <button
                        onClick={() => cancelBooking(selectedBooking)}
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        Cancel Appointment
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-gray-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: WEEKLY SHIFT HOURS ================= */}
        {activeTab === 'availability' && editStaff && data && (
          <div className="mt-6 space-y-6">
            {/* Specialist Switcher inside Tab 2 */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3.5 shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-500 mr-1">Select Specialist:</span>
              {data.staff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveStaffId(s.id)
                    setEditStaff(JSON.parse(JSON.stringify(s)))
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    editStaff.id === s.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Weekly Working Schedule: {editStaff.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Define the days and hours when parents can book appointments with you on the consultation page.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer rounded-full bg-gray-50 px-4 py-2 border border-gray-200">
                  <input
                    type="checkbox"
                    checked={editStaff.active}
                    onChange={(e) => setEditStaff({ ...editStaff, active: e.target.checked })}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    {editStaff.active ? 'Accepting Live Bookings' : 'Bookings Paused'}
                  </span>
                </label>
              </div>

              {/* Quick Presets */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-gray-500">Quick Apply to Weekdays:</span>
                <button
                  type="button"
                  onClick={() => {
                    const weekdays = [1, 2, 3, 4, 5]
                    const updated = editStaff.weeklyHours.filter((h) => !weekdays.includes(h.day))
                    weekdays.forEach((d) => {
                      updated.push({ day: d, start: '10:00', end: '13:00' })
                      updated.push({ day: d, start: '14:00', end: '17:30' })
                    })
                    setEditStaff({ ...editStaff, weeklyHours: updated })
                  }}
                  className="rounded-lg bg-gray-100 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Standard Shifts (10am-1pm, 2pm-5:30pm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const weekdays = [1, 2, 3, 4, 5]
                    const updated = editStaff.weeklyHours.filter((h) => !weekdays.includes(h.day))
                    weekdays.forEach((d) => {
                      updated.push({ day: d, start: '09:00', end: '14:00' })
                    })
                    setEditStaff({ ...editStaff, weeklyHours: updated })
                  }}
                  className="rounded-lg bg-gray-100 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Morning Only (9am-2pm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditStaff({ ...editStaff, weeklyHours: [] })
                  }}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-600 hover:bg-red-100"
                >
                  Clear All Hours
                </button>
              </div>

              {/* Day-by-Day Hour Rows */}
              <div className="mt-6 space-y-4">
                {DAYS.map(([dayNum, dayFull, dayShort]) => {
                  const shifts = editStaff.weeklyHours
                    .map((h, idx) => ({ h, idx }))
                    .filter((x) => x.h.day === dayNum)

                  return (
                    <div
                      key={dayNum}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#fdfcfb] p-4 transition hover:border-gray-200"
                    >
                      <div className="w-32">
                        <span className="text-sm font-bold text-gray-800">{dayFull}</span>
                        <p className="text-[11px] text-gray-400">
                          {shifts.length === 0 ? 'Not working' : `${shifts.length} shift(s)`}
                        </p>
                      </div>

                      <div className="flex-1 flex flex-wrap items-center gap-3">
                        {shifts.length === 0 ? (
                          <span className="text-xs font-medium text-gray-400 italic">Day Off</span>
                        ) : (
                          shifts.map(({ h, idx }) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm"
                            >
                              <input
                                type="time"
                                value={h.start}
                                onChange={(e) => {
                                  const updated = [...editStaff.weeklyHours]
                                  updated[idx] = { ...updated[idx], start: e.target.value }
                                  setEditStaff({ ...editStaff, weeklyHours: updated })
                                }}
                                className="text-xs font-semibold text-gray-800 outline-none"
                              />
                              <span className="text-xs text-gray-400">to</span>
                              <input
                                type="time"
                                value={h.end}
                                onChange={(e) => {
                                  const updated = [...editStaff.weeklyHours]
                                  updated[idx] = { ...updated[idx], end: e.target.value }
                                  setEditStaff({ ...editStaff, weeklyHours: updated })
                                }}
                                className="text-xs font-semibold text-gray-800 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditStaff({
                                    ...editStaff,
                                    weeklyHours: editStaff.weeklyHours.filter((_, i) => i !== idx),
                                  })
                                }}
                                className="ml-1 text-gray-400 hover:text-red-600 transition p-0.5 inline-flex items-center"
                                title="Remove slot"
                                aria-label="Remove slot"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          ))
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditStaff({
                              ...editStaff,
                              weeklyHours: [
                                ...editStaff.weeklyHours,
                                { day: dayNum, start: '10:00', end: '14:00' },
                              ],
                            })
                          }}
                          className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-primary hover:border-primary hover:bg-orange-50/50"
                        >
                          + Add Shift
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Save Button & Status */}
              <div className="mt-8 flex items-center gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={saveAvailability}
                  disabled={availSaving}
                  className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-orange hover:shadow-lg disabled:opacity-50"
                >
                  {availSaving ? 'Saving Schedule...' : 'Save Weekly Schedule'}
                </button>
                {availMsg && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    {availMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TIME OFF & LEAVES ================= */}
        {activeTab === 'leaves' && editStaff && data && (
          <div className="mt-6 space-y-6">
            {/* Specialist Switcher inside Tab 3 */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3.5 shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-500 mr-1">Select Specialist:</span>
              {data.staff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveStaffId(s.id)
                    setEditStaff(JSON.parse(JSON.stringify(s)))
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    editStaff.id === s.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-xl font-bold text-gray-900">
                  Scheduled Time Off: {editStaff.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Slots falling within scheduled leave dates are blocked automatically on the parent booking page.
                </p>
              </div>

              {/* Current Leaves List */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Leave Periods</h4>
                {editStaff.leave.length === 0 ? (
                  <p className="mt-2 text-xs italic text-gray-400">No upcoming time off scheduled.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {editStaff.leave.map((l, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/40 p-4"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-amber-700">Leave Period</span>
                          <p className="text-sm font-bold text-gray-900">
                            {l.from === l.to ? l.from : `${l.from} → ${l.to}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeave(i)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 shadow-sm border border-gray-200 transition"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule New Leave */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Schedule New Leave</h4>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500">Start Date</label>
                    <input
                      type="date"
                      value={newLeave.from}
                      onChange={(e) =>
                        setNewLeave({
                          ...newLeave,
                          from: e.target.value,
                          to: newLeave.to || e.target.value,
                        })
                      }
                      className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500">End Date</label>
                    <input
                      type="date"
                      value={newLeave.to}
                      onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })}
                      className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleAddLeave}
                      disabled={availSaving}
                      className="rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {availSaving ? 'Adding...' : '+ Add Time Off'}
                    </button>
                  </div>
                </div>

                {leaveMsg && (
                  <p className="mt-3 text-xs font-semibold text-primary">{leaveMsg}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: QUICK BOOK / BLOCK SLOT ================= */}
        {activeTab === 'quick-book' && (
          <div className="mt-6">
            <div className="max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="border-b border-gray-100 pb-5">
                <h3 className="text-xl font-bold text-gray-900">Book or Block a Consultation</h3>
                <p className="text-xs text-gray-500">
                  Directly schedule a client appointment or block out clinical time. This reflects immediately on the live calendar.
                </p>
              </div>

              <form onSubmit={handleManualBook} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Specialist</label>
                    <select
                      value={mbStaffId}
                      onChange={(e) => setMbStaffId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-primary"
                    >
                      {data.staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Consultation Type</label>
                    <select
                      value={mbTypeId}
                      onChange={(e) => setMbTypeId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-primary"
                    >
                      {data.types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.durationMins} mins · ₹{t.priceINR})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Date</label>
                    <input
                      type="date"
                      value={mbDate}
                      onChange={(e) => setMbDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Start Time (IST)</label>
                    <input
                      type="time"
                      value={mbTime}
                      onChange={(e) => setMbTime(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Client / Parent Name</label>
                    <input
                      type="text"
                      value={mbParentName}
                      onChange={(e) => setMbParentName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Child Name & Age</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mbChildName}
                        onChange={(e) => setMbChildName(e.target.value)}
                        placeholder="Child Name"
                        className="mt-1 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={mbChildAge}
                        onChange={(e) => setMbChildAge(e.target.value)}
                        placeholder="Age"
                        className="mt-1 w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={mbPhone}
                      onChange={(e) => setMbPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      value={mbEmail}
                      onChange={(e) => setMbEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Clinical Focus / Concerns</label>
                  <textarea
                    value={mbConcern}
                    onChange={(e) => setMbConcern(e.target.value)}
                    rows={2}
                    placeholder="e.g. Remedial reading evaluation, sensory diet follow-up"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                {mbMsg && (
                  <div
                    className={`rounded-xl p-3 text-xs font-bold ${
                      mbMsg.includes('success')
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {mbMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={mbSaving}
                    className="rounded-full bg-primary px-8 py-3 text-xs font-bold text-white shadow-md transition hover:bg-brand-orange hover:shadow-lg disabled:opacity-50"
                  >
                    {mbSaving ? 'Confirming Slot...' : 'Confirm & Block Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
