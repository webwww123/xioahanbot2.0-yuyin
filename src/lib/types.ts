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
  startRecording: () => void;
  stopRecording: () => void;
  addMessage: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
} 