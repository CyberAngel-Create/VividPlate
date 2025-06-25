import { useState } from 'react';
import { X, Download, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';

export function InstallBanner() {
  const { isInstallable, isOffline, needsUpdate, installApp, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setDismissed(true);
    }
  };

  const handleUpdate = () => {
    updateApp();
  };

  if (dismissed) return null;

  return (
    <>
      {/* Install Banner */}
      {isInstallable && (
        <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Install MenuMate</h3>
                  <p className="text-xs text-muted-foreground">
                    Add to home screen for quick access
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="h-8 px-3 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissed(true)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Banner */}
      {needsUpdate && (
        <Card className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-sm font-medium">Update Available</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpdate}
                className="h-7 px-3 text-xs"
              >
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Indicator */}
      {isOffline && (
        <Card className="fixed top-4 left-4 right-4 z-40 mx-auto max-w-md border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">You're offline. Some features may be limited.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function PWAStatus() {
  const { isInstalled, isOffline } = usePWA();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isInstalled && (
        <div className="flex items-center gap-1">
          <Smartphone className="h-3 w-3" />
          <span>App Mode</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        {isOffline ? (
          <WifiOff className="h-3 w-3 text-red-500" />
        ) : (
          <Wifi className="h-3 w-3 text-green-500" />
        )}
        <span>{isOffline ? 'Offline' : 'Online'}</span>
      </div>
    </div>
  );
}