'use client'
import {useEffect, useState} from 'react'

export function Year() {
  const [year, setYear] = useState(2026)
  useEffect(() => { setYear(new Date().getFullYear()) }, [])
  return <>{year}</>
}
