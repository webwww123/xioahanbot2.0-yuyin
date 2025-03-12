'use client'

import React, { memo, useState, useEffect, useRef } from 'react'
import { motion, usePresence } from 'framer-motion'
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
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 为最新的消息添加额外的动画
  const isLatestMessage = index === total - 1;
  
  // Framer Motion presence检测
  const [isPresent, safeToRemove] = usePresence();
  
  // 计算打字速度 - 根据文本长度动态调整
  const getTypeInterval = () => {
    const textLength = fullText.length;
    // 基础速度
    const baseSpeed = 20; // 毫秒
    
    // 根据文本长度加快速度
    if (textLength > 200) return baseSpeed / 4; // 非常长的文本
    if (textLength > 100) return baseSpeed / 3; // 超长文本
    if (textLength > 50) return baseSpeed / 2; // 长文本
    return baseSpeed; // 短文本
  };
  
  // 重新开始打字效果
  const restartTypingEffect = () => {
    // 清除之前的间隔
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    // 重置状态
    setIsTyping(true);
    setDisplayText('');
    animationCompletedRef.current = false;
    
    // 开始新的打字效果
    let currentText = '';
    let index = 0;
    const textLength = fullText.length;
    
    // 如果文本为空，直接结束
    if (textLength === 0) {
      setIsTyping(false);
      animationCompletedRef.current = true;
      return;
    }
    
    typingIntervalRef.current = setInterval(() => {
      if (index < textLength) {
        currentText += fullText.charAt(index);
        setDisplayText(currentText);
        index++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
        animationCompletedRef.current = true;
      }
    }, getTypeInterval());
  };
  
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
    
    // 如果已经完成过动画并且内容没变，不再重复执行
    if (animationCompletedRef.current && displayText === fullText) {
      return;
    }
    
    // 重新开始打字效果
    restartTypingEffect();
    
    return () => {
      // 组件卸载时清除间隔
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [fullText, isUser, isError, isLoading]);
  
  // 强制布局更新，确保气泡大小跟随文本变化
  useEffect(() => {
    if (bubbleRef.current && !isUser && isTyping) {
      // 触发重排以更新气泡大小
      const currentHeight = bubbleRef.current.offsetHeight;
      if (currentHeight > 0) {
        bubbleRef.current.style.minHeight = `${currentHeight}px`;
      }
    }
  }, [displayText, isUser, isTyping]);
  
  return (
    <motion.div
      ref={bubbleRef}
      className={`message-bubble ${isUser ? 'self-end bg-pink-light' : 'self-start'} 
                  ${isError ? 'bg-red-100 text-red-800' : ''}
                  ${isLatestMessage ? 'animate-fade-in' : ''}`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
      }}
      transition={{ 
        duration: 0.25, 
        ease: "easeOut"
      }}
      style={{ 
        willChange: 'transform, opacity, height',
        visibility: 'visible'
      }}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1 mt-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      ) : (
        <div className="relative">
          <p className={`text-sm leading-relaxed md:text-base whitespace-pre-wrap ${isTyping && !isUser ? 'typing-effect' : ''}`}
             style={{ visibility: 'visible', opacity: 1 }}
          >
            {displayText}
            {isTyping && !isUser && (
              <span className="inline-block w-1 h-4 ml-0.5 bg-gray-500 animate-blink"></span>
            )}
          </p>
          {/* 添加一个不可见的元素，包含完整文本，用于计算正确的高度 */}
          {!isUser && isTyping && (
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 invisible whitespace-pre-wrap text-sm leading-relaxed md:text-base"
              style={{ pointerEvents: 'none' }}
            >
              {fullText}
            </div>
          )}
        </div>
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