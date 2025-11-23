"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiSearch, FiUser, FiShield, FiTrash2 } from 'react-icons/fi'

type Profile = {
  id: string
  username: string
  avatar_url: string
  role: 'user' | 'coadmin' | 'admin'
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setUsers(data as any)
    }
    setLoading(false)
  }

  async function updateRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Failed to update role: ' + error.message)
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u))
    }
  }

  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Users</h1>
        <div className="relative w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {user.username || 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className={`rounded-md border-0 bg-transparent py-1 pl-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand ${
                          user.role === 'admin' ? 'text-purple-600' :
                          user.role === 'coadmin' ? 'text-blue-600' :
                          'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="coadmin">Co-Admin</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {new Date(user.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-neutral-400 hover:text-red-600 transition-colors">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
