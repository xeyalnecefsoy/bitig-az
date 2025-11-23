import { SocialProvider } from '@/context/social'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SocialProvider>{children}</SocialProvider>
}
