'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { type Message } from '@/lib/types'

interface MessageBubbleProps {
  message: Message
  index: number
  total: number
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  index,
  total
}) => {
  return (
    <motion.div
      className={`message-bubble ${message.isUser ? 'self-end bg-pink-light' : 'self-start'}`}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.35, 
        type: "spring", 
        stiffness: 120, 
        damping: 20 
      }}
    >
      <p className="text-sm leading-tight md:text-base">{message.text}</p>
      
      {/* 小装饰 */}
      <motion.div 
        className={`absolute ${message.isUser ? '-right-1' : '-left-1'} bottom-0 w-3 h-3 rounded-full bg-pink`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{ opacity: 0.2 }}
      />
      
      {/* 消息时间指示器 */}
      <div className="absolute bottom-0 right-0 -mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <small className="text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </small>
      </div>
    </motion.div>
  )
}

export default MessageBubble 