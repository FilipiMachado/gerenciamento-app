'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // First, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister())
      })

      // Temporarily disabled to fix Supabase issues
      // Will be re-enabled with proper configuration
      console.log('Service Worker temporarily disabled')
    }
  }, [])

  return null
}
