'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ApiProxyTest() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 使用参考项目的API代理格式发送消息
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')
    setIsLoading(true)
    
    try {
      // 创建历史消息数组，格式符合参考项目的API
      const historyMessages = [
        {
          role: 'system',
          content: '你是一个友好、有帮助的AI助手，会用简单的语言回答问题。'
        },
        ...messages,
        {
          role: 'user',
          content: input
        }
      ]
      
      console.log('发送请求到代理API:', historyMessages)
      
      // 尝试直接使用参考项目的API格式
      const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gemini-1.5-pro-latest',
          messages: historyMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API错误 (${response.status}): ${errorData}`)
      }
      
      const data = await response.json()
      console.log('API代理响应:', data)
      
      // 提取回复文本
      const replyText = data.choices?.[0]?.message?.content || '抱歉，无法生成回复'
      
      // 添加AI回复
      setMessages(prev => [...prev, { role: 'assistant', content: replyText }])
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 添加错误消息
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `发送消息失败: ${error instanceof Error ? error.message : String(error)}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-purple-500">API代理测试</h1>
        <p className="text-gray-600">使用参考项目的代理格式测试API</p>
      </div>
      
      {/* API Key 输入框 */}
      <div className="mb-4">
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="输入Gemini API Key..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                    ? 'ml-auto bg-purple-100 text-purple-900' 
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
          placeholder="憨大人请讲"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-400 to-purple-600 text-white py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
          disabled={isLoading || !input.trim()}
        >
          发送
        </button>
      </form>
    </div>
  )
} 