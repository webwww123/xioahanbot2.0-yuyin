'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { VoiceChatProvider } from '@/lib/VoiceChatContext'
import VoiceButton from './VoiceButton'
import MessagesArea from './MessagesArea'
import Decorations from './Decorations'

const VoiceChat: React.FC = () => {
  return (
    <VoiceChatProvider>
      <div className="relative flex flex-col items-center justify-between w-full h-full min-h-screen">
        {/* 装饰元素 */}
        <Decorations />
        
        {/* 消息显示区域 */}
        <div className="flex-1 w-full overflow-y-auto">
          <MessagesArea />
        </div>
        
        {/* 底部控制区域 */}
        <div className="w-full py-6 flex flex-col items-center justify-center z-10">
          {/* 中央语音按钮 */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: 'spring', 
              damping: 15,
              delay: 0.3
            }}
          >
            <VoiceButton />
          </motion.div>
          
          {/* 底部品牌标识 */}
          <motion.div
            className="mt-4 text-center text-xs text-pink-dark/50 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>✨ 语音聊天 ✨</p>
          </motion.div>
        </div>
      </div>
    </VoiceChatProvider>
  )
}

export default VoiceChat 