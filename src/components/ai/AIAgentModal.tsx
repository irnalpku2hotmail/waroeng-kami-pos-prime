import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  Trash2, 
  Sparkles,
  BarChart3,
  Package,
  Search,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useAIAgent } from '@/hooks/useAIAgent';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AIAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickCommands = [
  { label: 'Analisa Penjualan', icon: BarChart3, prompt: 'Analisa laporan penjualan 30 hari terakhir dan berikan insight penting' },
  { label: 'Saran Pembelian', icon: Package, prompt: 'Berikan saran pembelian produk berdasarkan stok dan histori penjualan' },
  { label: 'Analisa Pencarian', icon: Search, prompt: 'Analisa perilaku pencarian pelanggan dan identifikasi peluang produk baru' },
  { label: 'Ringkasan Bisnis', icon: TrendingUp, prompt: 'Berikan ringkasan performa bisnis dan rekomendasi aksi prioritas' },
];

export const AIAgentModal = ({ open, onOpenChange }: AIAgentModalProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    isLoading,
    isListening,
    sendMessage,
    startListening,
    stopListening,
    clearMessages
  } = useAIAgent();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickCommand = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold">AI Agent</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Gemini 3
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Commands */}
        {messages.length === 0 && (
          <div className="px-6 py-4 border-b bg-muted/30">
            <p className="text-sm text-muted-foreground mb-3">Perintah Cepat:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickCommands.map((cmd) => (
                <Button
                  key={cmd.label}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-2 px-3"
                  onClick={() => handleQuickCommand(cmd.prompt)}
                  disabled={isLoading}
                >
                  <cmd.icon className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-xs">{cmd.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Halo! Saya AI Agent yang siap membantu Anda menganalisa data bisnis.
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Gunakan perintah suara atau ketik pertanyaan Anda.
                </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  <div className={cn(
                    "text-xs mt-1 opacity-70",
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {format(msg.timestamp, 'HH:mm', { locale: idLocale })}
                  </div>
                </div>
                
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-bold">A</span>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Menganalisa data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="px-6 py-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={cn(isListening && 'animate-pulse')}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Mendengarkan...' : 'Ketik perintah atau pertanyaan...'}
              disabled={isLoading || isListening}
              className="flex-1"
            />
            
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
            
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isListening && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-primary">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Sedang mendengarkan... Bicara sekarang
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
