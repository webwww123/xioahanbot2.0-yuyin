import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * 消息滚动处理的自定义Hook
 * 
 * @param {Object} options - 配置选项
 * @param {number} options.messagesLength - 消息数组的长度，用于检测新消息
 * @param {number} options.bottomThreshold - 距离底部多少距离被视为"接近底部"（默认100px）
 * @param {ScrollBehavior} options.defaultScrollBehavior - 默认滚动行为（默认'smooth'）
 * @param {number} options.scrollDelay - 滚动延迟时间，单位毫秒（默认150ms）
 * @returns {Object} - 返回滚动相关的状态和方法
 */
export function useMessageScroll({
  messagesLength,
  bottomThreshold = 100,
  defaultScrollBehavior = 'smooth',
  scrollDelay = 150
}: {
  messagesLength: number;
  bottomThreshold?: number;
  defaultScrollBehavior?: ScrollBehavior;
  scrollDelay?: number;
}) {
  // 引用容器DOM元素
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 状态管理
  const [userScrolled, setUserScrolled] = useState(false)
  const [lastScrollPosition, setLastScrollPosition] = useState(0)
  const [lastMessagesLength, setLastMessagesLength] = useState(0)
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false)
  
  // 跟踪上次滚动时间以防止频繁滚动
  const lastScrollTimeRef = useRef<number>(0)
  
  // 检测是否靠近底部
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return true
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    return scrollHeight - scrollTop - clientHeight < bottomThreshold
  }, [bottomThreshold])
  
  // 滚动到底部的函数 - 简化版本，避免过多的延迟处理
  const scrollToBottom = useCallback((behavior: ScrollBehavior = defaultScrollBehavior) => {
    if (containerRef.current) {
      const now = Date.now()
      
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        if (containerRef.current) {
          // 精确计算滚动位置
          const scrollHeight = containerRef.current.scrollHeight
          const clientHeight = containerRef.current.clientHeight
          
          containerRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: behavior
          })
          
          lastScrollTimeRef.current = now
        }
      })
    }
  }, [defaultScrollBehavior])
  
  // 强制立即滚动到底部，用于处理流式打字效果
  const forceScrollToBottom = useCallback(() => {
    if (containerRef.current) {
      const scrollHeight = containerRef.current.scrollHeight
      const clientHeight = containerRef.current.clientHeight
      
      containerRef.current.scrollTop = scrollHeight - clientHeight
    }
  }, [])
  
  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const { scrollTop } = containerRef.current
    
    // 用户主动向上滚动的情况
    if (scrollTop < lastScrollPosition && !isNearBottom()) {
      setUserScrolled(true)
    }
    
    // 用户已经滚动到接近底部，重置userScrolled状态
    if (isNearBottom()) {
      setUserScrolled(false)
      setShowNewMessageIndicator(false)
    }
    
    setLastScrollPosition(scrollTop)
  }, [lastScrollPosition, isNearBottom])
  
  // 注册滚动事件监听器
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      
      // 初始化时设置滚动位置到底部
      if (messagesLength > 0 && !userScrolled) {
        scrollToBottom('auto')
      }
      
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, messagesLength, userScrolled, scrollToBottom])
  
  // 新消息到达时自动滚动
  useEffect(() => {
    // 检查是否有新消息到达
    const hasNewMessages = messagesLength > lastMessagesLength
    
    if (hasNewMessages) {
      // 如果用户没有主动滚动，或者是第一条消息，滚动到底部
      if (!userScrolled || messagesLength === 1) {
        scrollToBottom()
      } else if (userScrolled) {
        // 如果用户已滚动且有新消息，显示新消息提示
        setShowNewMessageIndicator(true)
      }
      
      setLastMessagesLength(messagesLength)
    }
  }, [messagesLength, lastMessagesLength, userScrolled, scrollToBottom])
  
  // 窗口resize时也重新检查滚动位置
  useEffect(() => {
    const handleResize = () => {
      if (!userScrolled) {
        scrollToBottom()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [userScrolled, scrollToBottom])
  
  return {
    containerRef,
    userScrolled,
    showNewMessageIndicator,
    scrollToBottom,
    forceScrollToBottom,
    isNearBottom,
    resetScroll: () => {
      setUserScrolled(false)
      setShowNewMessageIndicator(false)
      scrollToBottom()
    }
  }
} 