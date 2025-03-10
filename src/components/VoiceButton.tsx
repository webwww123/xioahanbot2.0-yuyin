'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/lib/VoiceChatContext'

// 图标组件：麦克风
const MicrophoneIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-8 h-8"
  >
    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
  </svg>
)

// 图标组件：键盘
const KeyboardIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-7 h-7"
  >
    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-13.5a3 3 0 01-3-3V5.25zm3 0a.75.75 0 00-.75.75v9a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75H5.25z" clipRule="evenodd" />
    <path d="M3.75 18.75v-2.25h16.5v2.25h-16.5zM6 10.5h1.5v1.5H6v-1.5zm0-3h1.5v1.5H6v-1.5zm3 0h1.5v1.5H9v-1.5zm3 0h1.5v1.5H12v-1.5zm3 0h1.5v1.5H15v-1.5zm3 0h1.5v1.5H18v-1.5zm-9 3h1.5v1.5H9v-1.5zm3 0h1.5v1.5H12v-1.5zm3 0h1.5v1.5H15v-1.5zm3 0h1.5v1.5H18v-1.5z" />
  </svg>
)

// 图标组件：发送
const SendIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
)

// 图标组件：关闭
const CloseIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
)

// 浮动气泡组件
const FloatingBubbles = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  // 随机生成10个气泡
  const bubbles = Array.from({ length: 10 }).map((_, i) => {
    const size = Math.random() * 20 + 10; // 10-30px
    const duration = Math.random() * 3 + 2; // 2-5s
    const delay = Math.random() * 1;
    const xOffset = (Math.random() - 0.5) * 120; // -60 to 60px
    const opacity = Math.random() * 0.4 + 0.1; // 0.1-0.5
    
    return (
      <motion.div
        key={i}
        className="absolute rounded-full bg-pink-300"
        initial={{ 
          width: size, 
          height: size,
          x: xOffset,
          y: 20,
          opacity 
        }}
        animate={{ 
          y: -100, 
          opacity: 0,
        }}
        transition={{ 
          duration, 
          delay,
          ease: "easeOut",
        }}
        style={{ 
          left: `calc(50% - ${size/2}px)`,
          bottom: 0,
          filter: "blur(1px)",
        }}
      />
    );
  });
  
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{bubbles}</div>;
};

// 脉冲波组件
const PulseWaves = ({ visible }: { visible: boolean }) => (
  <div className={`absolute inset-0 ${visible ? 'opacity-100' : 'opacity-0'} transition-opacity pointer-events-none`}>
    <motion.div
      className="absolute inset-0 rounded-full bg-pink-light"
      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute inset-0 rounded-full bg-pink-light"
      animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
    />
  </div>
)

// 闪光效果组件
const Sparkles = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          initial={{ 
            opacity: 0,
            scale: 0,
            x: 0, 
            y: 0,
          }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: Math.cos(i * Math.PI / 3) * 50, 
            y: Math.sin(i * Math.PI / 3) * 50,
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 0.5,
            delay: i * 0.1,
          }}
          style={{ 
            left: '50%',
            top: '50%',
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};

interface VoiceButtonProps {
  size?: 'sm' | 'md' | 'lg'
  onText?: (text: string) => void
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  size = 'lg',
  onText
}) => {
  const { isRecording, isProcessing, startRecording, stopRecording, addMessage } = useVoiceChat()
  const controls = useAnimation()
  const [bubblesCycle, setBubblesCycle] = useState(0)
  const [isTextMode, setIsTextMode] = useState(false)
  const [text, setText] = useState('')
  const [longPressActive, setLongPressActive] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressDuration = 500 // 长按阈值，单位毫秒

  // 定期触发气泡效果
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setBubblesCycle(prev => prev + 1);
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // 尺寸映射
  const sizeMap = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  }
  
  // 点击处理
  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording()
      
      // 模拟处理语音结果
      setTimeout(() => {
        // 添加用户消息
        const userText = "这是一条语音消息示例"
        addMessage(userText, true)
        
        // 回调函数
        if (onText) onText(userText)
        
        // 模拟AI回复
        setTimeout(() => {
          addMessage("收到你的语音消息啦！我能帮你什么呢？", false)
        }, 1000)
      }, 1000)
    } else {
      startRecording()
      setBubblesCycle(prev => prev + 1)
    }
  }, [isRecording, stopRecording, addMessage, onText, startRecording])
  
  // 处理鼠标按下 - 开始计时长按
  const handleMouseDown = useCallback(() => {
    setLongPressActive(true);
    
    longPressTimer.current = setTimeout(() => {
      // 长按时间达到阈值，切换到文本模式
      setIsTextMode(true);
      setLongPressActive(false);
    }, longPressDuration);
  }, []);
  
  // 处理鼠标抬起 - 如果不是长按，则触发普通点击
  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (longPressActive && !isTextMode) {
      // 如果不是长按且不是文本模式，执行普通点击操作
      handleClick();
    }
    
    setLongPressActive(false);
  }, [longPressActive, isTextMode, handleClick]);
  
  // 处理鼠标离开 - 清除长按计时器
  const handleMouseLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressActive(false);
  }, []);
  
  // 发送文本消息
  const handleSendText = useCallback(() => {
    if (text.trim()) {
      addMessage(text, true)
      setText('')
      
      // 模拟回复
      setTimeout(() => {
        addMessage("已收到你的文字消息！有什么我能帮你的呢？", false)
      }, 1000)
      
      // 关闭文本模式
      setIsTextMode(false)
    }
  }, [text, addMessage]);
  
  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }, [handleSendText]);
  
  // 关闭文本输入模式
  const closeTextMode = useCallback(() => {
    setIsTextMode(false)
    setText('')
  }, []);
  
  // 按钮状态动画
  useEffect(() => {
    if (isRecording) {
      controls.start({
        scale: [1, 1.08, 1.05],
        rotate: [0, 2, -2, 0],
        borderRadius: ['50%', '45%', '48%'],
        boxShadow: [
          '0 0 15px rgba(255, 105, 180, 0.4)',
          '0 0 25px rgba(255, 105, 180, 0.7)',
          '0 0 20px rgba(255, 105, 180, 0.6)'
        ],
        transition: {
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotate: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          },
          borderRadius: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          },
          boxShadow: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      })
    } else if (isProcessing) {
      controls.start({
        scale: 1,
        rotate: 0,
        borderRadius: '50%',
        boxShadow: '0 0 15px rgba(255, 105, 180, 0.4)',
      })
    } else {
      controls.start({
        scale: 1,
        rotate: 0,
        borderRadius: '50%',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      })
    }
  }, [isRecording, isProcessing, controls])

  return (
    <div className="relative flex items-center justify-center">
      <PulseWaves visible={isRecording} />
      
      <div className="relative">
        {/* 气泡效果 */}
        <AnimatePresence>
          <FloatingBubbles visible={isRecording} key={bubblesCycle} />
        </AnimatePresence>
        
        {/* 闪光效果 */}
        <Sparkles visible={isRecording} />
        
        <motion.button
          className={`voice-button ${sizeMap[size]} text-white shadow-lg z-10 relative`}
          animate={controls}
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          style={{
            background: isRecording 
              ? 'linear-gradient(140deg, #FF69B4, #FF1493, #FF69B4)' 
              : 'linear-gradient(140deg, #FF9CC2, #FF69B4)',
            backgroundSize: isRecording ? '200% 200%' : '100% 100%',
            animation: isRecording ? 'gradient-shift 3s ease infinite' : 'none',
          }}
        >
          <motion.div 
            className="relative"
            animate={isRecording ? {
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {isTextMode ? <KeyboardIcon /> : <MicrophoneIcon />}
          </motion.div>
        </motion.button>
      </div>
      
      {/* 文本输入区域 */}
      <AnimatePresence>
        {isTextMode && (
          <motion.div
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-64 md:w-80"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="flex overflow-hidden rounded-full border-2 border-pink-light bg-white/90 backdrop-blur-sm shadow-lg">
              <textarea
                className="flex-1 py-2 px-4 bg-transparent resize-none focus:outline-none text-sm h-10 max-h-32 overflow-auto"
                placeholder="输入消息..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={1}
                style={{
                  height: Math.min(Math.max(text.split('\n').length, 1) * 24, 96),
                }}
              />
              <button 
                className="px-3 text-pink-deeper disabled:text-gray-300"
                disabled={!text.trim()}
                onClick={handleSendText}
              >
                <SendIcon />
              </button>
              <button 
                className="px-3 text-pink-deeper"
                onClick={closeTextMode}
              >
                <CloseIcon />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 状态提示 */}
      <motion.div
        className="absolute -bottom-8 text-center text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        {isRecording ? '正在录音...' : isProcessing ? '处理中...' : '长按打字'}
      </motion.div>
    </div>
  )
}

export default VoiceButton 