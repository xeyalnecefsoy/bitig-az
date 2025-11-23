"use client"
import { useState } from 'react'
import { useSocial } from '@/context/social'
import { FiSend } from 'react-icons/fi'

export function SocialComposer() {
  const { createPost, currentUser } = useSocial()
  const [value, setValue] = useState('')

  if (!currentUser) {
    return (
      <div className="card p-4 sm:p-5 text-center">
        <p className="text-sm text-neutral-600 mb-3">Sign in to share your thoughts</p>
        <a href="/login" className="btn btn-primary text-sm">Sign in</a>
      </div>
    )
  }

  return (
    <form
      className="card p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault()
        const text = value.trim()
        if (!text) return
        createPost(text)
        setValue('')
      }}
    >
      <label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">Share what you're listening to</label>
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a post..."
          rows={3}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm resize-none bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 placeholder-neutral-400 dark:placeholder-neutral-400"
        />
        <button className="btn btn-primary h-fit px-4 text-sm inline-flex items-center gap-2"><FiSend /> Post</button>
      </div>
    </form>
  )
}
