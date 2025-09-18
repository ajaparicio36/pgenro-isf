import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { HeatmapCategory } from '@/schemas/heatmap';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedFilters?: {
    category?: HeatmapCategory;
    municipalityIds?: string[];
    startYear?: string;
    endYear?: string;
  };
  reportData?: any;
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    dataType: string;
    data: any[];
    title: string;
  };
  action?: 'heatmap' | 'report' | 'chart' | 'general';
}

interface ChatbotResponse {
  message: string;
  suggestedFilters?: {
    category?: HeatmapCategory;
    municipalityIds?: string[];
    startYear?: string;
    endYear?: string;
  };
  reportData?: any;
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    dataType: string;
    data: any[];
    title: string;
  };
  action?: 'heatmap' | 'report' | 'chart' | 'general';
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = useCallback(
    async (content: string): Promise<ChatbotResponse | null> => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            conversationHistory: messages.slice(-10), // Last 10 messages for context
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to send message');
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.response.message,
          timestamp: new Date(),
          suggestedFilters: result.data.response.suggestedFilters,
          reportData: result.data.response.reportData,
          chartData: result.data.response.chartData,
          action: result.data.response.action,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return result.data.response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';
        toast.error(errorMessage);

        const errorAssistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorAssistantMessage]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleChatbot = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    clearMessages,
    toggleChatbot,
    setIsOpen,
  };
};
