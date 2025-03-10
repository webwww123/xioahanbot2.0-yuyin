import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '语音聊天',
  description: '优雅简约的语音聊天应用',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-auto">
        <main className="relative w-full min-h-full overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
} 