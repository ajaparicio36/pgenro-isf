'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatbotButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

const ChatbotButton = ({
  isOpen,
  onClick,
  unreadCount = 0,
}: ChatbotButtonProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={onClick}
        className={`rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 ${
          isOpen
            ? 'bg-destructive hover:bg-destructive/90'
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </>
        )}
      </Button>
    </div>
  );
};

export default ChatbotButton;
