'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// 动态导入VoiceChat组件以避免SSR问题
const VoiceChat = dynamic(() => import('@/components/VoiceChat'), {
  ssr: false,
})

// 加载状态组件
const LoadingState = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="relative w-20 h-20">
      <motion.div 
        className="absolute inset-0 rounded-full bg-pink-light"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute inset-0 flex items-center justify-center text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-pink-deeper font-medium">Loading...</span>
      </motion.div>
    </div>
  </div>
)

// 模糊背景装饰元素
const BackgroundBlurs = () => (
  <>
    <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-light/30 blur-3xl" />
    <div className="fixed bottom-[-15%] left-[-5%] w-[35%] h-[45%] rounded-full bg-pastel-lavender/30 blur-3xl" />
    <div className="fixed top-[35%] left-[15%] w-[15%] h-[15%] rounded-full bg-pastel-peach/20 blur-2xl" />
    <div className="fixed bottom-[25%] right-[10%] w-[20%] h-[20%] rounded-full bg-pastel-sky/20 blur-2xl" />
  </>
)

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-white to-pink-light/30">
      {/* 测试链接 - 暂时注释掉
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Link 
          href="/api-test" 
          className="px-3 py-1 bg-pink-500 text-white text-xs rounded-full shadow-md hover:bg-pink-600 transition-colors"
        >
          API测试
        </Link>
        <Link 
          href="/test-gemini" 
          className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full shadow-md hover:bg-purple-600 transition-colors"
        >
          Gemini测试
        </Link>
        <Link 
          href="/api-proxy-test" 
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full shadow-md hover:bg-blue-600 transition-colors"
        >
          代理测试
        </Link>
        <Link 
          href="/deno-test" 
          className="px-3 py-1 bg-green-500 text-white text-xs rounded-full shadow-md hover:bg-green-600 transition-colors"
        >
          Deno测试
        </Link>
      </div>
      */}
      
      {/* 背景装饰 */}
      <BackgroundBlurs />
      
      <Suspense fallback={<LoadingState />}>
        <div className="max-w-4xl mx-auto h-full">
          <VoiceChat />
        </div>
      </Suspense>
    </div>
  )
} 