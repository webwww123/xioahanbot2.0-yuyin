export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface VoiceChatContextType {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  showPermissionGuide: boolean;
  
  addMessage: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
  
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  closePermissionGuide: () => void;

  sendTextMessage: (text: string) => Promise<void>;
  
  isSubmitting: boolean;
  inputText: string;
  setInputText: (text: string) => void;
} 