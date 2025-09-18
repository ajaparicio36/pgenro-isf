'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Bot, User, Trash2, Minimize2 } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedFilters?: any;
  reportData?: any;
  action?: 'heatmap' | 'report' | 'general';
}

interface ChatbotInterfaceProps {
  onFiltersChange?: (filters: any) => void;
  onReportGenerated?: (reportData: any) => void;
  onChartGenerated?: (chartData: any) => void;
  onClose: () => void;
}

const PRESET_SUGGESTIONS = [
  'Show me recent projects in the heatmap',
  'Generate a report for projects from 2020-2024',
  'Chart project costs by municipality',
  'Show area developed by barangay in a bar chart',
  'Compare yearly project trends',
  'Display project status distribution in a pie chart',
  'Which municipalities have the highest project costs?',
  'Show me areas with the most development activity',
];

const ChatbotInterface = ({
  onFiltersChange,
  onReportGenerated,
  onChartGenerated,
  onClose,
}: ChatbotInterfaceProps) => {
  const { messages, isLoading, sendMessage, clearMessages } = useChatbot();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setInput('');
    const response = await sendMessage(content);

    if (response) {
      // Handle different response types
      if (
        response.action === 'heatmap' &&
        response.suggestedFilters &&
        onFiltersChange
      ) {
        onFiltersChange(response.suggestedFilters);
      } else if (
        response.action === 'report' &&
        response.reportData &&
        onReportGenerated
      ) {
        onReportGenerated(response.reportData);
      } else if (
        response.action === 'chart' &&
        response.chartData &&
        onChartGenerated
      ) {
        onChartGenerated(response.chartData);
      }
    }

    // Focus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <Card className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] z-40 shadow-2xl border-2 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
        {/* Messages Area - Fixed height with proper scrolling */}
        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full px-4">
            <div className="py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground text-sm mb-4">
                    Hello! I can help you analyze your project data. Try asking
                    me something or use these suggestions:
                  </div>
                  <div className="space-y-2">
                    {PRESET_SUGGESTIONS.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full text-left justify-start text-xs h-auto py-2 px-3 whitespace-normal break-words"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}

                      <div className="max-w-[80%] space-y-1">
                        <div
                          className={`rounded-lg px-3 py-2 text-sm break-words ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>

                        {message.action && (
                          <Badge variant="secondary" className="text-xs">
                            {message.action === 'heatmap'
                              ? '🗺️ Heatmap Updated'
                              : message.action === 'report'
                                ? '📊 Report Generated'
                                : message.action === 'chart'
                                  ? '📈 Chart Generated'
                                  : '💬 General'}
                          </Badge>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your projects..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              disabled={isLoading}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotInterface;
