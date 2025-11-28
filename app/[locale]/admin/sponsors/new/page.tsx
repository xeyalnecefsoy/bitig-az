"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { FiSave, FiX, FiUpload, FiInfo, FiHome, FiBook, FiMessageSquare, FiSidebar, FiCalendar, FiClock } from 'react-icons/fi'
import Link from 'next/link'

export default function NewSponsorPage() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    banner_url: '',
    link_url: '',
    placement: 'homepage',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'
  const supabase = createClient()

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      setError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validate image
      if (!imageFile && !form.banner_url) {
        throw new Error('Please upload an image or provide an image URL')
      }

      let bannerUrl = form.banner_url

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `sponsor-${Date.now()}.${fileExt}`
        const filePath = `sponsors/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('audiobook-covers')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('audiobook-covers')
          .getPublicUrl(filePath)

        bannerUrl = publicUrl
      }

      // Combine date and time
      let startDateTime = null
      let endDateTime = null

      if (form.start_date) {
        const time = form.start_time || '00:00'
        startDateTime = `${form.start_date}T${time}:00`
      }

      if (form.end_date) {
        const time = form.end_time || '23:59'
        endDateTime = `${form.end_date}T${time}:00`
      }

      const { error: insertError } = await supabase.from('sponsors').insert({
        name: form.name,
        company: form.company,
        banner_url: bannerUrl,
        link_url: form.link_url,
        placement: form.placement,
        position: 0,
        start_date: startDateTime,
        end_date: endDateTime,
        active: true,
      })

      if (insertError) throw insertError

      router.push(`/${locale}/admin/sponsors` as any)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create sponsor')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Add New Sponsor</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Create a new advertising campaign</p>
        </div>
        <Link href={`/${locale}/admin/sponsors` as any} className="btn btn-outline gap-2">
          <FiX /> Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Basic Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-brand/50 focus:border-brand"
                placeholder="Summer Sale 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-brand/50 focus:border-brand"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Destination URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-brand/50 focus:border-brand"
              placeholder="https://example.com/product"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Where users will go when they click the ad
            </p>
          </div>
        </div>

        {/* Banner Image */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Banner Image</h2>
          
          {imagePreview && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Preview:</p>
              <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-lg border-2 border-neutral-200 dark:border-neutral-700" />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="btn btn-primary gap-2 cursor-pointer">
              <FiUpload /> Choose Image
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </label>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 self-center">or</span>
            <input
              type="url"
              placeholder="Paste image URL"
              value={form.banner_url}
              onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
              className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2">
            <FiInfo className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Recommended sizes:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Homepage: 1200×200 pixels</li>
                <li>Audiobooks/Social: 400×225 pixels</li>
              </ul>
              <p className="mt-1">Max file size: 5MB (JPEG, PNG, WebP)</p>
            </div>
          </div>
        </div>

        {/* Placement */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Ad Placement</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'homepage', icon: FiHome, label: 'Homepage', desc: 'Large banner below hero' },
              { value: 'audiobooks', icon: FiBook, label: 'Audiobooks', desc: 'Between book cards' },
              { value: 'social', icon: FiMessageSquare, label: 'Social Feed', desc: 'Between posts' },
              { value: 'sidebar', icon: FiSidebar, label: 'Sidebar', desc: 'Desktop only' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm({ ...form, placement: option.value })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  form.placement === option.value
                    ? 'border-brand bg-brand/5'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-brand/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <option.icon className="text-brand" size={18} />
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{option.label}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Schedule (Optional)</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Leave empty to start immediately and run indefinitely</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date/Time */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <FiCalendar className="inline mr-1" /> Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                min={today}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
              {form.start_date && (
                <>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <FiClock className="inline mr-1" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </>
              )}
            </div>

            {/* End Date/Time */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <FiCalendar className="inline mr-1" /> End Date
              </label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || today}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
              {form.end_date && (
                <>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <FiClock className="inline mr-1" /> End Time
                  </label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button 
            type="submit" 
            disabled={saving} 
            className="btn btn-primary gap-2 flex-1 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave /> {saving ? 'Creating...' : 'Create Sponsor'}
          </button>
          <Link href={`/${locale}/admin/sponsors` as any} className="btn btn-outline py-3">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
