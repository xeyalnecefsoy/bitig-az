"use client"

import { Toaster, toast, resolveValue } from 'react-hot-toast'
import { Alert } from '@/components/ui/Alert'

export function CustomToaster() {
  return (
    <Toaster 
      position="top-center"
      containerStyle={{ zIndex: 99999 }}
    >
      {(t) => (
        <div
          className="mt-4 sm:mt-8 w-full flex justify-center px-4 sm:px-0"
          style={{
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0)' : 'translateY(-1rem)',
            transition: 'all 0.2s ease-in-out',
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <div className="w-full shadow-xl rounded-xl">
            <Alert 
              type={t.type === 'error' ? 'error' : t.type === 'success' ? 'success' : 'info'}
              message={resolveValue(t.message, t)}
              onClose={() => toast.dismiss(t.id)}
            />
          </div>
        </div>
      )}
    </Toaster>
  )
}
