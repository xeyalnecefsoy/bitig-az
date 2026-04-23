import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Linking,
  Modal,
  ScrollView,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Typography } from '@/components/ui/Typography'
import { AppHeader } from '@/components/AppHeader'
import { LibraryContent } from '@/components/LibraryContent'
import { Feather } from '@expo/vector-icons'
import { useLocale } from '@/context/locale'
import { DEFAULT_GENRES_AZ, translateGenre } from '@bitig/i18n'

const BITIG_BASE_URL = 'https://bitig.az'

function resolveCover(cover?: string | null, coverUrl?: string | null) {
  const src = cover || coverUrl
  if (!src) return `${BITIG_BASE_URL}/logo.png`
  if (src.startsWith('http')) return src
  return `${BITIG_BASE_URL}${src}`
}

function getDiscoverGridLayout(width: number) {
  const paddingHoriz = Spacing.lg
  const gap = Spacing.md
  const usable = width - paddingHoriz * 2
  let numColumns = 2
  if (width >= 900) numColumns = 4
  else if (width >= 600) numColumns = 3
  const cardWidth = (usable - gap * (numColumns - 1)) / numColumns
  return { numColumns, cardWidth, gap, paddingHoriz }
}

function voiceTypeToI18nKey(voiceType: string | null | undefined): string {
  if (voiceType === 'multiple') return 'voice_multiple'
  if (voiceType === 'radio_theater') return 'voice_radio_theater'
  return 'voice_single'
}

interface Book {
  id: string
  title: string
  author: string
  cover: string | null
  cover_url?: string | null
  genre: string | null
  price: number
  length?: string | null
  rating?: number | null
  voice_type?: string | null
  has_ambience?: boolean | null
  has_sound_effects?: boolean | null
  created_at?: string | null
}

function getBookDurationMinutes(book: Book) {
  if (book.length) {
    const hMatch = book.length.match(/(\d+)\s*[hs]/i)
    const mMatch = book.length.match(/(\d+)\s*[md]/i)
    let totalMinutes = 0
    if (hMatch) totalMinutes += Number.parseInt(hMatch[1], 10) * 60
    if (mMatch) totalMinutes += Number.parseInt(mMatch[1], 10)
    return totalMinutes
  }
  return 0
}

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedVoiceType, setSelectedVoiceType] = useState<string | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<'free' | 'paid' | null>(null)
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long' | null>(null)
  const [hasAmbience, setHasAmbience] = useState(false)
  const [hasSoundEffects, setHasSoundEffects] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'a-z' | 'z-a'>('newest')
  const [expandedSection, setExpandedSection] = useState<
    'genre' | 'voice' | 'price' | 'length' | 'atmosphere' | 'sort' | null
  >('genre')
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [activeTab, setActiveTab] = useState<'discover' | 'library'>('discover')
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()
  const { t, locale } = useLocale()
  const { width } = useWindowDimensions()
  const { numColumns, cardWidth, gap, paddingHoriz } = useMemo(
    () => getDiscoverGridLayout(width),
    [width]
  )

  useEffect(() => {
    loadBooks()
  }, [])

  useEffect(() => {
    if (!showFilters) setShowAllGenres(false)
  }, [showFilters])

  async function loadBooks() {
    const { data, error } = await supabase
      .from('books')
      .select(
        'id, title, author, cover, cover_url, genre, price, length, rating, voice_type, has_ambience, has_sound_effects, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Kitablar] loadBooks error:', error.message)
      setBooks([])
    } else if (data && Array.isArray(data)) {
      setBooks(data as Book[])
    } else {
      setBooks([])
    }
    setLoading(false)
  }

  const availableGenres = useMemo(
    () => [...DEFAULT_GENRES_AZ].sort((a, b) => translateGenre(locale, a).localeCompare(translateGenre(locale, b), 'az')),
    [locale]
  )
  const visibleGenres = useMemo(
    () => (showAllGenres ? availableGenres : availableGenres.slice(0, 8)),
    [availableGenres, showAllGenres]
  )

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedGenre) count += 1
    if (selectedVoiceType) count += 1
    if (selectedPrice) count += 1
    if (selectedLength) count += 1
    if (hasAmbience) count += 1
    if (hasSoundEffects) count += 1
    if (sortBy !== 'newest') count += 1
    return count
  }, [selectedGenre, selectedVoiceType, selectedPrice, selectedLength, hasAmbience, hasSoundEffects, sortBy])

  const filteredBooks = useMemo(() => {
    let next = books

    if (search) {
      const q = search.toLowerCase()
      next = next.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.genre && b.genre.toLowerCase().includes(q))
      )
    }

    if (selectedGenre) {
      next = next.filter((b) => b.genre === selectedGenre)
    }

    if (selectedVoiceType) {
      next = next.filter((b) => b.voice_type === selectedVoiceType)
    }

    if (selectedPrice === 'free') {
      next = next.filter((b) => Number(b.price) === 0)
    } else if (selectedPrice === 'paid') {
      next = next.filter((b) => Number(b.price) > 0)
    }

    if (selectedLength) {
      next = next.filter((b) => {
        const mins = getBookDurationMinutes(b)
        if (mins <= 0) return false
        if (selectedLength === 'short') return mins < 180
        if (selectedLength === 'medium') return mins >= 180 && mins <= 600
        return mins > 600
      })
    }

    if (hasAmbience) {
      next = next.filter((b) => b.has_ambience === true)
    }

    if (hasSoundEffects) {
      next = next.filter((b) => b.has_sound_effects === true)
    }

    if (sortBy === 'popular') {
      next = [...next].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
    } else if (sortBy === 'a-z') {
      next = [...next].sort((a, b) => a.title.localeCompare(b.title, 'az'))
    } else if (sortBy === 'z-a') {
      next = [...next].sort((a, b) => b.title.localeCompare(a.title, 'az'))
    } else if (sortBy === 'newest') {
      next = [...next].sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0
        const tb = b.created_at ? Date.parse(b.created_at) : 0
        return tb - ta
      })
    }

    return next
  }, [
    books,
    search,
    selectedGenre,
    selectedVoiceType,
    selectedPrice,
    selectedLength,
    hasAmbience,
    hasSoundEffects,
    sortBy,
  ])

  const voiceLabel = (voiceType: string | null | undefined) => t(voiceTypeToI18nKey(voiceType))
  const toggleVoiceType = (value: string) => {
    setSelectedVoiceType((prev) => (prev === value ? null : value))
  }
  const togglePrice = (value: 'free' | 'paid') => {
    setSelectedPrice((prev) => (prev === value ? null : value))
  }
  const toggleSection = (section: 'genre' | 'voice' | 'price' | 'length' | 'atmosphere' | 'sort') => {
    setExpandedSection((prev) => (prev === section ? null : section))
  }
  const sectionBadge = {
    genre: selectedGenre ? 1 : 0,
    voice: selectedVoiceType ? 1 : 0,
    price: selectedPrice ? 1 : 0,
    length: selectedLength ? 1 : 0,
    atmosphere: (hasAmbience ? 1 : 0) + (hasSoundEffects ? 1 : 0),
    sort: sortBy !== 'newest' ? 1 : 0,
  }

  if (activeTab === 'library') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader />
        <View style={[styles.section, { paddingHorizontal: paddingHoriz }]}>
          <Typography weight="bold" style={[styles.pageTitle, { color: colors.text }]}>
            {t('nav_audiobooks')}
          </Typography>
          <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
            <Pressable style={styles.tab} onPress={() => setActiveTab('discover')}>
              <Feather name="search" size={16} color={colors.textSecondary} />
              <Typography weight="semibold" style={[styles.tabLabel, { color: colors.textSecondary }]}>
                {t('nav_discover')}
              </Typography>
            </Pressable>
            <Pressable
              style={[styles.tab, { backgroundColor: colors.surfaceHover }]}
              onPress={() => setActiveTab('library')}
            >
              <Feather name="book" size={16} color={Colors.brand} />
              <Typography weight="semibold" style={[styles.tabLabel, { color: Colors.brand }]}>
                {t('nav_library')}
              </Typography>
            </Pressable>
          </View>
        </View>
        <View style={styles.libraryWrap}>
          <LibraryContent />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      <View style={[styles.section, { paddingHorizontal: paddingHoriz }]}>
        <Typography weight="bold" style={[styles.pageTitle, { color: colors.text }]}>
          {t('nav_audiobooks')}
        </Typography>
        <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
          <Pressable
            style={[styles.tab, { backgroundColor: colors.surfaceHover }]}
            onPress={() => setActiveTab('discover')}
          >
            <Feather name="search" size={16} color={Colors.brand} />
            <Typography weight="semibold" style={[styles.tabLabel, { color: Colors.brand }]}>
              {t('nav_discover')}
            </Typography>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => setActiveTab('library')}>
            <Feather name="book" size={16} color={colors.textSecondary} />
            <Typography weight="semibold" style={[styles.tabLabel, { color: colors.textSecondary }]}>
              {t('nav_library')}
            </Typography>
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Input
            leftIcon="search"
            rightIcon="sliders"
            onRightIconPress={() => setShowFilters(true)}
            placeholder={t('search_placeholder')}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ height: 48 }}
          />
        </View>
        {activeFilterCount > 0 ? (
          <Typography style={[styles.filterHint, { color: Colors.brand }]}>
            {activeFilterCount} {t('filters_active_suffix')}
          </Typography>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          key={`discover-${numColumns}`}
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          style={styles.list}
          columnWrapperStyle={[styles.columnWrapper, { marginHorizontal: paddingHoriz, gap }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={numColumns}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.bookCard, { width: cardWidth }]}
              onPress={() => router.push(`/book/${item.id}` as any)}
            >
              <Image
                source={resolveCover(item.cover, item.cover_url)}
                style={[styles.cover, { width: cardWidth, height: cardWidth * 1.5 }]}
                contentFit="cover"
                transition={200}
              />
              <Typography
                weight="bold"
                style={[styles.bookTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.title}
              </Typography>
              <Typography
                style={[styles.bookAuthor, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.author}
              </Typography>
              <View style={styles.metaRow}>
                <Typography
                  weight="bold"
                  style={{ color: item.price === 0 ? Colors.success : Colors.brand, fontSize: FontSize.sm }}
                >
                  {item.price === 0 ? t('free') : `${Number(item.price).toFixed(2)} ₼`}
                </Typography>
                <View style={styles.ratingRow}>
                  <Typography style={styles.star}>★</Typography>
                  <Typography
                    weight="semibold"
                    style={[styles.ratingText, { color: colors.text }]}
                  >
                    {item.rating != null ? item.rating.toFixed(1) : '—'}
                  </Typography>
                </View>
              </View>
              <View style={styles.voiceRow}>
                <View style={[styles.voiceBtn, { backgroundColor: colors.surface }]}>
                  <Feather name="mic" size={12} color={colors.textSecondary} />
                  <Typography style={[styles.voiceLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {voiceLabel(item.voice_type)}
                  </Typography>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.cartBtn, { opacity: pressed ? 0.9 : 1 }]}
                onPress={(e) => {
                  e.stopPropagation()
                  Linking.openURL(`${BITIG_BASE_URL}/${locale}/audiobooks/${item.id}`)
                }}
              >
                <Typography weight="semibold" style={styles.cartBtnLabel}>
                  {t('add_to_cart')}
                </Typography>
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typography style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search ? t('no_results') : t('mobile_no_books')}
              </Typography>
            </View>
          }
        />
      )}

      <Modal transparent visible={showFilters} animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilters(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Typography weight="bold" style={[styles.modalTitle, { color: colors.text }]}>
                {t('filters')}
              </Typography>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              <View style={[styles.filterSection, { borderColor: colors.border }]}>
                <Pressable style={styles.filterSectionHeader} onPress={() => toggleSection('genre')}>
                  <Typography weight="semibold" style={[styles.groupTitle, styles.groupTitleHeader, { color: colors.textSecondary }]}>
                    {t('filter_genre')}
                  </Typography>
                  <View style={styles.sectionRight}>
                    {sectionBadge.genre > 0 ? <View style={styles.sectionBadge}><Typography style={styles.sectionBadgeText}>{sectionBadge.genre}</Typography></View> : null}
                    <Feather name={expandedSection === 'genre' ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
                {expandedSection === 'genre' ? (
                  <View style={styles.chipWrap}>
                    <Pressable
                      style={[styles.chip, { borderColor: colors.border }, !selectedGenre && styles.chipActive]}
                      onPress={() => setSelectedGenre(null)}
                    >
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, !selectedGenre && styles.chipTextActive]}>
                        {t('all')}
                      </Typography>
                    </Pressable>
                    {visibleGenres.map((genre) => {
                      const isActive = selectedGenre === genre
                      return (
                        <Pressable
                          key={genre}
                          style={[styles.chip, { borderColor: colors.border }, isActive && styles.chipActive]}
                          onPress={() => setSelectedGenre(genre)}
                        >
                          <Typography style={[styles.chipText, { color: colors.textSecondary }, isActive && styles.chipTextActive]}>
                            {translateGenre(locale, genre)}
                          </Typography>
                        </Pressable>
                      )
                    })}
                    {availableGenres.length > 8 ? (
                      <Pressable style={[styles.chip, { borderColor: colors.border }]} onPress={() => setShowAllGenres((prev) => !prev)}>
                        <Typography style={[styles.chipText, { color: Colors.brand }]}>
                          {showAllGenres ? t('filter_show_less') : t('filter_show_more')}
                        </Typography>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={[styles.filterSection, { borderColor: colors.border }]}>
                <Pressable style={styles.filterSectionHeader} onPress={() => toggleSection('voice')}>
                  <Typography weight="semibold" style={[styles.groupTitle, styles.groupTitleHeader, { color: colors.textSecondary }]}>
                    {t('filter_voice_type')}
                  </Typography>
                  <View style={styles.sectionRight}>
                    {sectionBadge.voice > 0 ? <View style={styles.sectionBadge}><Typography style={styles.sectionBadgeText}>{sectionBadge.voice}</Typography></View> : null}
                    <Feather name={expandedSection === 'voice' ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
                {expandedSection === 'voice' ? (
                  <View style={styles.chipWrap}>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, !selectedVoiceType && styles.voiceChipActive]} onPress={() => setSelectedVoiceType(null)}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, !selectedVoiceType && styles.chipTextActive]}>{t('voice_any')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedVoiceType === 'single' && styles.voiceChipActive]} onPress={() => toggleVoiceType('single')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedVoiceType === 'single' && styles.chipTextActive]}>{t('voice_single')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedVoiceType === 'multiple' && styles.voiceChipActive]} onPress={() => toggleVoiceType('multiple')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedVoiceType === 'multiple' && styles.chipTextActive]}>{t('voice_multiple')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedVoiceType === 'radio_theater' && styles.voiceChipActive]} onPress={() => toggleVoiceType('radio_theater')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedVoiceType === 'radio_theater' && styles.chipTextActive]}>{t('voice_radio_theater')}</Typography>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={[styles.filterSection, { borderColor: colors.border }]}>
                <Pressable style={styles.filterSectionHeader} onPress={() => toggleSection('price')}>
                  <Typography weight="semibold" style={[styles.groupTitle, styles.groupTitleHeader, { color: colors.textSecondary }]}>
                    {t('filter_price')}
                  </Typography>
                  <View style={styles.sectionRight}>
                    {sectionBadge.price > 0 ? <View style={styles.sectionBadge}><Typography style={styles.sectionBadgeText}>{sectionBadge.price}</Typography></View> : null}
                    <Feather name={expandedSection === 'price' ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
                {expandedSection === 'price' ? (
                  <View style={styles.chipWrap}>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, !selectedPrice && styles.priceChipActive]} onPress={() => setSelectedPrice(null)}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, !selectedPrice && styles.chipTextActive]}>{t('price_any')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedPrice === 'free' && styles.priceChipActive]} onPress={() => togglePrice('free')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedPrice === 'free' && styles.chipTextActive]}>{t('price_free')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedPrice === 'paid' && styles.priceChipActive]} onPress={() => togglePrice('paid')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedPrice === 'paid' && styles.chipTextActive]}>{t('price_paid')}</Typography>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={[styles.filterSection, { borderColor: colors.border }]}>
                <Pressable style={styles.filterSectionHeader} onPress={() => toggleSection('length')}>
                  <Typography weight="semibold" style={[styles.groupTitle, styles.groupTitleHeader, { color: colors.textSecondary }]}>
                    {t('filter_length')}
                  </Typography>
                  <View style={styles.sectionRight}>
                    {sectionBadge.length > 0 ? <View style={styles.sectionBadge}><Typography style={styles.sectionBadgeText}>{sectionBadge.length}</Typography></View> : null}
                    <Feather name={expandedSection === 'length' ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
                {expandedSection === 'length' ? (
                  <View style={styles.chipWrap}>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, !selectedLength && styles.lengthChipActive]} onPress={() => setSelectedLength(null)}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, !selectedLength && styles.chipTextActive]}>{t('length_any')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedLength === 'short' && styles.lengthChipActive]} onPress={() => setSelectedLength((prev) => (prev === 'short' ? null : 'short'))}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedLength === 'short' && styles.chipTextActive]}>{t('length_short')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedLength === 'medium' && styles.lengthChipActive]} onPress={() => setSelectedLength((prev) => (prev === 'medium' ? null : 'medium'))}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedLength === 'medium' && styles.chipTextActive]}>{t('length_medium')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, selectedLength === 'long' && styles.lengthChipActive]} onPress={() => setSelectedLength((prev) => (prev === 'long' ? null : 'long'))}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, selectedLength === 'long' && styles.chipTextActive]}>{t('length_long')}</Typography>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={[styles.filterSection, { borderColor: colors.border }]}>
                <Pressable style={styles.filterSectionHeader} onPress={() => toggleSection('atmosphere')}>
                  <Typography weight="semibold" style={[styles.groupTitle, styles.groupTitleHeader, { color: colors.textSecondary }]}>
                    {t('filter_atmosphere')}
                  </Typography>
                  <View style={styles.sectionRight}>
                    {sectionBadge.atmosphere > 0 ? <View style={styles.sectionBadge}><Typography style={styles.sectionBadgeText}>{sectionBadge.atmosphere}</Typography></View> : null}
                    <Feather name={expandedSection === 'atmosphere' ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
                {expandedSection === 'atmosphere' ? (
                  <View style={styles.chipWrap}>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, hasAmbience && styles.ambienceChipActive]} onPress={() => setHasAmbience((prev) => !prev)}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, hasAmbience && styles.chipTextActive]}>{t('has_ambience')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, hasSoundEffects && styles.sfxChipActive]} onPress={() => setHasSoundEffects((prev) => !prev)}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, hasSoundEffects && styles.chipTextActive]}>{t('has_sound_effects')}</Typography>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={[styles.filterSection, { borderColor: colors.border }]}>
                <Pressable style={styles.filterSectionHeader} onPress={() => toggleSection('sort')}>
                  <Typography weight="semibold" style={[styles.groupTitle, styles.groupTitleHeader, { color: colors.textSecondary }]}>
                    {t('sort_by')}
                  </Typography>
                  <View style={styles.sectionRight}>
                    {sectionBadge.sort > 0 ? <View style={styles.sectionBadge}><Typography style={styles.sectionBadgeText}>{sectionBadge.sort}</Typography></View> : null}
                    <Feather name={expandedSection === 'sort' ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
                {expandedSection === 'sort' ? (
                  <View style={styles.chipWrap}>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, sortBy === 'newest' && styles.sortChipActive]} onPress={() => setSortBy('newest')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, sortBy === 'newest' && styles.chipTextActive]}>{t('newest')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, sortBy === 'popular' && styles.sortChipActive]} onPress={() => setSortBy('popular')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, sortBy === 'popular' && styles.chipTextActive]}>{t('popular')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, sortBy === 'a-z' && styles.sortChipActive]} onPress={() => setSortBy('a-z')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, sortBy === 'a-z' && styles.chipTextActive]}>{t('a_z')}</Typography>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: colors.border }, sortBy === 'z-a' && styles.sortChipActive]} onPress={() => setSortBy('z-a')}>
                      <Typography style={[styles.chipText, { color: colors.textSecondary }, sortBy === 'z-a' && styles.chipTextActive]}>{t('z_a')}</Typography>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.actionBtn, styles.clearBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setSelectedGenre(null)
                  setSelectedVoiceType(null)
                  setSelectedPrice(null)
                  setSelectedLength(null)
                  setHasAmbience(false)
                  setHasSoundEffects(false)
                  setSortBy('newest')
                  setShowAllGenres(false)
                }}
              >
                <Typography style={{ color: colors.textSecondary }}>{t('filter_clear')}</Typography>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.applyBtn]} onPress={() => setShowFilters(false)}>
                <Typography weight="semibold" style={{ color: '#04160A' }}>
                  {t('filter_apply')}
                </Typography>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 26,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabLabel: {
    fontSize: FontSize.sm,
  },
  searchWrap: {
    marginBottom: Spacing.sm,
  },
  filterHint: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  libraryWrap: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing['2xl'],
  },
  columnWrapper: {
    marginBottom: Spacing.lg,
  },
  bookCard: {
    alignItems: 'flex-start',
  },
  cover: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  bookTitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    color: '#EAB308',
    fontSize: 12,
  },
  ratingText: {
    fontSize: FontSize.xs,
  },
  voiceRow: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  voiceLabel: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  cartBtn: {
    width: '100%',
    marginTop: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnLabel: {
    fontSize: FontSize.sm,
    color: '#06140A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: FontSize.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    height: '82%',
    padding: Spacing.lg,
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
  },
  modalContent: {
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  filterSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  sectionBadgeText: {
    fontSize: 11,
    color: '#05210D',
    fontWeight: '700',
  },
  groupTitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  groupTitleHeader: {
    marginBottom: 0,
    marginTop: 0,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  voiceChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  priceChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  lengthChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  ambienceChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  sfxChipActive: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
  },
  sortChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontSize: FontSize.sm,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  clearBtn: {
    borderWidth: 1,
  },
  applyBtn: {
    backgroundColor: Colors.brand,
  },
})
