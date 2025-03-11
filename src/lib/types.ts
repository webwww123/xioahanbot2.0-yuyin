export interface Message {
  id: string;
  text?: string;        // 旧版消息格式
  content?: string;     // 新版消息格式
  isUser?: boolean;     // 旧版角色标识
  role?: 'user' | 'assistant' | 'system'; // 新版角色标识
  timestamp: number;
  isLoading?: boolean;  // 指示消息是否在加载中
  isError?: boolean;    // 指示消息是否出错
}

export interface VoiceChatContextType {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  showPermissionGuide?: boolean;
  
  addMessage?: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
  
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  closePermissionGuide?: () => void;

  sendTextMessage: (text: string) => Promise<void>;
  
  isSubmitting?: boolean;
  inputText?: string;
  setInputText?: (text: string) => void;
} 