import type { Metadata } from 'next'
import './globals.css'
import { AppKitProvider } from '@/components/AppKitProvider'

export const metadata: Metadata = {
  title: 'JUICY - Cross Chain USDC Transfer',
  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppKitProvider>
          {children}
        </AppKitProvider>
      </body>
    </html>
  )
}
