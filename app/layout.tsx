import './globals.css'
import type { Metadata } from 'next'
import SessionProvider from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'Lovable Clone - AI-Powered App Builder',
  description: 'Generate full-stack applications from natural language prompts',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
