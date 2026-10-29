import nodemailer from 'nodemailer'
import fs from 'node:fs'
import path from 'node:path'
import type {Booking, ConsultType, Staff} from './store'
import {makeIcs} from './ics'

const h = (s: string) => s.replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]!))

export async function sendInvites(b: Booking, t: ConsultType, s: Staff, kind: 'confirmed' | 'cancelled') {
  const ms = Date.parse(b.startAt) + 19800000
  const date = new Date(ms).toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'})
  const time = new Date(ms).toISOString().slice(11, 16)
  const url = process.env.MEETING_URL || ''
  const cancelled = kind === 'cancelled'
  const subject = cancelled ? `Cancelled: ${t.title} on ${date}` : `Confirmed: ${t.title} on ${date} at ${time} IST`
  const ics = makeIcs(b, t, s, cancelled ? 'CANCEL' : 'REQUEST')

  const html = `<div style="background:#fffaec;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#222">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f5f0e1">
    <div style="background:#f47522;color:#fff;padding:20px 24px;font-size:22px;font-weight:bold">Manas Learning</div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;color:#76310a">${cancelled ? 'Your consultation was cancelled' : 'Your consultation is confirmed'}</h2>
      <p>Hi ${h(b.parentName)},</p>
      <table style="width:100%;background:#fdf8ee;border-radius:12px;padding:12px;font-size:14px">
        <tr><td style="color:#96654a">Session</td><td><b>${h(t.title)}</b></td></tr>
        <tr><td style="color:#96654a">With</td><td>${h(s.name)}${s.role ? ', ' + h(s.role) : ''}</td></tr>
        <tr><td style="color:#96654a">When</td><td>${date}, ${time} IST (${t.durationMins} min)</td></tr>
        ${!cancelled && url ? `<tr><td style="color:#96654a">Join</td><td><a href="${h(url)}" style="color:#f47522">${h(url)}</a></td></tr>` : ''}
      </table>
      <p style="font-size:13px;color:#96654a">${cancelled ? 'The event has been removed from your calendar. You can book a new time any time.' : 'A calendar invite is attached. Accept it to add this to your calendar. Please join a couple of minutes early.'}</p>
    </div>
  </div></div>`

  const to = [b.email, s.email]
  const from = process.env.MAIL_FROM || 'Manas Learning <no-reply@manaslearning.com>'

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587)
    const tr = nodemailer.createTransport({host: process.env.SMTP_HOST, port, secure: port === 465, auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}})
    for (const addr of to) await tr.sendMail({from, to: addr, subject, html, icalEvent: {method: cancelled ? 'CANCEL' : 'REQUEST', content: ics}})
  } else {
    const dir = path.join(process.cwd(), 'data', 'outbox')
    fs.mkdirSync(dir, {recursive: true})
    const base = path.join(dir, `${Date.now()}-${kind}-${b.id.slice(-13)}`)
    fs.writeFileSync(base + '.html', `<!-- To: ${to.join(', ')} | Subject: ${subject} -->\n${html}`)
    fs.writeFileSync(base + '.ics', ics)
    console.log(`[mail] SMTP not configured. Wrote ${base}.html and .ics (to: ${to.join(', ')})`)
  }
}

export async function sendConfirmLink(b: Booking, t: ConsultType, link: string) {
  const ms = Date.parse(b.startAt) + 19800000
  const date = new Date(ms).toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'})
  const time = new Date(ms).toISOString().slice(11, 16)
  const subject = `Please confirm your ${t.title} on ${date}`
  const html = `<div style="background:#fffaec;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#222">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f5f0e1">
    <div style="background:#f47522;color:#fff;padding:20px 24px;font-size:22px;font-weight:bold">Manas Learning</div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;color:#76310a">One more step</h2>
      <p>Hi ${h(b.parentName)}, please confirm your email to lock in this time:</p>
      <p style="background:#fdf8ee;border-radius:12px;padding:12px"><b>${h(t.title)}</b><br>${date}, ${time} IST (${t.durationMins} min)</p>
      <p style="text-align:center;margin:28px 0"><a href="${h(link)}" style="display:inline-block;background:#f47522;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold">Confirm my booking</a></p>
      <p style="font-size:13px;color:#96654a">We are holding this time for 15 minutes. If you didn’t request it, ignore this email and nothing will be booked.</p>
    </div>
  </div></div>`
  const from = process.env.MAIL_FROM || 'Manas Learning <no-reply@manaslearning.com>'

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587)
    const tr = nodemailer.createTransport({host: process.env.SMTP_HOST, port, secure: port === 465, auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}})
    await tr.sendMail({from, to: b.email, subject, html})
  } else {
    const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'outbox')
    fs.mkdirSync(dir, {recursive: true})
    const file = path.join(dir, `${Date.now()}-confirm-link.html`)
    fs.writeFileSync(file, `<!-- To: ${b.email} | Subject: ${subject} -->\n${html}`)
    console.log(`[mail] SMTP not configured. Confirm link: ${link}`)
  }
}
