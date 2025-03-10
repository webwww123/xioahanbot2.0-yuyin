'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/lib/VoiceChatContext'

// 图标组件：键盘
const KeyboardIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-13.5a3 3 0 01-3-3V5.25zm3 0a.75.75 0 00-.75.75v9a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75H5.25z" clipRule="evenodd" />
    <path d="M3.75 18.75v-2.25h16.5v2.25h-16.5zM6 10.5h1.5v1.5H6v-1.5zm0-3h1.5v1.5H6v-1.5zm3 0h1.5v1.5H9v-1.5zm3 0h1.5v1.5H12v-1.5zm3 0h1.5v1.5H15v-1.5zm3 0h1.5v1.5H18v-1.5zm-9 3h1.5v1.5H9v-1.5zm3 0h1.5v1.5H12v-1.5zm3 0h1.5v1.5H15v-1.5zm3 0h1.5v1.5H18v-1.5z" />
  </svg>
)

// 图标组件：发送
const SendIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
)

// 图标组件：关闭
const CloseIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
)

const TextInput: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const { addMessage } = useVoiceChat()
  
  const handleToggle = () => {
    setIsOpen(!isOpen)
    setText('')
  }
  
  const handleSend = () => {
    if (text.trim()) {
      addMessage(text, true)
      setText('')
      
      // 模拟回复
      setTimeout(() => {
        addMessage("已收到你的文字消息！有什么我能帮你的吗？", false)
      }, 1000)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  return (
    <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2">
      <motion.button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-light text-pink-deeper shadow-md"
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
      >
        {isOpen ? <CloseIcon /> : <KeyboardIcon />}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-64 md:w-80"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="flex overflow-hidden rounded-full border-2 border-pink-light bg-white/90 backdrop-blur-sm shadow-lg">
              <textarea
                className="flex-1 py-2 px-4 bg-transparent resize-none focus:outline-none text-sm h-10 max-h-32 overflow-auto"
                placeholder="输入消息..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{
                  height: Math.min(Math.max(text.split('\n').length, 1) * 24, 96),
                }}
              />
              <button 
                className="px-3 text-pink-deeper disabled:text-gray-300"
                disabled={!text.trim()}
                onClick={handleSend}
              >
                <SendIcon />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TextInput 