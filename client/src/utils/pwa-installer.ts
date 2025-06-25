// Enhanced PWA installer utility
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export class PWAInstaller {
  private static deferredPrompt: BeforeInstallPromptEvent | null = null;
  private static listeners: Set<(canInstall: boolean) => void> = new Set();

  static init() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt detected');
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners(true);
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.deferredPrompt = null;
      this.notifyListeners(false);
    });

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA is already installed');
      this.notifyListeners(false);
    }
  }

  static canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  static async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      this.showManualInstructions();
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
        this.deferredPrompt = null;
        this.notifyListeners(false);
        return true;
      } else {
        console.log('User dismissed PWA install');
        return false;
      }
    } catch (error) {
      console.error('PWA install error:', error);
      this.showManualInstructions();
      return false;
    }
  }

  static showManualInstructions() {
    const userAgent = navigator.userAgent;
    let instructions = '';
    
    if (userAgent.includes('Chrome') || userAgent.includes('Chromium')) {
      instructions = `Chrome Installation:

1. Look for the install icon (⊞) in the address bar
2. OR click the menu (⋮) → "Install VividPlate"
3. Click "Install" to add to your desktop

The app will appear with the VividPlate icon!`;
    } else if (userAgent.includes('Edge')) {
      instructions = `Edge Installation:

1. Click the menu (...) 
2. Select "Apps" → "Install VividPlate"
3. Click "Install" to add to your desktop`;
    } else if (userAgent.includes('Firefox')) {
      instructions = `Firefox Installation:

1. Right-click on the page
2. Select "Install This Site as App"
3. Or check address bar for install options`;
    } else {
      instructions = `PWA Installation:

1. Look for install options in your browser menu
2. Check the address bar for install icons
3. Add VividPlate to your desktop for quick access`;
    }
    
    alert(instructions);
  }

  static onInstallabilityChange(callback: (canInstall: boolean) => void) {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.canInstall());
  }

  static removeInstallabilityListener(callback: (canInstall: boolean) => void) {
    this.listeners.delete(callback);
  }

  private static notifyListeners(canInstall: boolean) {
    this.listeners.forEach(callback => callback(canInstall));
  }
}

// Initialize when module loads
PWAInstaller.init();