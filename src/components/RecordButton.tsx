import React from 'react';
import classNames from 'classnames';
import { FaMicrophone, FaSpinner, FaStop } from 'react-icons/fa';
import { useVoiceChat } from '@/lib/VoiceChatContext';

export function RecordButton() {
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceChat();
  const [recordingTime, setRecordingTime] = React.useState(0);
  
  // 录音计时器
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return (
    <div className="relative flex items-center justify-center">
      {/* 录音时间显示 */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
          {formatTime(recordingTime)}
        </div>
      )}
      
      <button
        onClick={handleClick}
        disabled={isProcessing}
        aria-label={isRecording ? '停止录音' : '开始录音'}
        className={classNames(
          'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 focus:outline-none',
          {
            'bg-red-500 text-white hover:bg-red-600 animate-pulse': isRecording,
            'bg-primary text-white hover:bg-primary/90': !isRecording && !isProcessing,
            'bg-gray-300 text-gray-500 cursor-not-allowed': isProcessing
          }
        )}
      >
        {isProcessing ? (
          <FaSpinner className="animate-spin" size={20} />
        ) : isRecording ? (
          <FaStop size={20} />
        ) : (
          <FaMicrophone size={20} />
        )}
      </button>
      
      {/* 录音状态提示 */}
      {isRecording && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-red-500 text-xs font-medium animate-pulse">
          正在录音...点击停止
        </div>
      )}
      
      {/* 录音边框效果 */}
      {isRecording && (
        <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-50"></div>
      )}
    </div>
  );
}
 