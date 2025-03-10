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
    <html lang="zh">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <main className="relative w-full h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  )
} 