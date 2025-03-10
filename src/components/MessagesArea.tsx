'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useVoiceChat } from '@/lib/VoiceChatContext'
import MessageBubble from './MessageBubble'

const MessagesArea: React.FC = () => {
  const { messages } = useVoiceChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  
  // 新消息时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth' 
      })
    }
  }, [messages, prefersReducedMotion])
  
  return (
    <div className="flex-1 w-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-pink-light scrollbar-track-transparent">
      <div ref={messagesEndRef} className="h-6" />
      
      <motion.div 
        className="flex flex-col items-center space-y-3 w-full mb-8"
        layout
      >
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              layout
              className={`w-full flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 40,
                mass: 1
              }}
            >
              <MessageBubble
                message={message}
                index={index}
                total={messages.length}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default MessagesArea 