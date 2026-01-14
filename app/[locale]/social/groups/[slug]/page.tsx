import { t } from '@/lib/i18n';
import { getGroup } from '@/lib/supabase/server-api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { GroupContent } from './GroupContent';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    return { title: 'Group Not Found' };
  }

  return {
    title: `${group.name} | Bitig Social`,
    description: group.description,
  };
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    return notFound();
  }

  return <GroupContent group={group} locale={locale} />;
}
