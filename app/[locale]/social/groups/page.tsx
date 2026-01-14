import { t } from '@/lib/i18n';
import { getGroups } from '@/lib/supabase/server-api';
import { Metadata } from 'next';
import { GroupsContent } from './GroupsContent';

// ISR - Revalidate every 30 seconds
export const revalidate = 30;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${t(locale as any, 'groups_title')} | Bitig Social`,
    description: t(locale as any, 'groups_desc'),
  };
}

export default async function GroupsPage({ params }: PageProps) {
  const { locale } = await params;
  const groups = await getGroups();

  return <GroupsContent groups={groups} locale={locale} />;
}
