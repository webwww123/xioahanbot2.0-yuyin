'use client'

import React, { useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useVoiceChat } from '@/lib/VoiceChatContext'
import MessageBubble from './MessageBubble'
import { type Message } from '@/lib/types'

// 定义MessageItem组件的props类型
interface MessageItemProps {
  message: Message;
  index: number;
  total: number;
}

// 单个消息项组件，使用memo优化渲染
const MessageItem = memo(({ message, index, total }: MessageItemProps) => {
  return (
    <motion.div
      key={message.id}
      className={`w-full flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "tween",
        duration: 0.2,
        ease: "easeOut"
      }}
      layout // 添加layout属性，保持动画连贯性
    >
      <MessageBubble
        message={message}
        index={index}
        total={total}
      />
    </motion.div>
  )
})

MessageItem.displayName = 'MessageItem'

const MessagesArea = () => {
  const { messages } = useVoiceChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 新消息时自动滚动到底部，使用更平滑的方法
  useEffect(() => {
    if (messages.length > 0 && containerRef.current) {
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      })
    }
  }, [messages])
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-pink-light scrollbar-track-transparent"
    >
      <div className="flex flex-col items-center space-y-3 w-full mb-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              index={index}
              total={messages.length}
            />
          ))}
        </AnimatePresence>
      </div>
      <div ref={messagesEndRef} className="h-4" />
    </div>
  )
}

export default memo(MessagesArea) // 使用memo包装整个组件 