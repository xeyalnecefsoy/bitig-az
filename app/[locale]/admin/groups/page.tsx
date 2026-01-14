"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Group } from '@/lib/social'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUsers, FiMessageCircle } from 'react-icons/fi'

export default function AdminGroupsPage() {
  const supabase = createClient()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_official: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  async function fetchGroups() {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Groups fetch error:', error)
        setError(`Xəta: ${error.message}`)
        setGroups([])
      } else {
        setGroups(data || [])
      }
    } catch (err: any) {
      console.error('Groups fetch exception:', err)
      setError(`Xəta: ${err.message || 'Bilinməyən xəta'}`)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreateModal = () => {
    setEditingGroup(null)
    setFormData({ name: '', slug: '', description: '', is_official: true })
    setShowModal(true)
  }

  const openEditModal = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      slug: group.slug,
      description: group.description || '',
      is_official: group.is_official,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    if (editingGroup) {
      // Update
      const { error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          slug: slug,
          description: formData.description,
          is_official: formData.is_official,
        })
        .eq('id', editingGroup.id)

      if (!error) {
        setShowModal(false)
        fetchGroups()
      }
    } else {
      // Create
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          slug: slug,
          description: formData.description,
          is_official: formData.is_official,
          created_by: user?.id,
        })

      if (!error) {
        setShowModal(false)
        fetchGroups()
      }
    }

    setSaving(false)
  }

  const handleDelete = async (group: Group) => {
    if (!confirm(`"${group.name}" qrupunu silmək istədiyinizə əminsiniz?`)) return

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', group.id)

    if (!error) {
      fetchGroups()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">İcmalar</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Qrupları yaradın, redaktə edin və idarə edin
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          Yeni Qrup
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Qrup axtar..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm"
        />
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
            <button
              onClick={fetchGroups}
              className="btn btn-outline text-sm"
            >
              Yenidən cəhd et
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Qrup</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Slug</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Üzvlər</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Postlar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Rəsmi</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900 dark:text-white">{group.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{group.description}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                      {group.slug}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <FiUsers size={14} />
                        {group.members_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <FiMessageCircle size={14} />
                        {group.posts_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {group.is_official ? (
                        <span className="inline-block px-2 py-0.5 bg-brand/10 text-brand text-xs font-medium rounded-full">Rəsmi</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs rounded-full">Xüsusi</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(group)}
                          className="p-2 text-neutral-500 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Redaktə et"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(group)}
                          className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            {searchQuery ? 'Axtarışınıza uyğun qrup tapılmadı.' : 'Hələ heç bir qrup yoxdur.'}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {editingGroup ? 'Qrupu Redaktə Et' : 'Yeni Qrup Yarat'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Qrup adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                  placeholder="Fəlsəfə Dünyası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 font-mono text-sm"
                  placeholder="felsefe (avtomatik yaradılacaq)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Təsvir
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
                  placeholder="Qrup haqqında qısa məlumat..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_official"
                  checked={formData.is_official}
                  onChange={(e) => setFormData({ ...formData, is_official: e.target.checked })}
                  className="w-4 h-4 text-brand border-neutral-300 rounded focus:ring-brand"
                />
                <label htmlFor="is_official" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Rəsmi qrup (Bitig tərəfindən idarə olunur)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saxlanılır...' : editingGroup ? 'Yadda saxla' : 'Yarat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
