'use client'

import { useState, useEffect, useCallback } from 'react'

export default function DenoTest() {
  const [apiUrl, setApiUrl] = useState('https://pink-chat-api.deno.dev/v1')
  const [apiKey, setApiKey] = useState('AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM')
  const [message, setMessage] = useState('你好，这是一条测试消息，请用可爱的语气回复')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = useCallback(async () => {
    setLoading(true)
    setError('')
    setResponse('')
    
    try {
      console.log('发送请求到:', `${apiUrl}/chat/completions`)
      
      const res = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gemini-2.0-pro-exp-02-0',
          messages: [
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      })
      
      console.log('响应状态:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API错误:', errorText)
        throw new Error(`HTTP错误: ${res.status} - ${errorText}`)
      }
      
      const data = await res.json()
      console.log('API响应:', data)
      
      if (data.choices && data.choices.length > 0) {
        setResponse(data.choices[0].message.content)
      } else {
        throw new Error('响应中没有有效的回复内容')
      }
    } catch (err) {
      console.error('请求错误:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [apiUrl, apiKey, message])

  // 添加获取模型列表功能
  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError('')
    setResponse('')
    
    try {
      const res = await fetch(`${apiUrl}/models?key=${apiKey}`)
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`HTTP错误: ${res.status} - ${errorText}`)
      }
      
      const data = await res.json()
      console.log('模型列表:', data)
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [apiUrl, apiKey])

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-pink-500">Deno API 测试页面</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">API URL</label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="w-full p-2 border rounded focus:ring-pink-500 focus:border-pink-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">API Key</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border rounded focus:ring-pink-500 focus:border-pink-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">消息内容</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded focus:ring-pink-500 focus:border-pink-500 min-h-[100px]"
        />
      </div>
      
      <div className="flex space-x-2 mb-6">
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? '发送中...' : '发送消息'}
        </button>
        
        <button
          onClick={fetchModels}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? '获取中...' : '获取模型列表'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          <h3 className="font-bold">错误:</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
      
      {response && (
        <div className="p-3 bg-gray-100 border rounded">
          <h3 className="font-bold mb-2">响应:</h3>
          <pre className="whitespace-pre-wrap text-sm">{response}</pre>
        </div>
      )}
    </div>
  )
} 