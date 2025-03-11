'use client'

import React, { memo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { type Message } from '@/lib/types'

interface MessageBubbleProps {
  message: Message
  index: number
  total: number
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  index,
  total
}) => {
  // 处理新旧消息格式
  const isUser = message.isUser !== undefined 
    ? message.isUser 
    : message.role === 'user';
    
  const fullText = message.text || message.content || '';
  
  // 显示加载中状态
  const isLoading = message.isLoading === true;
  
  // 显示错误状态
  const isError = message.isError === true;
  
  // 用于动态显示文本的状态
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 记录是否已经完成了动画
  const animationCompletedRef = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // 当消息内容变化或加载完成时，开始逐字显示效果
  useEffect(() => {
    // 如果是用户消息，或者是错误消息，直接显示全文
    if (isUser || isError || isLoading) {
      setDisplayText(fullText);
      return;
    }
    
    // 如果消息内容为空，不处理
    if (!fullText) {
      setDisplayText('');
      return;
    }
    
    // 如果已经完成过动画，不再重复执行
    if (animationCompletedRef.current && displayText === fullText) {
      return;
    }
    
    // 重置状态，准备开始新的打字效果
    setIsTyping(true);
    
    // 从第一个字符开始
    let currentText = '';
    let index = 0;
    const textLength = fullText.length;
    
    // 计算打字速度 - 根据文本长度动态调整
    const getTypeInterval = () => {
      // 基础速度
      const baseSpeed = 20; // 毫秒
      
      // 根据文本长度加快速度
      if (textLength > 200) return baseSpeed / 4; // 非常长的文本
      if (textLength > 100) return baseSpeed / 3; // 超长文本
      if (textLength > 50) return baseSpeed / 2; // 长文本
      return baseSpeed; // 短文本
    };
    
    // 如果文本为空，直接结束
    if (textLength === 0) {
      setIsTyping(false);
      animationCompletedRef.current = true;
      return;
    }
    
    const interval = setInterval(() => {
      if (index < textLength) {
        currentText += fullText.charAt(index);
        setDisplayText(currentText);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        animationCompletedRef.current = true;
      }
    }, getTypeInterval());
    
    return () => clearInterval(interval);
  }, [fullText, isUser, isError, isLoading]);
  
  return (
    <motion.div
      ref={bubbleRef}
      className={`message-bubble ${isUser ? 'self-end bg-pink-light' : 'self-start'} 
                  ${isError ? 'bg-red-100 text-red-800' : ''}`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
      }}
      transition={{ 
        duration: 0.25, 
        ease: "easeOut"
      }}
      layout="size"
      layoutDependency={displayText.length}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed md:text-base whitespace-pre-wrap">
          {displayText}
          {isTyping && !isUser && (
            <span className="inline-block w-1 h-4 ml-0.5 bg-gray-500 animate-blink"></span>
          )}
        </p>
      )}
      
      {/* 小装饰 */}
      <motion.div 
        className={`absolute ${isUser ? '-right-1' : '-left-1'} bottom-0 w-3 h-3 rounded-full bg-pink`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        style={{ opacity: 0.2 }}
      />
      
      {/* 消息时间指示器 */}
      <div className="absolute bottom-0 right-0 -mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <small className="text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </small>
      </div>
    </motion.div>
  )
}

export default memo(MessageBubble) 