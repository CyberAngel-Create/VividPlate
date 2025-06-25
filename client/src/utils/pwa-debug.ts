// PWA Debug utility to check installability criteria
export class PWADebug {
  static async checkInstallability(): Promise<void> {
    console.log('=== PWA Installability Check ===');
    
    // 1. Check manifest
    try {
      const response = await fetch('/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        console.log('✓ Manifest accessible:', manifest.name);
        console.log('✓ Start URL:', manifest.start_url);
        console.log('✓ Display mode:', manifest.display);
        console.log('✓ Icons count:', manifest.icons?.length || 0);
      } else {
        console.error('✗ Manifest not accessible');
      }
    } catch (error) {
      console.error('✗ Manifest fetch error:', error);
    }

    // 2. Check service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log('✓ Service Worker registered:', registration.active?.state);
        } else {
          console.log('✗ Service Worker not registered');
        }
      } catch (error) {
        console.error('✗ Service Worker check error:', error);
      }
    } else {
      console.log('✗ Service Worker not supported');
    }

    // 3. Check HTTPS
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    console.log(isSecure ? '✓ Secure context (HTTPS/localhost)' : '✗ Not secure context');

    // 4. Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log(isStandalone ? '✓ Already installed (standalone)' : '✓ Not installed (browser mode)');

    // 5. Check beforeinstallprompt support
    console.log('⏳ Waiting for beforeinstallprompt event...');
    console.log('💡 For Chrome: Install icon should appear in address bar after engagement');
    console.log('💡 Manual install: Chrome menu → "Install VividPlate"');
  }

  static monitorInstallPrompt(): void {
    let hasPromptEvent = false;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      hasPromptEvent = true;
      console.log('🎉 PWA Install prompt available!');
      console.log('📍 Look for install icon (⊞) in Chrome address bar');
      console.log('📍 OR: Chrome menu → "Install VividPlate"');
    });

    // Check after 5 seconds
    setTimeout(() => {
      if (!hasPromptEvent) {
        console.log('⚠️  No install prompt detected after 5 seconds');
        console.log('💡 Try: Navigate around the site to trigger engagement');
        console.log('💡 Try: Chrome menu → "Install VividPlate"');
      }
    }, 5000);
  }
}

// Auto-run debug on load
PWADebug.checkInstallability();
PWADebug.monitorInstallPrompt();