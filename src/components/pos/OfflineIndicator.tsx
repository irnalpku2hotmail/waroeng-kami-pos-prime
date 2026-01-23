import { WifiOff, Wifi, RefreshCw, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

const OfflineIndicator = ({
  isOnline,
  pendingCount,
  isSyncing,
  onSync,
}: OfflineIndicatorProps) => {
  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600">
        <Wifi className="h-3 w-3" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2 relative',
            !isOnline && 'text-destructive hover:text-destructive'
          )}
        >
          {isOnline ? (
            <CloudOff className="h-4 w-4 text-amber-500" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-sm">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm">Mode Offline</span>
              </>
            )}
          </div>

          {!isOnline && (
            <p className="text-xs text-muted-foreground">
              Transaksi akan disimpan secara lokal dan otomatis disinkronkan saat
              koneksi pulih.
            </p>
          )}

          {pendingCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transaksi Tertunda</span>
                <Badge variant="secondary">{pendingCount}</Badge>
              </div>

              {isOnline && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={onSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Menyinkronkan...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sinkronkan Sekarang
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OfflineIndicator;
