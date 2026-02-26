"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiTrendingUp } from 'react-icons/fi'
import Link from 'next/link'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const locale = useLocale()
  const supabase = createClient()

  useEffect(() => {
    loadSponsors()
  }, [])

  async function loadSponsors() {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false })
    
    setSponsors(data || [])
    setLoading(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase
      .from('sponsors')
      .update({ active: !active })
      .eq('id', id)
    
    loadSponsors()
  }

  async function deleteSponsor(id: string) {
    if (!confirm(t(locale, 'admin_delete_sponsor_confirm'))) return
    
    const { error } = await supabase.from('sponsors').delete().eq('id', id)
    
    if (error) {
      alert(t(locale, 'admin_sponsor_error') + ': ' + error.message)
    } else {
      loadSponsors()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  const totalImpressions = sponsors.reduce((sum, s) => sum + (s.impressions || 0), 0)
  const totalClicks = sponsors.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_sponsors')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t(locale, 'admin_sponsors_desc')}
          </p>
        </div>
        <Link href={`/${locale}/admin/sponsors/new` as any} className="btn btn-primary gap-2">
          <FiPlus /> {t(locale, 'admin_add_sponsor')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t(locale, 'admin_total_sponsors')}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{sponsors.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t(locale, 'admin_active_sponsors')}</p>
          <p className="text-2xl font-bold text-green-600">{sponsors.filter(s => s.active).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t(locale, 'admin_total_impressions')}</p>
          <p className="text-2xl font-bold text-blue-600">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t(locale, 'admin_click_rate')}</p>
          <p className="text-2xl font-bold text-brand">{avgCTR}%</p>
        </div>
      </div>

      {/* Sponsors Table */}
      <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t(locale, 'admin_sponsor_col')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t(locale, 'admin_placement_col')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t(locale, 'admin_performance_col')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t(locale, 'admin_status_col')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t(locale, 'admin_actions_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {sponsors.map((sponsor) => {
                const ctr = sponsor.impressions > 0 
                  ? ((sponsor.clicks / sponsor.impressions) * 100).toFixed(1) 
                  : '0.0'
                
                return (
                  <tr key={sponsor.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={sponsor.banner_url} 
                          alt="" 
                          className="h-12 w-20 object-cover rounded border border-neutral-200 dark:border-neutral-700" 
                        />
                        <div>
                          <p className="font-medium text-sm text-neutral-900 dark:text-white">{sponsor.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{sponsor.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {sponsor.placement}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <FiEye size={12} className="text-neutral-400" />
                          <span>{sponsor.impressions || 0} {t(locale, 'admin_sponsor_views')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiTrendingUp size={12} className="text-neutral-400" />
                          <span>{sponsor.clicks || 0} {t(locale, 'admin_sponsor_clicks')} ({ctr}%)</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(sponsor.id, sponsor.active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          sponsor.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {sponsor.active ? `● ${t(locale, 'admin_sponsor_active')}` : `○ ${t(locale, 'admin_sponsor_inactive')}`}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/${locale}/admin/sponsors/${sponsor.id}` as any} 
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title={t(locale, 'admin_edit')}
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => deleteSponsor(sponsor.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={t(locale, 'delete')}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <img src={sponsor.banner_url} alt="" className="h-16 w-24 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-neutral-900 dark:text-white">{sponsor.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{sponsor.company}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800">
                    {sponsor.placement}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                <span>👁️ {sponsor.impressions || 0}</span>
                <span>🖱️ {sponsor.clicks || 0}</span>
                <button
                  onClick={() => toggleActive(sponsor.id, sponsor.active)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    sponsor.active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {sponsor.active ? t(locale, 'admin_sponsor_active') : t(locale, 'admin_sponsor_inactive')}
                </button>
              </div>
              <div className="flex gap-2">
                <Link href={`/${locale}/admin/sponsors/${sponsor.id}` as any} className="btn btn-outline flex-1 text-sm py-2">
                  <FiEdit2 /> {t(locale, 'admin_edit')}
                </Link>
                <button onClick={() => deleteSponsor(sponsor.id)} className="btn btn-outline text-red-600 flex-1 text-sm py-2">
                  <FiTrash2 /> {t(locale, 'delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {sponsors.length === 0 && (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
            <p className="mb-4">{t(locale, 'admin_no_sponsors')}</p>
            <Link href={`/${locale}/admin/sponsors/new` as any} className="btn btn-primary gap-2">
              <FiPlus /> {t(locale, 'admin_add_first_sponsor')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
