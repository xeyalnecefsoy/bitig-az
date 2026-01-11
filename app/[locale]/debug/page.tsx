"use client"
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [env, setEnv] = useState<string>('')
  const router = useRouter() // router used for refresh
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      try {
        setEnv(process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        setSession(session)

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(user)

      } catch (err: any) {
        setError(err.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  return (
    <div className="p-10 font-mono text-sm break-all space-y-4">
      <h1 className="text-xl font-bold">Debug Info</h1>
      
      <div className="border p-4 rounded bg-gray-100 dark:bg-gray-800">
        <h2 className="font-bold">Environment</h2>
        <p>URL: {env}</p>
      </div>

      <div className="border p-4 rounded bg-gray-100 dark:bg-gray-800">
        <h2 className="font-bold">Auth State</h2>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <>
                <p>Status: {session ? 'LOGGED IN' : 'LOGGED OUT'}</p>
                <p className={error ? 'text-red-500' : 'text-green-500'}>
                    Error: {error || 'None'}
                </p>
            </>
        )}
      </div>

      <div className="border p-4 rounded bg-gray-100 dark:bg-gray-800">
        <h2 className="font-bold">Details</h2>
        <pre>{JSON.stringify({ session: session ? 'PRESENT' : 'NULL', user: user?.email }, null, 2)}</pre>
      </div>
      
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded">
        Force Refresh
      </button>

      <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="px-4 py-2 bg-red-500 text-white rounded ml-2">
        Force Sign Out
      </button>

      <div className="text-xs text-gray-500 mt-10">
        Time: {new Date().toISOString()}
      </div>
    </div>
  )
}
