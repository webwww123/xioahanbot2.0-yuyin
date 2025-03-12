'use client'

import React, { useState, useRef } from 'react'
import axios from 'axios'

// 百度语音识别API配置（从VoiceChatContext复制）
const BAIDU_API_KEY = 'lTIvxWNpSHUuNBGD3tqfdiqC'
const BAIDU_SECRET_KEY = 'hq5HnLN5ieAhGg0eBLFFuiUmz7NRpupz'

// 百度API响应类型定义
interface BaiduTokenResponse {
  access_token: string
  expires_in: number
  [key: string]: any
}

interface BaiduASRResponse {
  err_no: number
  err_msg: string
  sn: string
  result?: string[]
  [key: string]: any
}

const ApiTest: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string>('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string | null>('')
  const [logs, setLogs] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 添加日志
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }
  
  // 清除日志
  const clearLogs = () => {
    setLogs([])
    setError('')
  }
  
  // 获取百度API的Access Token
  const getAccessToken = async () => {
    try {
      clearLogs() // 清除之前的日志
      addLog('正在获取百度语音识别API的访问令牌...')
      setIsProcessing(true)
      
      // 使用本地API路由而不是直接请求百度API
      addLog('通过本地API路由请求令牌')
      
      try {
        const response = await axios.get<BaiduTokenResponse>('/api/baidu-token');
        
        // 记录完整的响应
        addLog(`响应状态: ${response.status}`)
        addLog(`响应数据: ${JSON.stringify(response.data, null, 2)}`)
        
        if (response.data && response.data.access_token) {
          const token = response.data.access_token
          setAccessToken(token)
          addLog(`✅ 访问令牌获取成功: ${token.substring(0, 10)}...`)
          return token
        } else {
          throw new Error('响应中没有access_token字段')
        }
      } catch (error) {
        // 处理axios错误
        addLog(`❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`)
        
        // 尝试获取详细信息
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          
          if (axiosError.response) {
            addLog(`状态码: ${axiosError.response.status || 'unknown'}`)
            addLog(`响应数据: ${JSON.stringify(axiosError.response.data || {}, null, 2)}`)
          }
        }
        
        setError(`获取访问令牌失败: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addLog(`获取访问令牌失败: ${errorMessage}`)
      setError(`获取访问令牌失败: ${errorMessage}`)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setAudioFile(file)
      addLog(`已选择文件: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`)
    }
  }

  // 处理音频识别
  const handleRecognizeAudio = async () => {
    if (!audioFile) {
      setError('请先选择一个音频文件')
      return
    }

    try {
      setIsProcessing(true)
      setError('')
      setResult('')
      
      // 获取token (如果还没有)
      const token = accessToken || await getAccessToken()
      
      // 准备音频数据
      addLog('准备音频数据...')
      const reader = new FileReader()
      
      const audioData = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result)
          } else {
            reject(new Error('读取文件失败'))
          }
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(audioFile)
      })
      
      // 音频格式处理
      let mimeType = audioFile.type
      let audioFormat = 'pcm'
      
      // 根据文件扩展名和MIME类型判断
      if (mimeType.includes('wav') || audioFile.name.toLowerCase().endsWith('.wav')) {
        audioFormat = 'wav'
      } else if (mimeType.includes('mp3') || audioFile.name.toLowerCase().endsWith('.mp3')) {
        audioFormat = 'mp3'
      } else if (mimeType.includes('m4a') || audioFile.name.toLowerCase().endsWith('.m4a')) {
        audioFormat = 'pcm' // 百度API处理m4a文件时使用pcm格式
      } else if (mimeType.includes('webm') || audioFile.name.toLowerCase().endsWith('.webm')) {
        audioFormat = 'pcm' // 对于WebM文件也使用pcm作为标识
      }
      
      addLog(`音频格式识别为: ${audioFormat} (原始MIME类型: ${mimeType || '未知'})`)
      
      // 转换为 Base64
      let base64Audio = btoa(new Uint8Array(audioData).reduce(
        (data, byte) => data + String.fromCharCode(byte), ''
      ))
      
      addLog(`音频数据转换完成，大小: ${base64Audio.length} 字符`)
      
      // 使用本地API路由发送请求
      addLog('通过本地API路由发送语音识别请求...')
      
      try {
        const response = await axios.post<BaiduASRResponse>('/api/baidu-asr', {
          token,
          audio: base64Audio,
          format: audioFormat,
          len: audioData.byteLength
        });
        
        addLog(`收到API响应: [${response.status}] ${JSON.stringify(response.data)}`)
        
        if (response.data.err_no === 0 && response.data.result) {
          setResult(response.data.result.join(' '))
          addLog('语音识别成功!')
        } else {
          setError(`识别失败: ${response.data.err_msg || '未知错误'} (错误码: ${response.data.err_no})`)
          addLog(`识别失败: ${response.data.err_msg || '未知错误'} (错误码: ${response.data.err_no})`)
          
          // 提供额外调试信息
          if (response.data.err_no === 3301) {
            addLog('错误码3301通常表示语音质量问题，请确保音频清晰并且格式支持')
          } else if (response.data.err_no === 3302) {
            addLog('错误码3302通常表示鉴权失败，请检查API密钥')
          } else if (response.data.err_no === 3303) {
            addLog('错误码3303通常表示无法识别音频内容')
          } else if (response.data.err_no === 3304) {
            addLog('错误码3304通常表示音频格式不正确，请确保使用支持的格式')
          } else if (response.data.err_no === 3305) {
            addLog('错误码3305通常表示音频数据过大，请缩短音频长度')
          }
        }
      } catch (error) {
        addLog(`❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`)
        
        // 尝试获取详细信息
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          
          if (axiosError.response) {
            addLog(`状态码: ${axiosError.response.status || 'unknown'}`)
            addLog(`响应数据: ${JSON.stringify(axiosError.response.data || {}, null, 2)}`)
          }
        }
        
        setError(`语音识别失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(`处理过程中出错: ${errorMessage}`)
      addLog(`处理过程中出错: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const testGetModels = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('测试 GET /api/gemini-local/models')
      const res = await fetch('/api/gemini-local/models')
      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      setResponse(data)
    } catch (err) {
      console.error('请求错误:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const testChatCompletions = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('测试 POST /api/gemini-local/chat/completions')
      const res = await fetch('/api/gemini-local/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-pro-exp-02-05',
          messages: [
            { role: 'user', content: '你好，这是一条测试消息，请用中文回复' },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`请求失败: ${res.status} ${res.statusText}\n${text}`)
      }
      
      const data = await res.json()
      setResponse(data)
    } catch (err) {
      console.error('请求错误:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const testApiRoute = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('测试 GET /api/test')
      const res = await fetch('/api/test')
      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      setResponse(data)
    } catch (err) {
      console.error('请求错误:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl mb-20">
      <h1 className="text-3xl font-bold text-center mb-8 text-pink-600">百度语音识别API测试</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <div className="text-gray-700 text-sm space-y-2">
          <p>这个页面可以帮助您测试百度语音识别API是否正常工作，尤其是对于M4A格式的文件。</p>
          <p>使用步骤：</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>首先点击"获取Token"按钮，获取百度API的访问令牌</li>
            <li>点击"选择音频文件"按钮，选择您想要测试的音频文件</li>
            <li>点击"开始识别"按钮，将音频发送到百度语音识别API</li>
            <li>查看下方的调试日志，了解处理过程和可能的错误信息</li>
          </ol>
          <p className="mt-2 text-pink-600 font-medium">备注：</p>
          <ul className="list-disc ml-5">
            <li>对于M4A格式文件，API会使用PCM格式参数进行处理</li>
            <li>如果失败，请查看错误码和错误消息，根据提示进行排查</li>
            <li>常见错误码说明：3301(音频质量问题)、3302(鉴权失败)、3303(无法识别内容)、3304(格式错误)、3305(音频过大)</li>
            <li><strong>已使用本地API路由解决跨域问题，无需额外设置</strong></li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">工具栏</h2>
        <div className="flex space-x-2">
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded"
          >
            清除日志
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">步骤 1: 获取访问令牌</h2>
        <button
          onClick={getAccessToken}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
        >
          {isProcessing ? '处理中...' : '获取Token'}
        </button>
        
        {accessToken && (
          <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
            <p className="text-sm text-green-800">访问令牌已获取: {accessToken.substring(0, 15)}...</p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">步骤 2: 选择音频文件</h2>
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*" 
            onChange={handleFileChange}
            className="hidden"
            id="audio-file"
          />
          <label 
            htmlFor="audio-file"
            className="inline-block px-4 py-2 bg-pink-500 text-white rounded-lg cursor-pointer hover:bg-pink-600 text-center"
          >
            选择音频文件
          </label>
          
          {audioFile && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm">
                已选择: <strong>{audioFile.name}</strong>
                <span className="ml-2 text-gray-500">
                  ({audioFile.type || '未知类型'}, {(audioFile.size / 1024).toFixed(2)} KB)
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">步骤 3: 识别音频</h2>
        <button
          onClick={handleRecognizeAudio}
          disabled={isProcessing || !audioFile}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg disabled:bg-pink-300"
        >
          {isProcessing ? '识别中...' : '开始识别'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">识别结果:</h3>
            <p className="text-gray-800">{result}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">调试日志</h2>
        <div className="bg-gray-100 rounded-md p-3 max-h-60 overflow-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="border-b border-gray-200 pb-1 mb-1 last:border-0">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API 路由测试</h2>
        <div className="flex space-x-2">
          <button
            onClick={testGetModels}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            测试 GET /api/gemini-local/models
          </button>
          
          <button
            onClick={testChatCompletions}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={loading}
          >
            测试 POST /api/gemini-local/chat/completions
          </button>
          
          <button
            onClick={testApiRoute}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={loading}
          >
            测试 GET /api/test
          </button>
        </div>
      </div>
      
      {loading && <p className="text-gray-600 mb-4">加载中...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">错误:</p>
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">响应:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="h-16"></div>
    </div>
  )
}

export default ApiTest 