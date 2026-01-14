---
description: Supabase database və API ilə işləmək
---

# Supabase Workflow

Bu workflow Supabase database və authentication ilə işləmək üçündür.

## Database Strukturu

Migration faylları: `supabase/migrations/`
Master migration: `supabase/migrations/master_migration.sql`

## Supabase Client İstifadəsi

### Server-Side (SSR)
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('table_name')
    .select('*');
    
  return <div>{/* ... */}</div>;
}
```

### Client-Side
```typescript
"use client";

import { createClient } from '@/lib/supabase/client';

export default function Component() {
  const supabase = createClient();
  
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*');
  };
  
  return <div>{/* ... */}</div>;
}
```

## Ümumi Əməliyyatlar

### SELECT
```typescript
// Hamısını seç
const { data } = await supabase.from('books').select('*');

// Spesifik sətirləri seç
const { data } = await supabase
  .from('books')
  .select('*')
  .eq('author_id', userId);
  
// İlişkili data (join)
const { data } = await supabase
  .from('books')
  .select(`
    *,
    author:profiles(name, avatar_url)
  `);
```

### INSERT
```typescript
const { data, error } = await supabase
  .from('books')
  .insert({ title: 'Yeni Kitab', author_id: userId })
  .select();
```

### UPDATE
```typescript
const { data, error } = await supabase
  .from('books')
  .update({ title: 'Yenilənmiş Başlıq' })
  .eq('id', bookId);
```

### DELETE
```typescript
const { error } = await supabase
  .from('books')
  .delete()
  .eq('id', bookId);
```

## Authentication

### Current User
```typescript
// Server-side
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client-side
const { data: { user } } = await supabase.auth.getUser();
```

### Session
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

## RLS (Row Level Security)

Supabase Dashboard-da RLS policies idarə olunur:
https://app.supabase.com → Database → Tables → RLS Policies

### Nümunə Policy
```sql
-- İstifadəçilər yalnız öz datalarını görə bilər
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('books')
  .select('*');
  
if (error) {
  console.error('Supabase error:', error.message);
  // Error handling
  return;
}

// data ilə davam et
```

## Real-time Subscriptions

```typescript
"use client";

useEffect(() => {
  const channel = supabase
    .channel('table_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        console.log('Change received:', payload);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Debugging

1. **Console-da error yoxla**
2. **Supabase Dashboard**-da Table Editor-u yoxla
3. **RLS policies**-i yoxla
4. **Network tab**-da request/response yoxla
