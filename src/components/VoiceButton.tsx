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
const SendIcon = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClass = size === 'large' ? 'w-6 h-6' : size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={sizeClass}
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
};

// 图标组件：关闭
const CloseIcon = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClass = size === 'large' ? 'w-6 h-6' : size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={sizeClass}
    >
      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
};

// 图标组件：聊天
const ChatIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
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

// 转换粒子效果组件
const TransformParticles = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 70;
        const size = Math.random() * 6 + 4;
        const delay = Math.random() * 0.2;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-pink-300 rounded-full"
            initial={{ 
              opacity: 1,
              scale: 0,
              x: 0, 
              y: 0,
            }}
            animate={{ 
              opacity: [1, 0],
              scale: [0, 1],
              x: Math.cos(angle) * distance, 
              y: Math.sin(angle) * distance,
            }}
            transition={{ 
              duration: 0.7,
              delay,
              ease: "easeOut"
            }}
            style={{ 
              left: '50%',
              top: '50%',
              width: size,
              height: size
            }}
          />
        );
      })}
    </div>
  );
};

// 装饰性心形
const HeartDecoration = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {Array.from({ length: 8 }).map((_, i) => {
        const delay = 0.1 + i * 0.08;
        const offsetX = (Math.random() - 0.5) * 180;
        const offsetY = -120 - Math.random() * 60;
        const size = Math.random() * 22 + 10;
        const opacity = Math.random() * 0.6 + 0.3;
        const duration = 1.8 + Math.random() * 0.7;
        
        return (
          <motion.div
            key={i}
            className="absolute text-pink-300"
            initial={{ 
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0
            }}
            animate={{ 
              scale: [0, 1, 0.8],
              x: offsetX,
              y: offsetY,
              opacity: [0, opacity, 0]
            }}
            transition={{ 
              duration,
              delay,
              ease: "easeOut"
            }}
            style={{ 
              left: '50%',
              top: '50%',
              fontSize: size
            }}
          >
            ❤
          </motion.div>
        );
      })}
    </div>
  );
};

interface VoiceButtonProps {
  size?: 'sm' | 'md' | 'lg'
  onText?: (text: string) => void
}

// 在文件顶部添加全局样式（组件外部）
const globalStyles = `
  /* 隐藏滚动条但保留滚动功能 - Chrome, Safari, Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// 增加窗口尺寸检测钩子
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    // 仅在客户端执行
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化尺寸
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
};

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  size = 'lg',
  onText
}) => {
  const { addMessage, isRecording, isProcessing, startRecording, stopRecording } = useVoiceChat()
  const controls = useAnimation()
  const [bubblesCycle, setBubblesCycle] = useState(0)
  const [waveCycle, setWaveCycle] = useState(0)
  
  // 窗口尺寸检测
  const windowSize = useWindowSize()
  
  // 状态管理
  const [text, setText] = useState('')
  const [isTextMode, setIsTextMode] = useState(false)
  const [textBoxExpanded, setTextBoxExpanded] = useState(false)
  const [showFloatingBubbles, setShowFloatingBubbles] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const [showTransformParticles, setShowTransformParticles] = useState(false)
  const [showHeartDecoration, setShowHeartDecoration] = useState(false)
  const [isChatIconVisible, setIsChatIconVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false) // 添加关闭动画状态

  // 注入全局样式
  useEffect(() => {
    // 创建style元素
    const styleElement = document.createElement('style');
    styleElement.innerHTML = globalStyles;
    // 添加到head
    document.head.appendChild(styleElement);
    
    // 清理函数
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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
  
  // 在VoiceButton组件内获取窗口尺寸
  const { width: windowWidth } = useWindowSize();
  const isDesktop = windowWidth >= 768; // 桌面设备的断点
  
  // 处理点击 - 简化为只处理录音功能
  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording()
      // 实际的语音处理已经移至VoiceChatContext中
    } else {
      startRecording()
      setBubblesCycle(prev => prev + 1)
    }
  }, [isRecording, stopRecording, startRecording])
  
  // 简化鼠标按下处理 - 移除长按逻辑
  const handleMouseDown = useCallback(() => {
    // 只进行普通点击处理，无长按逻辑
    if (textBoxExpanded) return; // 如果文本框已展开，不执行点击逻辑
  }, [textBoxExpanded]);
  
  // 简化鼠标抬起处理 - 只处理普通点击
  const handleMouseUp = useCallback(() => {
    if (textBoxExpanded) return; // 如果文本框已展开，不执行点击逻辑
    
    // 执行普通点击操作
    handleClick();
  }, [handleClick, textBoxExpanded]);
  
  // 简化鼠标离开处理
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    // 检查鼠标是否移到了聊天图标上
    // 获取事件的相关目标元素
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    // 如果相关目标是聊天图标或其子元素，则不执行任何操作
    if (relatedTarget && 
        (relatedTarget.classList.contains('chat-icon-button') || 
         relatedTarget.closest('.chat-icon-button'))) {
      return;
    }
  }, []);
  
  // 发送文本消息
  const handleSendText = useCallback(() => {
    if (text.trim()) {
      // 如果提供了onText回调，则使用它
      if (onText) {
        onText(text);
      } else {
        // 否则使用原来的处理方式 - 仅在addMessage存在时调用
        if (addMessage) {
          addMessage(text, true)
          
          // 模拟回复
          setTimeout(() => {
            addMessage("已收到你的文字消息！有什么我能帮你的呢？", false)
          }, 1000)
        }
      }
      
      setText('')
      
      // 触发心形装饰动画
      setShowHeartDecoration(true)
      setTimeout(() => {
        setShowHeartDecoration(false)
      }, 2500)
      
      // 关闭文本模式
      if (!textBoxExpanded) {
        setIsTextMode(false)
      }
    }
  }, [text, addMessage, textBoxExpanded, onText]);
  
  // 处理聊天图标点击 - 展开文本框
  const handleChatIconClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到按钮
    setTextBoxExpanded(true);
    setIsClosing(false); // 确保关闭状态为false
    
    // 添加触发粒子效果的状态
    setShowTransformParticles(true);
    
    // 自动隐藏粒子效果
    setTimeout(() => {
      setShowTransformParticles(false);
    }, 700);
  }, []);
  
  // 关闭文本框 - 添加动画
  const closeTextBox = useCallback((e?: React.MouseEvent) => {
    // 防止事件冒泡
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    console.log('关闭按钮被点击');
    
    // 防止重复点击
    if (isClosing) return;
    
    // 设置为关闭中状态，但不立即隐藏组件
    setIsClosing(true);
    
    // 触发粒子效果
    setShowTransformParticles(true);
    setTimeout(() => {
      setShowTransformParticles(false);
    }, 700);
    
    // 延迟关闭，等待动画完成
    setTimeout(() => {
      setTextBoxExpanded(false);
      setText('');
      setIsClosing(false);
    }, 600); // 等待动画完成
  }, [isClosing]);
  
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

  // 在组件挂载后设置聊天图标为可见状态
  useEffect(() => {
    // 确保聊天图标在组件挂载后显示
    setIsChatIconVisible(true);
    
    // 组件卸载时清理
    return () => {
      setIsChatIconVisible(false);
    };
  }, []);

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
        
        {/* 转换粒子效果 */}
        <TransformParticles visible={showTransformParticles} />
        
        {/* 心形装饰 */}
        <HeartDecoration visible={showHeartDecoration} />
        
        {textBoxExpanded ? (
          // 展开后的文本输入框
          <motion.div
            initial={{ 
              width: size === 'lg' ? 96 : size === 'md' ? 80 : 56, 
              height: size === 'lg' ? 96 : size === 'md' ? 80 : 56,
              borderRadius: '50%',
              backgroundColor: '#FF69B4'
            }}
            animate={{ 
              width: isClosing 
                ? (size === 'lg' ? 96 : size === 'md' ? 80 : 56) // 关闭时恢复到初始大小
                : (isDesktop ? 'clamp(380px, 40vw, 550px)' : 'clamp(300px, 85vw, 400px)'), // 正常展开尺寸
              height: isClosing 
                ? (size === 'lg' ? 96 : size === 'md' ? 80 : 56) // 关闭时恢复到初始高度
                : (isDesktop ? '65px' : '60px'), // 正常展开高度
              borderRadius: isClosing 
                ? '50%' // 关闭时恢复到圆形
                : (isDesktop ? '32px' : '30px'), // 正常展开边框
              backgroundColor: isClosing 
                ? '#FF69B4' // 关闭时恢复到粉色
                : 'rgba(255, 255, 255, 0.9)', // 正常展开颜色
              boxShadow: isClosing
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                : '0px 8px 20px rgba(255, 105, 180, 0.35)',
            }}
            transition={{ 
              duration: 0.6, 
              ease: [0.19, 1, 0.22, 1] 
            }}
            className="relative overflow-hidden backdrop-blur-sm border-[1.5px] border-pink-200 z-30"
          >
            {/* 背景装饰 */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: isClosing ? 0 : 1 }}
              transition={{ delay: isClosing ? 0 : 0.2, duration: 0.4 }}
            >
              <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 opacity-30 blur-xl" />
              <div className="absolute -bottom-2 -left-6 w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 to-pink-100 opacity-20 blur-xl" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isClosing ? 0 : 1 }}
              transition={{ delay: isClosing ? 0 : 0.3, duration: 0.3 }}
              className={`flex h-full items-center ${isDesktop ? 'px-5 gap-3' : 'px-4 gap-2'}`}
              onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
            >
              {/* 左侧输入指示图标 */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isClosing ? 0 : 1, opacity: isClosing ? 0 : 0.7 }}
                transition={{ 
                  delay: isClosing ? 0 : 0.25, 
                  duration: 0.3, 
                  ease: "easeOut" 
                }}
                className={`text-pink-400 ${isDesktop ? 'w-6 h-6' : 'w-5 h-5'}`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-full h-full"
                >
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
                  <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
                </svg>
              </motion.div>
              
              {/* 输入框 */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: isClosing ? 0.9 : 1, opacity: isClosing ? 0 : 1 }}
                transition={{ 
                  delay: isClosing ? 0 : 0.35, 
                  duration: isClosing ? 0.3 : 0.4, 
                  ease: "easeOut" 
                }}
                className="flex-1 relative"
              >
                <textarea
                  className={`w-full bg-transparent resize-none focus:outline-none scrollbar-hide text-gray-700 ${isDesktop ? 'py-3 px-2 text-base' : 'py-[10px] px-2 text-sm'}`}
                  placeholder="憨大人请讲..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: isDesktop ? '40px' : '36px',
                    maxHeight: isDesktop ? '112px' : '96px',
                    marginTop: '4px'  // 添加上边距
                  }}
                />
                
                {/* 输入框底部装饰线 */}
                <motion.div 
                  className={`absolute -bottom-1 left-0 right-0 bg-gradient-to-r from-transparent via-pink-300 to-transparent ${isDesktop ? 'h-[3px]' : 'h-[2px]'}`}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.5 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                />
              </motion.div>
              
              {/* 按钮组 */}
              <motion.div 
                className={`flex ${isDesktop ? 'gap-2' : 'gap-1'}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: isClosing ? 0 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button 
                  className={`text-white bg-gradient-to-r from-pink-400 to-pink-500 rounded-full hover:shadow-md ${isDesktop ? 'p-3' : 'p-[10px]'}`}
                  disabled={!text.trim()}
                  onClick={handleSendText}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 15 }}
                  whileHover={{ scale: 1.1, filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.9 }}
                  style={{ opacity: text.trim() ? 1 : 0.5 }}
                >
                  <SendIcon size={isDesktop ? 'large' : 'default'} />
                </motion.button>
                <motion.button 
                  className={`text-pink-500 bg-pink-100 rounded-full hover:bg-pink-200 z-50 ${isDesktop ? 'p-3 min-w-[48px] min-h-[48px]' : 'p-[10px] min-w-[40px] min-h-[40px]'}`}
                  onClick={(e) => closeTextBox(e)}
                  onMouseDown={(e) => e.stopPropagation()} 
                  onTouchStart={(e) => e.stopPropagation()}
                  initial={{ scale: 0, rotate: 45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 15 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CloseIcon size={isDesktop ? 'large' : 'default'} />
                </motion.button>
              </motion.div>
            </motion.div>
            
            {/* 装饰小点 */}
            <motion.div 
              className="absolute top-[10px] left-[15px] w-[4px] h-[4px] rounded-full bg-pink-300"
              initial={{ scale: 0 }}
              animate={{ scale: isClosing ? 0 : 1 }}
              transition={{ delay: isClosing ? 0 : 0.7, duration: 0.3 }}
            />
            <motion.div 
              className="absolute bottom-[10px] right-[15px] w-[4px] h-[4px] rounded-full bg-pink-300"
              initial={{ scale: 0 }}
              animate={{ scale: isClosing ? 0 : 1 }}
              transition={{ delay: isClosing ? 0 : 0.8, duration: 0.3 }}
            />
            
            {/* 边缘闪光效果 */}
            <motion.div 
              className="absolute top-0 left-1/2 h-full w-[40%] bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              initial={{ x: -200 }}
              animate={{ x: isClosing ? -200 : 200 }}
              transition={{ delay: isClosing ? 0 : 0.7, duration: 1.5, ease: "easeInOut" }}
            />
          </motion.div>
        ) : (
          // 默认语音按钮
          <div className="relative">
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
                <MicrophoneIcon />
              </motion.div>
            </motion.button>
          </div>
        )}
        
        {/* 聊天图标 - 完全独立渲染，不受按钮状态影响 */}
        {!textBoxExpanded && isChatIconVisible && (
          <div 
            className="absolute -bottom-1 -right-1 z-30"
            style={{ pointerEvents: 'auto' }}
          >
            <motion.button
              className="chat-icon-button w-9 h-9 bg-pink-300 shadow-md rounded-full flex items-center justify-center text-white border-2 border-white"
              onClick={(e) => {
                e.stopPropagation();
                handleChatIconClick(e);
              }}
              whileHover={{ scale: 1.1, backgroundColor: '#FF69B4' }}
              whileTap={{ scale: 0.9 }}
              initial={false}
            >
              <ChatIcon />
            </motion.button>
          </div>
        )}
      </div>
      
      {/* 文本输入区域 - 长按触发的原有逻辑 */}
      <AnimatePresence>
        {isTextMode && !textBoxExpanded && (
          <motion.div
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-64 md:w-80"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="flex overflow-hidden rounded-full border-2 border-pink-light bg-white/90 backdrop-blur-sm shadow-lg">
              <textarea
                className={`w-full bg-transparent resize-none focus:outline-none scrollbar-hide text-gray-700 ${isDesktop ? 'py-3 px-2 text-base' : 'py-[10px] px-2 text-sm'}`}
                placeholder="憨大人请讲"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: isDesktop ? '40px' : '36px',
                  maxHeight: isDesktop ? '112px' : '96px',
                }}
              />
              <button 
                className="px-3 text-pink-deeper disabled:text-gray-300"
                disabled={!text.trim()}
                onClick={handleSendText}
              >
                <SendIcon size={isDesktop ? 'large' : 'default'} />
              </button>
              <button 
                className="px-3 text-pink-deeper"
                onClick={closeTextMode}
              >
                <CloseIcon size={isDesktop ? 'large' : 'default'} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 状态提示 */}
      <motion.div
        className="absolute -bottom-8 text-center text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: textBoxExpanded ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {isRecording ? '' : isProcessing ? '' : ''}
      </motion.div>
    </div>
  )
}

export default VoiceButton 