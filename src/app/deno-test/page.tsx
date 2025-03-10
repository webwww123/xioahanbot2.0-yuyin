'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GeminiClient, type ChatMessage } from '@/lib/deno-client'

export default function DenoTest() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [apiUrl, setApiUrl] = useState('https://gemini-api-proxy.deno.dev/v1')
  const [apiKey, setApiKey] = useState('AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [client, setClient] = useState<GeminiClient | null>(null)
  
  // 初始化客户端
  useEffect(() => {
    if (apiUrl && apiKey) {
      setClient(new GeminiClient(apiUrl, apiKey))
    }
  }, [apiUrl, apiKey])
  
  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息到Deno部署的Gemini API
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || !client) return
    
    // 添加用户消息
    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // 创建历史消息数组
      const historyMessages = [
        {
          role: 'system' as const,
          content: '你是一个友好、有帮助的AI助手，会用简单的语言回答问题。'
        },
        ...messages,
        userMessage
      ]
      
      console.log('发送请求到Deno部署的Gemini API:', historyMessages)
      
      // 使用客户端发送请求
      const response = await client.chat(historyMessages, {
        model: 'gemini-1.5-pro-latest',
        temperature: 0.7,
        max_tokens: 800
      })
      
      console.log('Deno部署的Gemini API响应:', response)
      
      // 提取回复文本
      const replyText = response.choices[0]?.message?.content || '抱歉，无法生成回复'
      
      // 添加AI回复
      const assistantMessage: ChatMessage = { role: 'assistant', content: replyText }
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 添加错误消息
      const errorMessage: ChatMessage = { 
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
        <h1 className="text-2xl font-bold text-blue-500">Deno部署测试</h1>
        <p className="text-gray-600">测试与Deno部署的Gemini API代理通信</p>
      </div>
      
      {/* 配置区域 */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="输入Deno部署的API URL..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="输入Gemini API Key..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
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
                    ? 'ml-auto bg-blue-100 text-blue-900' 
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
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={isLoading || !client}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
          disabled={isLoading || !input.trim() || !client}
        >
          发送
        </button>
      </form>
      
      {/* 部署指南链接 */}
      <div className="mt-4 text-center">
        <a 
          href="/deno-deploy/README.md" 
          target="_blank"
          className="text-blue-500 hover:underline"
        >
          查看Deno部署指南
        </a>
      </div>
    </div>
  )
} 