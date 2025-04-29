import { useEffect } from 'react';

interface GoogleAdSenseProps {
  className?: string;
}

const GoogleAdSense = ({ className }: GoogleAdSenseProps) => {
  useEffect(() => {
    // Load the Google AdSense script
    const loadAdSenseScript = () => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8447200389101391';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    };

    // Check if script is already loaded to prevent duplicate loading
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      loadAdSenseScript();
    }

    return () => {
      // No cleanup needed as we don't want to remove the script when component unmounts
    };
  }, []);

  return (
    <div className={`ad-container ${className || ''}`}>
      {/* Ad display placeholder */}
      <div className="ad-placeholder p-4 my-4 bg-gray-100 rounded-md text-center text-gray-500 text-xs">
        Advertisement
        {/* AdSense will automatically inject ads here */}
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-8447200389101391"
          data-ad-slot="1234567890" // Replace with your actual ad slot
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
};

export default GoogleAdSense;