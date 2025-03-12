'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ApiDebug() {
  const [apiUrl, setApiUrl] = useState('https://dashscope.aliyuncs.com/compatible-mode/v1')
  const [useLocalProxy, setUseLocalProxy] = useState(true)
  const [apiKey, setApiKey] = useState('sk-68cc7ab559d4429889c6eda358b05763')
  const [endpoint, setEndpoint] = useState('/chat/completions')
  const [method, setMethod] = useState('POST')
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    model: 'qwen-omni-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: '你好，这是一条测试消息，请用中文回复'
      }
    ],
    stream: true,
    stream_options: {
      include_usage: true
    }
  }, null, 2))
  
  const [loading, setLoading] = useState(false)
  const [responseData, setResponseData] = useState('')
  const [responseStatus, setResponseStatus] = useState('')
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [responseBody, setResponseBody] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
    'Authorization': ''
  })
  
  const [logs, setLogs] = useState<string[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  const [audioFile, setAudioFile] = useState<File | null>(null)
  
  // 记录日志
  const log = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }
  
  // 自动滚动日志到底部
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])
  
  // 更新Authorization头
  useEffect(() => {
    if (apiKey) {
      setRequestHeaders(prev => ({
        ...prev,
        'Authorization': `Bearer ${apiKey}`
      }))
    }
  }, [apiKey])
  
  // 发送请求
  const sendRequest = async () => {
    setLoading(true)
    setResponseData('')
    const currentTime = new Date().toLocaleTimeString()
    
    // 确定实际使用的 URL
    const effectiveUrl = useLocalProxy 
      ? `/api/bailian-local${endpoint}` 
      : `${apiUrl}${endpoint}`
    
    log(`[${currentTime}] 发送${method}请求到: ${effectiveUrl}`)
    
    try {
      // 添加请求体 (如果是 POST 请求)
      let requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
      
      // 只有在不使用本地代理时才需要添加额外的CORS配置
      if (!useLocalProxy) {
        requestOptions.mode = 'cors'
        requestOptions.credentials = 'omit'
      }
      
      // 如果是 POST 请求，添加请求体
      if (method === 'POST') {
        try {
          const parsedBody = JSON.parse(requestBody)
          log(`[${currentTime}] 请求体: ${JSON.stringify(parsedBody)}`)
          requestOptions.body = requestBody
        } catch (e) {
          log(`[${currentTime}] 错误: 请求体不是有效的 JSON`)
          setLoading(false)
          return
        }
      }
      
      log(`[${currentTime}] 使用以下选项发送请求: ${JSON.stringify(requestOptions)}`)
      
      // 发送请求
      const response = await fetch(effectiveUrl, requestOptions)
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`请求失败，状态: ${response.status} ${response.statusText}`)
      }

      // 如果是流式响应
      const parsedBody = JSON.parse(requestBody)
      if (parsedBody.stream) {
        setResponseData('等待流式响应...\n')
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        while (true) {
          const { done, value } = await reader!.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6)
              if (jsonStr === '[DONE]') {
                log(`[${currentTime}] 流式响应完成`)
                continue
              }
              try {
                const jsonData = JSON.parse(jsonStr)
                setResponseData(prev => prev + JSON.stringify(jsonData, null, 2) + '\n')
              } catch (e) {
                console.warn('解析响应数据失败:', e)
              }
            }
          }
        }
        
        log(`[${currentTime}] 请求成功，已接收所有流式响应`)
      } else {
        // 非流式响应
        const data = await response.json()
        setResponseData(JSON.stringify(data, null, 2))
        log(`[${currentTime}] 请求成功，已接收响应`)
      }
    } catch (error) {
      log(`[${currentTime}] 错误: ${error instanceof Error ? error.message : String(error)}`)
      
      // 如果在使用远程 API 时出错，提示用户尝试本地代理
      if (!useLocalProxy) {
        log(`[${currentTime}] 提示: 您可以尝试启用本地代理选项来解决 CORS 问题`)
      }
    } finally {
      setLoading(false)
    }
  }
  
  // 切换模型
  const switchModel = (model: string) => {
    try {
      const body = JSON.parse(requestBody)
      body.model = model
      setRequestBody(JSON.stringify(body, null, 2))
    } catch (e) {
      log(`无法更新模型: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  
  // 重置表单
  const resetForm = () => {
    if (!confirm('确定要重置所有表单吗？')) return
    
    setRequestBody(JSON.stringify({
      model: 'qwen-omni-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: '你好，这是一条测试消息，请用中文回复'
        }
      ],
      stream: true,
      stream_options: {
        include_usage: true
      }
    }, null, 2))
    
    setLogs([])
  }
  
  // 处理音频文件选择
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setAudioFile(file)
    log(`已选择音频文件: ${file.name}`)
  }
  
  // 添加音频测试
  const addAudioTest = async () => {
    if (!audioFile) {
      log('请先选择音频文件')
      return
    }
    
    try {
      // 读取音频文件并转换为 Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Audio = e.target?.result?.toString().split(',')[1]
        if (!base64Audio) {
          log('音频文件读取失败')
          return
        }
        
        // 获取文件的MIME类型和扩展名
        let mimeType = audioFile.type
        let format = 'mp3' // 默认格式
        
        // 根据文件扩展名推测格式
        const extension = audioFile.name.split('.').pop()?.toLowerCase()
        if (extension) {
          format = extension
        }
        
        log(`音频文件尺寸: ${Math.round(base64Audio.length * 0.75 / 1024)} KB, 格式: ${format}`)
        
        // 更新请求体 - 使用正确的格式
        const newBody = {
          model: 'qwen-omni-turbo',
          messages: [
            {
              role: 'system',
              content: [{ type: 'text', text: 'You are a helpful assistant.' }]
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  input_audio: { 
                    data: `data:;base64,${base64Audio}`,
                    format: format
                  }
                },
                {
                  type: 'text',
                  text: '这段音频说了什么？请用中文回复'
                }
              ]
            }
          ],
          stream: true,
          stream_options: {
            include_usage: true
          },
          modalities: ['text']
        }
        
        setRequestBody(JSON.stringify(newBody, null, 2))
        log('已更新请求体，包含音频数据')
      }
      
      reader.readAsDataURL(audioFile)
    } catch (error) {
      log(`处理音频文件时出错: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4 text-pink-500">API 调试工具</h1>
      
      <div className="mb-8 flex flex-wrap gap-4">
        {/* API配置 */}
        <div className="flex-1 min-w-[300px]">
          <div className="bg-white p-4 rounded shadow-md mb-4">
            <h2 className="text-lg font-semibold mb-3 text-pink-500">API 配置</h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">API URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full p-2 border rounded focus:ring-pink-500 focus:border-pink-500"
                disabled={useLocalProxy}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border rounded focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">端点</label>
              <div className="flex gap-2">
                <select
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="p-2 border rounded focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="/chat/completions">聊天对话</option>
                  <option value="/models">模型列表</option>
                  <option value="/embeddings">嵌入向量</option>
                </select>
                
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="p-2 border rounded focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={sendRequest}
                disabled={loading}
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50 flex-1"
              >
                {loading ? '发送中...' : '发送请求'}
              </button>
              
              <button
                onClick={() => {
                  const directUrl = `${apiUrl}${endpoint}${endpoint === '/models' ? `?key=${apiKey}` : ''}`;
                  window.open(directUrl, '_blank');
                  log(`在新标签页中打开: ${directUrl}`);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                直接打开
              </button>
              
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                重置
              </button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow-md mb-4">
            <h2 className="text-lg font-semibold mb-3 text-pink-500">快速操作</h2>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => switchModel('qwen-omni-turbo')}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
              >
                qwen-omni-turbo
              </button>
              
              <button
                onClick={() => switchModel('qwen-omni-plus')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                qwen-omni-plus
              </button>
              
              <button
                onClick={() => setEndpoint('/models')}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                获取模型列表
              </button>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">音频识别测试</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="text-sm"
                />
                <button
                  onClick={addAudioTest}
                  disabled={!audioFile}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50"
                >
                  添加音频测试
                </button>
              </div>
              {audioFile && (
                <div className="mt-2 text-xs text-gray-500">
                  已选择: {audioFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 请求和响应 */}
        <div className="flex-[2] min-w-[400px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 请求体 */}
            <div className="bg-white p-4 rounded shadow-md">
              <h2 className="text-lg font-semibold mb-3 text-pink-500">请求体</h2>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-[300px] p-2 border rounded font-mono text-sm focus:ring-pink-500 focus:border-pink-500"
                placeholder="输入JSON格式的请求体..."
              />
            </div>
            
            {/* 响应 */}
            <div className="bg-white p-4 rounded shadow-md">
              <h2 className="text-lg font-semibold mb-3 text-pink-500">响应</h2>
              
              {errorMessage && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}
              
              {responseStatus && (
                <div className="mb-3">
                  <div className="font-semibold text-sm">状态:</div>
                  <div className={`text-sm ${responseStatus.startsWith('2') ? 'text-green-600' : 'text-red-600'}`}>
                    {responseStatus}
                  </div>
                </div>
              )}
              
              <div className="mb-3 h-[250px] overflow-auto">
                <div className="font-semibold text-sm">响应体:</div>
                <pre className="text-xs p-2 bg-gray-50 rounded border overflow-auto">
                  {responseData || '(无内容)'}
                </pre>
              </div>
            </div>
          </div>
          
          {/* 日志 */}
          <div className="bg-white p-4 rounded shadow-md mt-4">
            <h2 className="text-lg font-semibold mb-3 text-pink-500">请求日志</h2>
            <div className="h-[200px] bg-gray-900 text-green-400 p-3 rounded overflow-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="italic text-gray-500">日志将在这里显示...</div>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 