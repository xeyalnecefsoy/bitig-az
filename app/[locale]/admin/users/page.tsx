"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiSearch, FiUser, FiShield, FiTrash2 } from 'react-icons/fi'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'

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
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'coadmin' | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const pathname = usePathname()
  const locale = (pathname.split('/')[1] || 'en') as Locale
  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
    loadUsers()
  }, [])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setCurrentUserRole(profile.role as 'admin' | 'coadmin')
        setCurrentUserId(user.id)
      }
    }
  }

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
    // Security checks
    if (userId === currentUserId) {
      alert('You cannot change your own role!')
      return
    }

    const targetUser = users.find(u => u.id === userId)
    
    // Co-admins cannot promote to admin or demote admins
    if (currentUserRole === 'coadmin') {
      if (newRole === 'admin') {
        alert('Co-admins cannot promote users to admin role!')
        return
      }
      if (targetUser?.role === 'admin') {
        alert('Co-admins cannot change admin roles!')
        return
      }
    }

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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_users')}</h1>
        <div className="relative w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t(locale, 'admin_search_users')}
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
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_user')}</th>
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_role')}</th>
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_joined')}</th>
                <th className="px-6 py-3 font-medium text-right">{t(locale, 'admin_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">{t(locale, 'admin_loading')}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">{t(locale, 'admin_no_users')}</td>
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
                        disabled={user.id === currentUserId}
                        className={`font-sans rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 py-1.5 pl-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.role === 'admin' ? 'text-purple-600 dark:text-purple-400' :
                          user.role === 'coadmin' ? 'text-blue-600 dark:text-blue-400' :
                          'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <option value="user" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">{t(locale, 'admin_role_user')}</option>
                        <option value="coadmin" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">{t(locale, 'admin_role_coadmin')}</option>
                        <option 
                          value="admin" 
                          disabled={currentUserRole === 'coadmin'}
                          className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t(locale, 'admin_role_admin')} {currentUserRole === 'coadmin' ? '(Admin only)' : ''}
                        </option>
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
