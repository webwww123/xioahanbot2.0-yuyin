'use client'

import React, { useRef, memo, useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useVoiceChat } from '@/lib/VoiceChatContext'
import MessageBubble from './MessageBubble'
import { type Message } from '@/lib/types'
import { useMessageScroll } from '@/hooks/useMessageScroll'

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
  // 跟踪消息是否正在流式输出中
  const isStreamingMessage = !message.isUser && !message.isLoading && !message.isError;
  
  return (
    <motion.div
      key={message.id}
      className={`w-full flex ${getMessageAlignment(message)} group`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
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
  
  // 用于控制渐变效果的状态
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScrollHeight, setMaxScrollHeight] = useState(0)
  
  // 跟踪流式输出的状态
  const [hasStreamingMessage, setHasStreamingMessage] = useState(false)
  
  // 为每条消息生成一个稳定的key
  const getMessageKey = (message: Message) => {
    return `${message.id}`;
  };
  
  // 使用自定义的消息滚动hook
  const { 
    containerRef, 
    userScrolled,
    showNewMessageIndicator,
    scrollToBottom,
    forceScrollToBottom,
    isNearBottom,
    resetScroll
  } = useMessageScroll({
    messagesLength: messages.length,
    bottomThreshold: 100,
    defaultScrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
    scrollDelay: 50 // 缩短延迟，更快响应变化
  })
  
  // 监听滚动位置以更新渐变效果
  useEffect(() => {
    if (!containerRef.current) return
    
    const updateScrollInfo = () => {
      if (containerRef.current) {
        setScrollPosition(containerRef.current.scrollTop)
        setMaxScrollHeight(
          containerRef.current.scrollHeight - containerRef.current.clientHeight
        )
      }
    }
    
    // 初始化
    updateScrollInfo()
    
    const container = containerRef.current
    container.addEventListener('scroll', updateScrollInfo, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', updateScrollInfo)
    }
  }, [containerRef, messages.length])
  
  // 计算顶部渐变的不透明度，滚动越多越明显
  const topFadeOpacity = Math.min(scrollPosition / 150, 1)
  
  // 检查是否有正在流式输出的消息
  useEffect(() => {
    // 最后一条消息是否是非用户消息
    const lastMessage = messages[messages.length - 1];
    const isLastMessageAI = lastMessage && 
                          !(lastMessage.isUser ?? lastMessage.role === 'user') &&
                          !lastMessage.isLoading;
                          
    setHasStreamingMessage(isLastMessageAI);
    
    // 如果有新的AI消息并且用户没有主动滚动，自动滚动到底部
    if (isLastMessageAI && !userScrolled) {
      // 使用更频繁的滚动，确保跟随打字效果
      const scrollInterval = setInterval(() => {
        if (!userScrolled) {
          forceScrollToBottom(); // 使用强制滚动方法
        } else {
          clearInterval(scrollInterval);
        }
      }, 100);
      
      // 清理函数
      return () => {
        clearInterval(scrollInterval);
      };
    }
  }, [messages, userScrolled, forceScrollToBottom]);
  
  return (
    <div 
      ref={containerRef}
      className="messages-container flex-1 w-full px-4 py-4 h-full scrollbar-thin scrollbar-thumb-pink-light scrollbar-track-transparent relative overflow-y-auto"
    >
      {/* 顶部渐变效果 - 动态调整透明度 */}
      <motion.div 
        className="top-fade-gradient absolute top-0 left-0 right-0 h-20 z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: topFadeOpacity }}
        transition={{ duration: 0.2 }}
      />
      
      <div className="flex flex-col items-center space-y-4 w-full mx-auto">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageItem
              key={getMessageKey(message)}
              message={message}
              index={index}
              total={messages.length}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* 这个div用于自动滚动的参考点 */}
      <div ref={messagesEndRef} className="h-4" />
      
      {/* 底部新消息指示器 - 改进的动画 */}
      <AnimatePresence>
        {showNewMessageIndicator && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20
            }}
            className="new-message-indicator fixed bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-1"
            onClick={resetScroll}
          >
            <span>新消息</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7 7 7-7"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default memo(MessagesArea) // 使用memo包装整个组件 