import React, { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useVoiceChat } from '@/lib/VoiceChatContext'
import { RecordButton } from './RecordButton'
import { cn } from '@/lib/utils'

export function ChatInput() {
  const { isSubmitting, inputText, setInputText, sendTextMessage, isRecording, isProcessing } = useVoiceChat()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动调整文本框高度
  const autoResizeTextarea = () => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 150)
      textarea.style.height = `${newHeight}px`
    }
  }

  // 当输入内容变化时调整高度
  useEffect(() => {
    autoResizeTextarea()
  }, [inputText])

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 处理提交
  const handleSubmit = () => {
    if (isRecording || isProcessing || isSubmitting || !inputText.trim()) return

    sendTextMessage(inputText)
    setInputText('')

    // 聚焦输入框
    setTimeout(() => {
      inputRef.current?.focus()
    }, 10)
  }

  return (
    <div className="relative p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          {/* 录音按钮 */}
          <div className={cn("shrink-0 transition-all duration-200", {
            "mb-3": isRecording, // 录音时增加底部间距以容纳提示文字
          })}>
            <RecordButton />
          </div>
          
          {/* 文本输入区 */}
          <div className="flex-1 min-h-[60px] flex items-center p-2 border rounded-lg focus-within:ring-2 ring-primary">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || isRecording || isProcessing}
              placeholder={isRecording ? "正在录音中..." : isProcessing ? "处理中..." : "输入消息或按麦克风键语音聊天..."}
              className="flex-1 max-h-[150px] py-2 px-3 resize-none bg-transparent border-0 focus:ring-0 focus:outline-none dark:text-gray-100"
              style={{ height: '40px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isRecording || isProcessing || !inputText.trim()}
              className={cn(
                "ml-2 p-2 rounded-full transition-colors duration-200",
                inputText.trim()
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
              )}
            >
              <Send size={18} className="opacity-90" />
            </button>
          </div>
        </div>
        
        {/* 底部说明 */}
        <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
          {isRecording 
            ? "点击麦克风按钮停止录音" 
            : isProcessing 
            ? "语音处理中，请稍候..." 
            : "点击麦克风图标开始录音，消息以语音条形式保存"}
        </div>
      </div>
    </div>
  )
} 