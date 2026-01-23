import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { POS_SHORTCUTS } from '@/hooks/usePOSKeyboardShortcuts';
import { Badge } from '@/components/ui/badge';

const KeyboardShortcutsHelp = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
          <div className="space-y-1">
            {POS_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{shortcut.description}</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {shortcut.label}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default KeyboardShortcutsHelp;
