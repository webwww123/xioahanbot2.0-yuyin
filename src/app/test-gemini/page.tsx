'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// Gemini API 相关配置
const GEMINI_API_KEY = 'AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM'
const BASE_URL = 'https://generativelanguage.googleapis.com'
const API_VERSION = 'v1beta'
const DEFAULT_MODEL = 'gemini-1.5-pro-latest'

// 消息类型定义
interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function TestGemini() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 直接从客户端调用Gemini API
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    // 添加用户消息
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // 准备对话历史
      const contents = [
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: input }]
        }
      ]
      
      console.log('发送请求到Gemini API:', contents)
      
      // 直接调用Gemini API
      const response = await fetch(`${BASE_URL}/${API_VERSION}/models/${DEFAULT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API错误 (${response.status}): ${errorData}`)
      }
      
      const data = await response.json()
      console.log('Gemini API 响应:', data)
      
      // 提取回复文本
      const replyText = data.candidates[0]?.content?.parts[0]?.text || '抱歉，无法生成回复'
      
      // 添加AI回复
      const assistantMessage: Message = { role: 'assistant', content: replyText }
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 添加错误消息
      const errorMessage: Message = { 
        role: 'assistant', 
        content: `发送消息失败: ${error instanceof Error ? error.message : String(error)}` 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-pink-500">Gemini API 测试</h1>
        <p className="text-gray-600">直接从浏览器调用 Gemini API（使用梯子）</p>
      </div>
      
      {/* 消息显示区域 */}
      <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg shadow-sm p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            发送消息开始对话...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-pink-100 text-pink-900' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="p-3 rounded-lg bg-gray-100 text-gray-800 max-w-[80%]">
                <div className="flex space-x-2">
                  <motion.div 
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* 输入区域 */}
      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-pink-400 to-pink-600 text-white py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
          disabled={isLoading || !input.trim()}
        >
          发送
        </button>
      </form>
    </div>
  )
} 