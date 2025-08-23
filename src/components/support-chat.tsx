
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Bot, Loader2, Send, User, MessageSquare } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { helpCenterAssistant } from '@/ai/flows/help-center-assistant';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function SupportChat() {
  const { user } = useAuth();
  const t = useTranslations('SupportChat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await helpCenterAssistant({ question: input });
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'assistant', content: t('sorryError') };
      setMessages(prev => [...prev, errorMessage]);
      console.error("AI assistant error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
   const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-24 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          aria-label="Open support chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 flex flex-col h-[60vh] mb-2" side="top" align="end">
        <div className="p-4 border-b bg-secondary">
          <h4 className="font-medium text-center">{t('aiAssistant')}</h4>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm p-4">
                {t('aiAssistantSubtitle')}
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? "justify-end" : "")}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("rounded-lg p-3 max-w-[80%] text-sm", message.role === 'user' ? "bg-secondary" : "bg-primary/10")}>
                  {message.content}
                </div>
                {message.role === 'user' && (
                   <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || ''} />
                      <AvatarFallback>{getAvatarFallback(user?.displayName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                  <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-primary/10">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2 text-sm">{t('thinking')}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-secondary/50">
          <form onSubmit={handleSendMessage} className="w-full flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('askQuestion')}
              disabled={isLoading}
              className="bg-background"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4"/>
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
