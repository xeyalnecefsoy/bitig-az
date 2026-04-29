import { SocialProvider } from '@/context/social'

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SocialProvider>{children}</SocialProvider>
}
