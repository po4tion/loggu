import { QueryProvider } from '@/components/providers/query-provider'

export default function EditorRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <QueryProvider>{children}</QueryProvider>
}
