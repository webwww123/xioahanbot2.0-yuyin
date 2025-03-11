'use client'

import React, { useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { VoiceChatProvider, useVoiceChat } from '@/lib/VoiceChatContext'
import VoiceButton from './VoiceButton'
import MessagesArea from './MessagesArea'
import Decorations from './Decorations'
import PermissionGuide from './PermissionGuide'

// 消息区域组件 - 单独提取以防止重渲染影响动画
const MessageAreaContainer = memo(() => {
  return (
    <div className="w-full h-[calc(100vh-220px)] mt-16 mb-8 overflow-hidden">
      <MessagesArea />
    </div>
  )
})

MessageAreaContainer.displayName = 'MessageAreaContainer'

// 按钮控制区域 - 单独提取以隔离状态变化
const ControlArea = memo(() => {
  const { sendTextMessage } = useVoiceChat();
  
  return (
    <div className="w-full flex flex-col items-center justify-center z-10 -mt-[30px]">
      {/* 中央语音按钮 */}
      <motion.div
        className="relative mb-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.3,
          ease: "easeOut",
          delay: 0.3
        }}
      >
        <VoiceButton onText={sendTextMessage} />
      </motion.div>
    </div>
  )
})

ControlArea.displayName = 'ControlArea'

// 权限指南弹窗容器 - 单独提取
const PermissionGuideContainer = memo(() => {
  const { showPermissionGuide, closePermissionGuide } = useVoiceChat()
  
  return (
    <PermissionGuide 
      isVisible={showPermissionGuide || false}
      onClose={closePermissionGuide || (() => {})} 
    />
  )
})

PermissionGuideContainer.displayName = 'PermissionGuideContainer'

// 主内容组件
const VoiceChatContent: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center w-full h-full min-h-screen overflow-hidden">
      {/* API测试链接 - 暂时注释掉
      <div className="absolute top-4 right-4 z-50">
        <a 
          href="/api-test" 
          className="px-3 py-1 bg-pink-500 text-white text-xs rounded-full shadow-md hover:bg-pink-600 transition-colors"
        >
          API测试
        </a>
      </div>
      */}
      
      {/* 装饰元素 */}
      <Decorations />
      
      {/* 消息显示区域 - 使用独立组件防止重渲染 */}
      <MessageAreaContainer />
      
      {/* 底部控制区域 - 使用独立组件 */}
      <ControlArea />
      
      {/* 权限指南弹窗 - 使用独立组件 */}
      <PermissionGuideContainer />
    </div>
  )
}

// 顶层容器组件
const VoiceChat: React.FC = () => {
  return (
    <VoiceChatProvider>
      <VoiceChatContent />
    </VoiceChatProvider>
  )
}

export default VoiceChat 