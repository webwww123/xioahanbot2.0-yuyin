'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Message, VoiceChatContextType } from '@/lib/types'
import axios from 'axios'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

// 消息类型扩展
interface ChatMessage extends Message {
  isLoading?: boolean;
  isError?: boolean;
}

// 百度语音识别API配置
const BAIDU_API_KEY = 'lTIvxWNpSHUuNBGD3tqfdiqC';
const BAIDU_SECRET_KEY = 'hq5HnLN5ieAhGg0eBLFFuiUmz7NRpupz';

// 百度API响应类型定义
interface BaiduTokenResponse {
  access_token: string;
  expires_in: number;
  [key: string]: any;
}

interface BaiduASRResponse {
  err_no: number;
  err_msg: string;
  sn: string;
  result?: string[];
  [key: string]: any;
}

// 创建上下文
const VoiceChatContext = createContext<VoiceChatContextType | null>(null)

// 上下文提供者组件的属性类型
interface VoiceChatProviderProps {
  children: React.ReactNode;
}

// 使用上下文的钩子
export const useVoiceChat = () => {
  const context = useContext(VoiceChatContext)
  if (!context) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider')
  }
  return context
}

// 上下文提供者组件
export const VoiceChatProvider: React.FC<VoiceChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPermissionGuide, setShowPermissionGuide] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputText, setInputText] = useState('')
  
  // 添加录音相关的状态和引用
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const accessTokenRef = useRef<string>('')
  const deviceIdRef = useRef<string>('')
  const permissionDeniedRef = useRef(false)

  // 生成设备ID
  const generateDeviceId = useCallback(() => {
    if (!deviceIdRef.current) {
      deviceIdRef.current = crypto.randomBytes(16).toString('hex');
    }
    return deviceIdRef.current;
  }, []);

  // 获取百度API的Access Token
  const getAccessToken = useCallback(async () => {
    if (accessTokenRef.current) return accessTokenRef.current;
    
    try {
      console.log('正在获取百度API访问令牌...');
      
      // 使用本地API路由
      try {
        const response = await axios.get<BaiduTokenResponse>('/api/baidu-token');
        console.log('访问令牌请求成功:', response.status);
        
        // 检查响应是否包含access_token
        if (!response.data || !response.data.access_token) {
          console.error('API响应中没有access_token字段:', response.data);
          throw new Error('获取访问令牌失败：响应中没有access_token');
        }
        
        accessTokenRef.current = response.data.access_token;
        console.log('成功获取访问令牌');
        return accessTokenRef.current;
      } catch (error) {
        console.error('获取访问令牌HTTP请求失败:', error);
        
        // 获取更详细的错误信息
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          
          if (axiosError.response) {
            console.error('错误响应状态码:', axiosError.response.status);
            console.error('错误响应数据:', axiosError.response.data);
          }
        }
        
        throw new Error(`获取access token失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error('获取access token过程中出现错误:', error);
      throw error;
    }
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 关闭权限指南
  const closePermissionGuide = useCallback(() => {
    setShowPermissionGuide(false)
  }, [])

  // 添加新消息 (兼容旧格式)
  const addMessage = useCallback((text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      isUser,
      content: text,  // 同时使用新格式
      role: isUser ? 'user' : 'assistant', // 同时使用新格式
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // 开始录音
  const startRecording = useCallback(async () => {
    // 如果正在录音，不执行任何操作
    if (isRecording || isProcessing) return;
    
    try {
      // 先获取访问令牌 (可以在后台静默执行)
      getAccessToken().catch(e => console.error('获取token失败，但不影响录音:', e));
      
      // 添加系统提示
      addMessage('正在准备录音...', false);
      
      console.log('请求麦克风权限...');
      
      // 简化音频参数，减少潜在问题
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      console.log('麦克风权限已授予，音轨数量:', stream.getAudioTracks().length);
      
      // 确保有音频轨道
      if (stream.getAudioTracks().length === 0) {
        throw new Error('没有获取到音频轨道');
      }
      
      // 查找支持的MIME类型
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      
      console.log('使用MIME类型:', mimeType || '默认');
      
      try {
        // 使用简化的配置创建MediaRecorder
        const options: MediaRecorderOptions = {};
        if (mimeType) options.mimeType = mimeType;
        
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        console.log('MediaRecorder创建成功, 状态:', mediaRecorderRef.current.state);
      } catch (e) {
        console.error('创建MediaRecorder失败，尝试使用默认配置', e);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }
      
      // 清空之前的音频数据
      audioChunksRef.current = [];
      
      // 设置数据处理事件
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('收到音频数据:', event.data.size, '字节');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 设置错误处理
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder错误:', event);
      };
      
      // 开始录音 (使用定时触发数据收集)
      mediaRecorderRef.current.start(1000);
      console.log('录音已开始, 状态:', mediaRecorderRef.current.state);
      
      // 更新状态
      setIsRecording(true);
      
      // 更新提示消息
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastSystemMessageIndex = updatedMessages.findIndex(
          msg => !msg.isUser && msg.text === '正在准备录音...'
        );
        
        if (lastSystemMessageIndex !== -1) {
          updatedMessages[lastSystemMessageIndex] = {
            ...updatedMessages[lastSystemMessageIndex],
            text: '正在录音，请说出您想要表达的内容...'
          };
          return updatedMessages;
        } else {
          return [...prevMessages, {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: '正在录音，请说出您想要表达的内容...',
            isUser: false,
            timestamp: Date.now(),
          }];
        }
      });
    } catch (error) {
      console.error('开始录音失败:', error);
      
      // 处理错误情况
      if (error instanceof DOMException) {
        console.error('DOMException错误:', error.name, error.message);
        
        if (error.name === 'NotAllowedError') {
          // 显示权限指南
          setShowPermissionGuide(true);
          addMessage('麦克风访问被拒绝。请看右上方的麦克风权限指南以获取帮助。', false);
        } else {
          addMessage(`无法访问麦克风: ${error.name}。请刷新页面后重试。`, false);
        }
      } else {
        // 其他类型的错误
        addMessage(`录音初始化失败: ${error instanceof Error ? error.message : String(error)}`, false);
        
        // 提供建议
        setTimeout(() => {
          addMessage('请尝试刷新页面或使用Chrome/Edge浏览器。如果问题仍存在，请查看麦克风权限指南。', false);
        }, 1000);
      }
    }
  }, [getAccessToken, addMessage, setMessages, isRecording, isProcessing]);

  // 停止录音并处理音频
  const stopRecording = useCallback(async () => {
    // 确保录音在进行中
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('没有正在进行的录音可以停止');
      setIsRecording(false);
      return;
    }
    
    console.log('停止录音...');
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      // 捕获当前使用的媒体流以确保我们可以正确停止它
      const recorder = mediaRecorderRef.current;
      const currentStream = recorder.stream;
      
      // 先手动请求最后一段数据
      try {
        if (recorder.state === 'recording' && 'requestData' in recorder) {
          recorder.requestData();
        }
      } catch (e) {
        console.warn('请求最后的录音数据失败:', e);
      }
      
      // 停止录音
      try {
        recorder.stop();
        console.log('MediaRecorder已停止');
      } catch (e) {
        console.error('停止MediaRecorder失败:', e);
      }
      
      // 等待数据处理完成，最多等待3秒
      let dataProcessed = false;
      try {
        await Promise.race([
          new Promise<void>(resolve => {
            const originalOnStop = recorder.onstop;
            recorder.onstop = (event) => {
              if (originalOnStop) {
                try {
                  // @ts-ignore
                  originalOnStop.call(recorder, event);
                } catch (e) {}
              }
              dataProcessed = true;
              resolve();
            };
          }),
          new Promise<void>(resolve => setTimeout(() => {
            if (!dataProcessed) {
              console.warn('等待录音停止超时');
            }
            resolve();
          }, 3000))
        ]);
      } catch (e) {
        console.warn('等待录音数据处理出错:', e);
      }
      
      // 检查是否收集到了音频数据
      console.log('收集到的音频块数量:', audioChunksRef.current.length);
      
      if (audioChunksRef.current.length === 0) {
        console.warn('没有收集到音频数据');
        setIsProcessing(false);
        addMessage('没有检测到语音，请检查麦克风是否正常工作', false);
        
        // 确保释放媒体流
        try {
          currentStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        
        mediaRecorderRef.current = null;
        return;
      }
      
      // 创建音频Blob
      let audioBlob;
      let mimeType = 'audio/webm';
      
      try {
        // 尝试从第一个音频块获取MIME类型
        if (audioChunksRef.current[0]?.type) {
          mimeType = audioChunksRef.current[0].type;
        }
        
        audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('创建音频Blob成功，大小:', audioBlob.size, 'bytes, MIME类型:', mimeType);
      } catch (e) {
        console.error('创建音频Blob失败，尝试不指定类型:', e);
        audioBlob = new Blob(audioChunksRef.current);
      }
      
      // 检查录音是否太短（小于500字节可能表示无实际内容）
      if (audioBlob.size < 500) {
        console.warn('录音太短，可能没有实际内容');
        setIsProcessing(false);
        addMessage('录音时间太短，请说话时间长一点再试', false);
        
        // 释放媒体流
        try {
          currentStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        
        mediaRecorderRef.current = null;
        return;
      }
      
      // 转换音频为base64
      try {
        const base64Audio = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result?.toString().split(',')[1] || null;
            resolve(result);
          };
          reader.onerror = () => {
            console.error('读取音频文件失败');
            resolve(null);
          };
          reader.readAsDataURL(audioBlob);
        });
        
        if (!base64Audio) {
          throw new Error('无法将音频转换为base64格式');
        }
        
        console.log('音频已转换为base64，长度:', base64Audio.length);
        
        // 添加用户消息，表示正在处理
        addMessage('正在识别语音...', true);
        
        // 获取访问令牌并准备API请求
        const accessToken = await getAccessToken();
        const deviceId = generateDeviceId();
        
        // 确定音频格式，百度API需要正确的格式标识
        let format = 'pcm'; // 默认使用pcm
        
        if (mimeType.includes('webm')) {
          format = 'pcm'; // 对于WebM文件使用pcm
        } else if (mimeType.includes('wav')) {
          format = 'wav';
        } else if (mimeType.includes('mp3')) {
          format = 'mp3';
        } else if (mimeType.includes('ogg')) {
          format = 'pcm'; // 处理ogg格式
        } else if (mimeType.includes('m4a') || mimeType.includes('mp4')) {
          format = 'pcm'; // 处理m4a/mp4格式
        }
        
        console.log(`调用语音识别API, 检测到MIME类型: ${mimeType}, 使用格式参数: ${format}`);
        
        // 使用本地API路由发送请求
        const response = await axios.post<BaiduASRResponse>(
          `/api/baidu-asr`,
          {
            token: accessToken,
            audio: base64Audio,
            format: format,
            len: base64Audio.length
          }
        );
        
        console.log('百度语音识别结果:', JSON.stringify(response.data));
        
        // 处理识别结果
        if (response.data.err_no === 0 && response.data.result && response.data.result.length > 0) {
          const recognizedText = response.data.result[0];
          console.log('语音识别成功:', recognizedText);
          
          // 更新用户消息
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastUserMessageIndex = updatedMessages.findIndex(
              msg => msg.isUser && msg.text === '正在识别语音...'
            );
            
            if (lastUserMessageIndex !== -1) {
              updatedMessages[lastUserMessageIndex] = {
                ...updatedMessages[lastUserMessageIndex],
                text: recognizedText
              };
            }
            
            return updatedMessages;
          });
          
          // 模拟AI回复
          setTimeout(() => {
            addMessage(`我已收到您的语音消息："${recognizedText}"。有什么我能帮您的吗？`, false);
          }, 1000);
        } else {
          console.error('语音识别失败:', response.data.err_msg || '未知错误', '错误码:', response.data.err_no);
          
          // 更新用户消息，显示错误
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastUserMessageIndex = updatedMessages.findIndex(
              msg => msg.isUser && msg.text === '正在识别语音...'
            );
            
            if (lastUserMessageIndex !== -1) {
              updatedMessages[lastUserMessageIndex] = {
                ...updatedMessages[lastUserMessageIndex],
                text: '语音识别失败，请重试'
              };
            }
            
            return updatedMessages;
          });
          
          // 添加错误消息提示
    setTimeout(() => {
            let errorMessage = '语音识别失败';
            
            // 根据错误码提供更详细的错误信息
            if (response.data.err_no === 3301) {
              errorMessage = '无法识别您的语音，请确保说话清晰并靠近麦克风';
            } else if (response.data.err_no === 3302) {
              errorMessage = '语音识别服务鉴权失败，请联系管理员';
            } else if (response.data.err_no === 3303) {
              errorMessage = '语音内容无法识别，请尝试说些其他内容';
            } else if (response.data.err_no === 3304) {
              errorMessage = '音频格式不正确，请联系管理员';
            } else if (response.data.err_no === 3305) {
              errorMessage = '语音太长，无法处理，请缩短您的发言';
            } else {
              errorMessage = `语音识别失败 (错误码: ${response.data.err_no})，请重试`;
            }
            
            addMessage(errorMessage, false);
          }, 1000);
        }
      } catch (error) {
        console.error('处理音频时出错:', error);
        setIsProcessing(false);
        
        // 更新用户消息，显示错误
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastUserMessageIndex = updatedMessages.findIndex(
            msg => msg.isUser && msg.text === '正在识别语音...'
          );
          
          if (lastUserMessageIndex !== -1) {
            updatedMessages[lastUserMessageIndex] = {
              ...updatedMessages[lastUserMessageIndex],
              text: '语音处理失败，请重试'
            };
          }
          
          return updatedMessages;
        });
        
        // 添加错误消息
        addMessage(`语音处理失败: ${error instanceof Error ? error.message : String(error)}`, false);
      } finally {
        // 释放媒体流
        try {
          currentStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        
        mediaRecorderRef.current = null;
        setIsProcessing(false);
      }
    } catch (outerError) {
      console.error('录音处理失败:', outerError);
      addMessage('录音处理出错，请重试', false);
      setIsProcessing(false);
      
      // 尝试释放资源
      try {
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {}
      
      mediaRecorderRef.current = null;
    }
  }, [addMessage, generateDeviceId, getAccessToken, setMessages]);

  // 发送文本消息
  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;

    // 创建新的用户消息
    const userMessage: Message = {
      id: uuidv4(),
      content: text,
      role: 'user',
      timestamp: Date.now(),
    };

    // 更新消息列表，添加用户消息
    setMessages((prev) => [...prev, userMessage]);

    // 创建临时的AI消息（显示加载状态）
    const tempBotId = uuidv4();
    const tempBotMessage: Message = {
      id: tempBotId,
      content: '正在思考...',
      role: 'assistant',
      timestamp: Date.now(),
      isLoading: true,
    };

    // 更新消息列表，添加临时AI消息
    setMessages((prev) => [...prev, tempBotMessage]);

    try {
      console.log('发送消息:', text);
      
      // 准备发送到API的消息历史
      const messagesToSend = messages
        .filter(m => !m.isLoading) // 过滤掉加载中的消息
        .concat(userMessage)  // 添加最新的用户消息
        .map(m => ({
          role: m.role || (m.isUser ? 'user' : 'assistant'),
          content: m.content || m.text || ''
        }));

      console.log('准备发送的消息历史:', messagesToSend);
      
      // 构建请求体
      const payload = {
        model: 'gemini-2.0-pro-exp-02-05',
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 800,
      };
      
      console.log('API请求体:', JSON.stringify(payload));
      
      // 使用本地 API 代理发送请求
      const response = await fetch('/api/gemini-local/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败 (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API响应:', data);
      
      // 从响应中提取AI回复
      const botResponse = data.choices[0]?.message?.content || '抱歉，我无法生成回复。';
      
      // 更新AI消息 - 不再设置isLoading，但保留消息ID
      setMessages(prev => 
        prev.map(m => 
          m.id === tempBotId 
            ? {
                ...m,
                content: botResponse,
                text: botResponse, // 同时更新旧格式属性，确保兼容性
                isLoading: false,
              }
            : m
        )
      );
      
    } catch (error) {
      console.error('发送消息时出错:', error);
      
      // 更新AI消息为错误状态
      setMessages(prev => 
        prev.map(m => 
          m.id === tempBotId 
            ? {
                ...m,
                content: `抱歉，发生了错误: ${error instanceof Error ? error.message : '未知错误'}`,
                text: `抱歉，发生了错误: ${error instanceof Error ? error.message : '未知错误'}`, // 同时更新旧格式属性
                isLoading: false,
                isError: true,
              }
            : m
        )
      );
    }
  };

  // 创建上下文值
  const contextValue = useMemo<VoiceChatContextType>(
    () => ({
      messages,
      isRecording,
      isProcessing,
      startRecording,
      stopRecording,
      addMessage,
      clearMessages,
      sendTextMessage,
      isSubmitting,
      inputText,
      setInputText,
      showPermissionGuide,
      closePermissionGuide,
    }),
    [
      messages,
      isRecording,
      isProcessing,
      startRecording,
      stopRecording,
      addMessage,
      clearMessages,
      isSubmitting,
      inputText,
      setInputText,
      showPermissionGuide,
      closePermissionGuide,
    ]
  );

  return (
    <VoiceChatContext.Provider value={contextValue}>
      {children}
    </VoiceChatContext.Provider>
  )
} 