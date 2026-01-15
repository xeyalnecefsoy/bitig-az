"use client"
import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Base Skeleton component - reusable loading placeholder
 */
export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-800'
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-md'
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div 
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

/**
 * Skeleton for BookCard component
 */
export function BookCardSkeleton() {
  return (
    <div className="group relative flex flex-col gap-2">
      {/* Book Cover */}
      <div className="aspect-[2/3] w-full overflow-hidden rounded-md">
        <Skeleton className="h-full w-full" />
      </div>
      {/* Book Info */}
      <div className="p-3 sm:p-4">
        {/* Title */}
        <Skeleton className="h-5 w-3/4 mb-2" />
        {/* Author */}
        <Skeleton className="h-4 w-1/2 mb-3" />
        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        {/* Button */}
        <Skeleton className="h-10 w-full mt-3 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Skeleton for a grid of BookCards
 */
export function BookGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for Profile Page
 */
export function ProfileSkeleton() {
  return (
    <section className="container-max py-6 sm:py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Posts Section */}
      <div className="space-y-4 sm:space-y-5">
        <Skeleton className="h-7 w-40 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Sidebar */}
      <aside className="space-y-4 order-first lg:order-last">
        <div className="card p-5 space-y-4">
          {/* Avatar and Info */}
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          
          {/* Social Stats */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
          
          {/* Buttons */}
          <div className="mt-4 space-y-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        </div>
      </aside>
    </section>
  )
}

/**
 * Skeleton for SocialPostCard
 */
export function PostCardSkeleton() {
  return (
    <div className="card p-4 sm:p-5 space-y-4">
      {/* Header - Avatar and User Info */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Skeleton for Social Feed
 */
export function SocialFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Title */}
      <Skeleton className="h-8 w-32 mb-6" />
      
      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Composer */}
      <Skeleton className="h-32 rounded-xl mb-4" />
      
      {/* Posts */}
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for Audiobook Detail Page
 */
export function AudiobookDetailSkeleton() {
  return (
    <section className="container-max py-10">
      <div className="grid gap-8 md:grid-cols-[300px_1fr] lg:gap-12">
        {/* Cover Image */}
        <Skeleton className="aspect-[2/3] w-full rounded-xl" />
        
        {/* Details */}
        <div className="space-y-4">
          {/* Genre Badge */}
          <Skeleton className="h-5 w-20" />
          {/* Title */}
          <Skeleton className="h-10 w-3/4" />
          {/* Author */}
          <Skeleton className="h-6 w-40" />
          
          {/* Rating and Length */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          
          {/* Price */}
          <Skeleton className="h-8 w-24" />
          
          {/* Player Skeleton */}
          <Skeleton className="h-20 rounded-xl" />
          
          {/* Description */}
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Skeleton for Navbar notifications
 */
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton variant="circular" className="h-8 w-8" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

/**
 * Skeleton for Hero Carousel
 */
export function HeroCarouselSkeleton() {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden">
      <Skeleton className="h-full w-full" animation="wave" />
    </div>
  )
}

/**
 * Skeleton for User Card (in lists, hover cards, etc.)
 */
export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  )
}

/**
 * Full page loading skeleton with optional message
 */
export function PageLoadingSkeleton({ message }: { message?: string }) {
  return (
    <section className="container-max py-12 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Skeleton variant="circular" className="h-16 w-16" animation="wave" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      </div>
      {message && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
          {message}
        </p>
      )}
    </section>
  )
}
