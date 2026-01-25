import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { AIAgentModal } from './AIAgentModal';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AIAgentButtonProps {
  className?: string;
  variant?: 'default' | 'floating';
}

export const AIAgentButton = ({ className, variant = 'default' }: AIAgentButtonProps) => {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();

  // Only show for admin, manager, staff roles
  const allowedRoles = ['admin', 'manager', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    return null;
  }

  if (variant === 'floating') {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
            "bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90",
            className
          )}
          size="icon"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <Sparkles className="relative inline-flex rounded-full h-4 w-4 text-accent" />
          </span>
        </Button>
        <AIAgentModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn("gap-2", className)}
      >
        <Bot className="h-4 w-4" />
        AI Agent
        <Sparkles className="h-3 w-3 text-accent" />
      </Button>
      <AIAgentModal open={open} onOpenChange={setOpen} />
    </>
  );
};
