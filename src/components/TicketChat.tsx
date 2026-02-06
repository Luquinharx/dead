import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage, subscribeToMessages, sendMessage } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

interface TicketChatProps {
  rentalId: string;
  className?: string;
}

export function TicketChat({ rentalId, className }: TicketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, userProfile, isAdmin } = useAuth();
  const { lang } = useLanguage();

  useEffect(() => {
    const unsubscribe = subscribeToMessages(rentalId, setMessages);
    return () => unsubscribe();
  }, [rentalId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !userProfile) return;
    
    setSending(true);
    try {
      await sendMessage(
        rentalId,
        user.uid,
        userProfile.gameNickname,
        isAdmin,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{t(lang, 'chatTicketTitle')}</span>
      </div>
      
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {t(lang, 'chatNoMessages')}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%] rounded-lg p-2 px-3",
                  msg.senderId === user?.uid
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                )}
              >
                <span className={cn(
                  "text-xs font-medium",
                  msg.senderId === user?.uid
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}>
                  {msg.senderName}
                  {msg.isAdmin && (
                    <span className="ml-1 text-[10px] bg-accent/20 text-accent px-1 rounded">
                      {t(lang, 'adminLabel')}
                    </span>
                  )}
                </span>
                <span className="text-sm">{msg.message}</span>
                <span className={cn(
                  "text-[10px] mt-1",
                  msg.senderId === user?.uid
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground/60"
                )}>
                  {msg.createdAt?.toDate?.()?.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || '...'}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
            <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t(lang, 'chatPlaceholder')}
            className="flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            variant="cyber"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
