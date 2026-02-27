'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiInfo, FiAlertCircle, FiX, FiStar } from 'react-icons/fi'

type SystemAlert = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'maintenance' | 'brand'
  is_active: boolean
}

export default function SystemAlertBanner() {
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Load dismissed alerts from localStorage on client-side
    const stored = localStorage.getItem('dismissed_alerts')
    if (stored) {
      try {
        setDismissedAlerts(JSON.parse(stored))
      } catch (e) {
        console.error('Could not parse dismissed alerts', e)
      }
    }
  }, [])

  const dismissAlert = (id: string) => {
    const newDismissed = [...dismissedAlerts, id]
    setDismissedAlerts(newDismissed)
    localStorage.setItem('dismissed_alerts', JSON.stringify(newDismissed))
  }

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      const { data } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('is_active', true)

      if (data) setActiveAlerts(data)
    }

    fetchActiveAlerts()

    const channel = supabase
      .channel('system-alerts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_alerts' },
        (payload) => {
          const newRow = payload.new as SystemAlert

          if (payload.eventType === 'DELETE' || !newRow.is_active) {
            const oldId = (payload.old as SystemAlert)?.id
            setActiveAlerts(prev => prev.filter(alert => alert.id !== (newRow.id || oldId)))
            return
          }

          setActiveAlerts(prev => {
            const exists = prev.find(a => a.id === newRow.id)
            if (exists) {
              return prev.map(a => a.id === newRow.id ? newRow : a)
            }
            return [...prev, newRow]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const visibleAlerts = activeAlerts.filter(alert => !dismissedAlerts.includes(alert.id))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="fixed top-0 left-0 w-full z-[100] flex flex-col gap-1 p-2 pointer-events-none">
      {visibleAlerts.map(alert => (
        <div 
          key={alert.id}
          className={`relative flex items-center justify-center p-3 rounded-md shadow-md text-sm font-medium pointer-events-auto pr-10
            ${alert.type === 'maintenance' ? 'bg-orange-500 text-white' : ''}
            ${alert.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${alert.type === 'info' ? 'bg-blue-500 text-white' : ''}
            ${alert.type === 'warning' ? 'bg-yellow-500 text-black' : ''}
            ${alert.type === 'brand' ? 'bg-brand text-white' : ''}
          `}
        >
          {alert.type === 'info' ? <FiInfo className="w-5 h-5 mr-2 shrink-0" /> : alert.type === 'brand' ? <FiStar className="w-5 h-5 mr-2 shrink-0" /> : <FiAlertCircle className="w-5 h-5 mr-2 shrink-0" />}
          <span className="text-center">
            <strong>{alert.title}:</strong> {alert.message}
          </span>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Bildirişi bağla"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
