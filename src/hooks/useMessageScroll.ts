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
  
  // 滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = defaultScrollBehavior) => {
    if (containerRef.current && !userScrolled) {  // 只有在用户没有交互时才滚动
      const now = Date.now()
      requestAnimationFrame(() => {
        if (containerRef.current) {
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
  }, [defaultScrollBehavior, userScrolled])
  
  // 强制滚动到底部
  const forceScrollToBottom = useCallback(() => {
    if (containerRef.current && !userScrolled) {  // 同样遵循用户交互状态
      const scrollHeight = containerRef.current.scrollHeight
      const clientHeight = containerRef.current.clientHeight
      containerRef.current.scrollTop = scrollHeight - clientHeight
    }
  }, [userScrolled])
  
  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const { scrollTop } = containerRef.current
    
    // 用户主动滚动时
    if (Math.abs(scrollTop - lastScrollPosition) > 10) {
      setUserScrolled(true)
    }
    
    // 只有当用户手动滚动到底部时才重置状态
    if (isNearBottom() && Math.abs(scrollTop - lastScrollPosition) > 10) {
      setUserScrolled(false)
      setShowNewMessageIndicator(false)
    }
    
    setLastScrollPosition(scrollTop)
  }, [lastScrollPosition, isNearBottom])
  
  // 处理用户交互
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const handleUserInteraction = () => {
      setUserScrolled(true)
    }
    
    container.addEventListener('touchstart', handleUserInteraction, { passive: true })
    container.addEventListener('mousedown', handleUserInteraction, { passive: true })
    container.addEventListener('wheel', handleUserInteraction, { passive: true })
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('touchstart', handleUserInteraction)
      container.removeEventListener('mousedown', handleUserInteraction)
      container.removeEventListener('wheel', handleUserInteraction)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])
  
  // 新消息到达时的处理
  useEffect(() => {
    const hasNewMessages = messagesLength > lastMessagesLength
    
    if (hasNewMessages) {
      // 如果是第一条消息，总是滚动
      if (messagesLength === 1) {
        setUserScrolled(false)
        scrollToBottom()
      } 
      // 如果用户不在底部，显示新消息提示
      else if (!isNearBottom()) {
        setShowNewMessageIndicator(true)
      }
      
      setLastMessagesLength(messagesLength)
    }
  }, [messagesLength, lastMessagesLength, scrollToBottom, isNearBottom])
  
  // 窗口resize时检查滚动位置
  useEffect(() => {
    const handleResize = () => {
      // 只在用户没有交互且在底部时才滚动
      if (!userScrolled && isNearBottom()) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            const scrollHeight = containerRef.current.scrollHeight
            const clientHeight = containerRef.current.clientHeight
            containerRef.current.scrollTop = scrollHeight - clientHeight
          }
        })
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [userScrolled, isNearBottom])
  
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