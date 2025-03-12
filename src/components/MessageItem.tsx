import React, { useEffect } from 'react';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Message } from '@/lib/types';
import { useVoiceChat } from '@/lib/VoiceChatContext';
import { FaUser, FaRobot, FaVolumeUp } from 'react-icons/fa';
import { Skeleton } from './ui/skeleton';

// 时间格式化函数
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 语音条组件
const VoiceMessage: React.FC<{ url: string; duration: number }> = ({ url, duration }) => {
  const { playAudio } = useVoiceChat();
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  const handlePlay = () => {
    setIsPlaying(true);
    playAudio(url);
    // 播放结束后重置状态
    setTimeout(() => setIsPlaying(false), duration * 1000);
  };
  
  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      onClick={handlePlay}
    >
      <FaVolumeUp className={classNames(
        "text-blue-500", 
        { "animate-voice-pulse": isPlaying }
      )} />
      <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
        <div className={classNames(
          "h-full bg-blue-500",
          { "voice-wave-effect": isPlaying }
        )} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 min-w-12 text-right">
        {formatTime(duration)}
      </span>
    </div>
  );
};

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUserMessage = message.isUser === true || message.role === 'user';
  const isLoading = 'isLoading' in message && message.isLoading;
  
  // 检测是否为语音消息
  const hasAudio = Boolean(message.audioUrl && message.audioDuration);
  
  // 用于调试
  useEffect(() => {
    if ((message.content === '[语音消息]' || message.text === '[语音消息]') && !hasAudio) {
      console.warn('检测到语音消息标记，但缺少audioUrl或audioDuration:', message);
    }
    
    if (hasAudio) {
      console.log('语音消息属性:', {
        audioUrl: message.audioUrl,
        audioDuration: message.audioDuration
      });
    }
  }, [message, hasAudio]);

  return (
    <div
      className={classNames(
        'flex mb-4 px-4',
        isUserMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={classNames(
          'flex gap-3 max-w-[85%] md:max-w-[75%] lg:max-w-[85%] p-3 rounded-lg',
          isUserMessage
            ? 'bg-primary text-white'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
        )}
      >
        <div className="flex-shrink-0 mt-1">
          {isUserMessage ? (
            <div className="flex items-center justify-center w-6 h-6 bg-white text-primary rounded-full">
              <FaUser size={12} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
              <FaRobot size={12} />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base overflow-hidden break-words">
              {/* 判断是否为语音消息 */}
              {hasAudio ? (
                <VoiceMessage url={message.audioUrl!} duration={message.audioDuration!} />
              ) : (message.content === '[语音消息]' || message.text === '[语音消息]') ? (
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-pink-100 dark:bg-pink-900">
                  <FaVolumeUp className="text-pink-500" />
                  <span className="text-pink-700 dark:text-pink-300 text-sm">语音消息（无法播放）</span>
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {message.content || message.text || ''}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 