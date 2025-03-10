'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { type Message, type VoiceChatContextType } from '@/lib/types'

// 创建上下文
const VoiceChatContext = createContext<VoiceChatContextType | undefined>(undefined)

// 上下文提供者组件
export const VoiceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 添加新消息
  const addMessage = useCallback((text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      isUser,
      timestamp: Date.now(),
    }
    
    setMessages((prev) => [...prev, newMessage])
  }, [])

  // 清空所有消息
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 开始录音
  const startRecording = useCallback(() => {
    setIsRecording(true)
    // 这里可以添加实际的录音逻辑
  }, [])

  // 停止录音
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setIsProcessing(true)
    
    // 模拟处理录音
    setTimeout(() => {
      setIsProcessing(false)
      
      // 模拟响应消息
      // 实际应用中，这里应该是处理录音并发送到后端的逻辑
    }, 1000)
  }, [])

  // 创建上下文值
  const contextValue = useMemo(() => ({
    messages,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    addMessage,
    clearMessages,
  }), [messages, isRecording, isProcessing, startRecording, stopRecording, addMessage, clearMessages])

  return (
    <VoiceChatContext.Provider value={contextValue}>
      {children}
    </VoiceChatContext.Provider>
  )
}

// 创建自定义Hook以便组件使用上下文
export const useVoiceChat = (): VoiceChatContextType => {
  const context = useContext(VoiceChatContext)
  if (context === undefined) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider')
  }
  return context
} 