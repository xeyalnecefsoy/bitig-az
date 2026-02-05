"use client"
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AvatarDebug() {
  const [username, setUsername] = useState('khayalnajafov')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  async function checkUser() {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      console.log('Checking user:', username)
      
      // 1. Get Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
        
      if (profileError) throw new Error(`Profile error: ${profileError.message} (${profileError.code})`)
      if (!profile) throw new Error('Profile not found')

      // 2. Check Avatar URL Reachability
      let status = 'Not Checked'
      let headers = {}
      if (profile.avatar_url) {
        try {
           const res = await fetch(profile.avatar_url, { method: 'HEAD' })
           status = `${res.status} ${res.statusText}`
           headers = Object.fromEntries(res.headers.entries())
        } catch (e: any) {
           status = `Fetch Error: ${e.message}`
        }
      }

      setResult({
        profile,
        avatarStatus: status,
        avatarHeaders: headers,
        timestamp: new Date().toISOString()
      })

    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Avatar Debugger</h1>
      
      <div className="flex gap-2">
        <input 
          value={username} 
          onChange={e => setUsername(e.target.value)}
          className="border p-2 rounded flex-1 dark:bg-gray-800"
          placeholder="Enter username"
        />
        <button 
          onClick={checkUser}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded border border-red-200">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border space-y-2">
            <h3 className="font-semibold">Profile Data</h3>
            <pre className="text-xs overflow-auto max-h-60">
              {JSON.stringify(result.profile, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border space-y-4">
            <h3 className="font-semibold">Avatar Analysis</h3>
            <div>
              <p className="font-medium">URL:</p>
              <a href={result.profile.avatar_url} target="_blank" className="text-blue-500 text-sm break-all hover:underline">
                {result.profile.avatar_url}
              </a>
            </div>
            
            <div>
              <p className="font-medium">HTTP Status:</p>
               <span className={`inline-block px-2 py-1 rounded text-sm ${result.avatarStatus.startsWith('200') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {result.avatarStatus}
              </span>
            </div>

            {result.profile.avatar_url && (
              <div>
                <p className="font-medium mb-2">Preview:</p>
                <img 
                  src={result.profile.avatar_url} 
                  alt="Avatar Debug" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-dashed border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.border = '2px solid red'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
