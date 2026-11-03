'use client'
const KEY = 'ml_parent'
export const getParentToken = () => (typeof window === 'undefined' ? '' : window.localStorage.getItem(KEY) || '')
export const setParentToken = (t: string) => window.localStorage.setItem(KEY, t)
export const clearParentToken = () => window.localStorage.removeItem(KEY)
/** fetch with the parent session attached. */
export const parentFetch = (url: string, init: RequestInit = {}) =>
  fetch(url, {...init, headers: {...(init.headers || {}), 'x-parent-key': getParentToken()}})
