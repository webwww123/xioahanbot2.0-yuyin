'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { VoiceChatProvider } from '@/lib/VoiceChatContext'
import VoiceButton from './VoiceButton'
import MessagesArea from './MessagesArea'
import Decorations from './Decorations'

const VoiceChat: React.FC = () => {
  return (
    <VoiceChatProvider>
      <div className="relative flex flex-col items-center justify-between w-full h-full min-h-screen pt-4">
        {/* 装饰元素 */}
        <Decorations />
        
        {/* 消息显示区域 */}
        <MessagesArea />
        
        {/* 底部控制区域 - 往上移动 */}
        <div className="fixed bottom-20 sm:bottom-28 md:bottom-32 left-0 right-0 h-32 flex flex-col items-center justify-center bg-gradient-to-t from-[#fffafa] to-transparent z-10 pb-6">
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
        </div>
        
        {/* 底部品牌标识 - 更靠近按钮 */}
        <motion.div
          className="fixed bottom-10 sm:bottom-14 md:bottom-16 left-0 right-0 text-center text-xs text-pink-dark/50 font-light z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>✨ 语音聊天 ✨</p>
        </motion.div>
      </div>
    </VoiceChatProvider>
  )
}

export default VoiceChat 