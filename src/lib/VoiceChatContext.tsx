'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Message, VoiceChatContextType } from '@/lib/types'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

// 消息类型扩展
interface ChatMessage extends Message {
  isLoading?: boolean;
  isError?: boolean;
  audioUrl?: string; // 增加音频URL属性
  audioDuration?: number; // 增加音频时长属性
}

// 百炼API消息格式
interface BailianMessage {
  role: string;
  content: string | BailianContent[];
}

// 百炼API内容格式
type BailianContent = 
  | { type: 'text'; text: string }
  | { type: 'input_audio'; input_audio: { data: string; format: string } };

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
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  
  // 添加录音相关的状态和引用
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const deviceIdRef = useRef<string>('')
  const permissionDeniedRef = useRef(false)

  // 生成设备ID
  const generateDeviceId = useCallback(() => {
    if (!deviceIdRef.current) {
      deviceIdRef.current = crypto.randomBytes(16).toString('hex');
    }
    return deviceIdRef.current;
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
  const addMessage = useCallback((text: string, isUser: boolean, audioUrl?: string, audioDuration?: number) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      isUser,
      content: text,  // 同时使用新格式
      role: isUser ? 'user' : 'assistant', // 同时使用新格式
      timestamp: Date.now(),
      audioUrl,
      audioDuration
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // 播放音频
  const playAudio = useCallback((url: string) => {
    // 如果已经有正在播放的音频，先停止它
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    console.log('尝试播放音频:', url);
    
    // 创建新的音频元素
    let audio: HTMLAudioElement;
    
    // 检查是否是Blob URL
    if (url.startsWith('blob:')) {
      // 尝试从全局存储获取Blob
      if (window.audioBlobs && window.audioBlobs[url]) {
        console.log('从全局存储中获取音频Blob');
        const blob = window.audioBlobs[url];
        // 为防止内存泄漏，创建一个新的URL
        const newUrl = URL.createObjectURL(blob);
        audio = new Audio(newUrl);
        
        // 播放完成后释放URL
        audio.onended = () => {
          URL.revokeObjectURL(newUrl);
          setCurrentAudio(null);
        };
      } else {
        console.log('直接使用Blob URL');
        audio = new Audio(url);
        audio.onended = () => setCurrentAudio(null);
      }
    } else {
      // 处理常规URL
      console.log('使用常规URL');
      audio = new Audio(url);
      audio.onended = () => setCurrentAudio(null);
    }
    
    setCurrentAudio(audio);
    
    // 播放音频
    audio.play().catch(err => {
      console.error('播放音频失败:', err);
      // 尝试其他方式播放
      try {
        const newAudio = document.createElement('audio');
        newAudio.src = url;
        newAudio.play().catch(e => console.error('二次尝试播放失败:', e));
      } catch (e) {
        console.error('创建备用音频元素失败:', e);
      }
    });
  }, [currentAudio]);

  // 开始录音
  const startRecording = useCallback(async () => {
    // 如果正在录音，不执行任何操作
    if (isRecording || isProcessing) return;
    
    try {
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
      // 按优先级尝试不同音频格式
      const mimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
        'audio/aac'
      ];

      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log(`使用支持的MIME类型: ${mimeType}`);
          break;
        }
      }

      if (!mimeType) {
        console.warn('未找到明确支持的MIME类型，将使用默认格式');
      }
      
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
      
      // 记录开始时间
      setRecordingStartTime(Date.now());
      
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
  }, [addMessage, setMessages, isRecording, isProcessing]);

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
      
      // 计算录音时长
      const recordingDuration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
      setRecordingStartTime(null);
      
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
      
      // 创建音频URL供播放
      const audioBlob2 = new Blob(audioChunksRef.current.slice(), { type: mimeType }); // 创建副本
      const audioUrl = URL.createObjectURL(audioBlob2);
      console.log('创建音频URL:', audioUrl);
      
      // 全局存储Blob以防止被垃圾回收
      if (typeof window !== 'undefined') {
        if (!window.audioBlobs) {
          window.audioBlobs = {};
        }
        window.audioBlobs[audioUrl] = audioBlob2;
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
        
        // 创建新的语音消息
        const userMessageId = uuidv4();
        const userMessage: Message = {
          id: userMessageId,
          content: '[语音消息]',
          text: '[语音消息]',
          role: 'user',
          isUser: true,
          timestamp: Date.now(),
          audioUrl: audioUrl,
          audioDuration: recordingDuration || 1
        };
        
        // 在控制台打印语音消息信息（调试用）
        console.log('创建语音消息:', {
          id: userMessageId,
          audioUrl,
          audioDuration: recordingDuration || 1,
          audioSize: audioBlob.size
        });
        
        // 更新消息列表，添加用户语音消息
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
        
        // 确定音频格式
        let format = 'mp3'; // 默认格式
        if (mimeType.includes('webm')) {
          format = 'webm';
        } else if (mimeType.includes('wav')) {
          format = 'wav';
        } else if (mimeType.includes('ogg')) {
          format = 'ogg';
        } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
          format = 'mp4';
        }
        
        // 准备发送到API的消息历史
        const messagesToSend = messages
          .filter(m => !m.isLoading) // 过滤掉加载中的消息
          .map(m => ({
            role: m.role || (m.isUser ? 'user' : 'assistant'),
            content: m.content || m.text || ''
          })) as BailianMessage[];
        
        // 添加带有音频的用户消息
        messagesToSend.push({
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: `data:;base64,${base64Audio}`,
                format: format
              }
            }
          ]
        } as BailianMessage);
        
        // 构建请求体
        const payload = {
          model: 'qwen-omni-turbo',
          messages: messagesToSend,
          stream: true,
          stream_options: {
            include_usage: true
          },
          modalities: ['text']
        };
        
        console.log('API请求体:', JSON.stringify(payload));
        
        // 使用百炼API发送请求
        const response = await fetch('/api/bailian-local/chat/completions', {
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
        
        // 处理流式响应，先初始化变量
        let fullResponse = '';
        
        // 处理流式响应
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6);
                  if (jsonStr === '[DONE]') {
                    console.log('流式响应完成');
                    continue;
                  }
                  
                  try {
                    const jsonData = JSON.parse(jsonStr);
                    
                    // 检查是否有内容更新
                    if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                      const contentFragment = jsonData.choices[0].delta.content;
                      fullResponse += contentFragment;
                      
                      // 更新AI回复消息
                      setMessages(prev => 
                        prev.map(m => 
                          m.id === tempBotId 
                            ? {
                                ...m,
                                content: fullResponse,
                                text: fullResponse, // 兼容旧格式
                                isLoading: true,
                              }
                            : m
                        )
                      );
                    }
                  } catch (e) {
                    console.warn('解析流式响应数据失败:', e);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
        
        // 完成加载，更新最终消息
        setMessages(prev => 
          prev.map(m => 
            m.id === tempBotId 
              ? {
                  ...m,
                  content: fullResponse || '抱歉，我无法理解您的语音。',
                  text: fullResponse || '抱歉，我无法理解您的语音。', // 兼容旧格式
                  isLoading: false,
                }
              : m
          )
        );
        
      } catch (error) {
        console.error('处理音频时出错:', error);
        setIsProcessing(false);
        
        addMessage('语音处理失败，请重试', true);
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
  }, [addMessage, setMessages, recordingStartTime]);

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
        })) as BailianMessage[];

      console.log('准备发送的消息历史:', messagesToSend);
      
      // 构建请求体
      const payload = {
        model: 'qwen-omni-turbo',
        messages: messagesToSend,
        stream: true,
        stream_options: {
          include_usage: true
        }
      };
      
      console.log('API请求体:', JSON.stringify(payload));
      
      // 使用百炼 API 代理发送请求
      const response = await fetch('/api/bailian-local/chat/completions', {
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
      
      // 初始化一个空的响应内容
      let fullContent = '';
      
      // 设置初始的流式响应
      setMessages(prev => 
        prev.map(m => 
          m.id === tempBotId 
            ? {
                ...m,
                content: '',
                text: '', // 同时更新旧格式属性，确保兼容性
                isLoading: true,
              }
            : m
        )
      );

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') {
                  console.log('流式响应完成');
                  continue;
                }
                
                try {
                  const jsonData = JSON.parse(jsonStr);
                  
                  // 检查是否有内容更新
                  if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                    const contentFragment = jsonData.choices[0].delta.content;
                    fullContent += contentFragment;
                    
                    // 更新消息内容
                    setMessages(prev => 
                      prev.map(m => 
                        m.id === tempBotId 
                          ? {
                              ...m,
                              content: fullContent,
                              text: fullContent, // 同时更新旧格式属性，确保兼容性
                              isLoading: true,
                            }
                          : m
                      )
                    );
                  }
                } catch (e) {
                  console.warn('解析流式响应数据失败:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      // 完成加载，更新最终消息
      setMessages(prev => 
        prev.map(m => 
          m.id === tempBotId 
            ? {
                ...m,
                content: fullContent || '抱歉，我无法生成回复。',
                text: fullContent || '抱歉，我无法生成回复。', // 同时更新旧格式属性，确保兼容性
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
      playAudio
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
      playAudio
    ]
  );

  // 在组件卸载时清理所有Blob URL
  useEffect(() => {
    return () => {
      // 清理当前播放的音频
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      
      // 清理所有存储的Blob
      if (window.audioBlobs) {
        Object.keys(window.audioBlobs).forEach(url => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('释放URL失败:', url, e);
          }
        });
        window.audioBlobs = {};
      }
    };
  }, [currentAudio]);

  return (
    <VoiceChatContext.Provider value={contextValue}>
      {children}
    </VoiceChatContext.Provider>
  )
} 