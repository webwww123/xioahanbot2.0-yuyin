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

// 处理消息显示位置的辅助函数
const getMessageAlignment = (message: Message): string => {
  // 兼容新旧消息格式
  if (message.isUser !== undefined) {
    return message.isUser ? 'justify-end' : 'justify-start';
  }
  
  if (message.role !== undefined) {
    return message.role === 'user' ? 'justify-end' : 'justify-start';
  }
  
  // 默认返回
  return 'justify-start';
};

// 单个消息项组件，使用memo优化渲染
const MessageItem = memo(({ message, index, total }: MessageItemProps) => {
  return (
    <motion.div
      key={message.id}
      className={`w-full flex ${getMessageAlignment(message)} group`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "tween",
        duration: 0.2,
        ease: "easeOut"
      }}
      layout={false}
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
  
  // 创建ResizeObserver监听文本变化，以触发滚动更新
  useEffect(() => {
    // 创建一个ResizeObserver来监视容器大小变化
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    });
    
    // 观察消息容器
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full overflow-y-auto px-4 py-4 h-full scrollbar-thin scrollbar-thumb-pink-light scrollbar-track-transparent"
    >
      <div className="flex flex-col items-center space-y-4 w-full mx-auto">
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