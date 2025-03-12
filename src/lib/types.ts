export interface Message {
  id: string;
  text?: string;        // 旧版消息格式
  content?: string;     // 新版消息格式
  isUser?: boolean;     // 旧版角色标识
  role?: 'user' | 'assistant' | 'system'; // 新版角色标识
  timestamp: number;
  isLoading?: boolean;  // 指示消息是否在加载中
  isError?: boolean;    // 指示消息是否出错
  audioUrl?: string; // 语音消息的URL
  audioDuration?: number; // 语音消息的时长（秒）
}

export interface VoiceChatContextType {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  showPermissionGuide: boolean;
  isSubmitting: boolean;
  inputText: string;
  startRecording: () => void;
  stopRecording: () => void;
  addMessage: (text: string, isUser: boolean, audioUrl?: string, audioDuration?: number) => void;
  clearMessages: () => void;
  closePermissionGuide: () => void;
  sendTextMessage: (text: string) => Promise<void>;
  setInputText: (text: string) => void;
  playAudio: (url: string) => void;
}

// 扩展Window接口，添加audioBlobs属性
declare global {
  interface Window {
    audioBlobs?: Record<string, Blob>;
  }
} 