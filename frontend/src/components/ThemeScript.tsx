// This script runs immediately to prevent theme flash
export const ThemeScript = () => (
  <script
    suppressHydrationWarning
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            // Only run on client side
            if (typeof window === 'undefined') return;
            
            console.log('ThemeScript: Starting theme initialization...');
            
            var storageConsent = localStorage.getItem('theme-storage-consent');
            var savedTheme = localStorage.getItem('theme');
            
            console.log('ThemeScript: Storage values', {
              storageConsent: storageConsent,
              savedTheme: savedTheme,
              consentType: typeof storageConsent,
              themeType: typeof savedTheme
            });
            
            var theme = 'light'; // default
            
            // Check if user has saved theme (with or without explicit consent)
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
              theme = savedTheme;
              console.log('ThemeScript: Using saved theme:', theme);
            } else {
              // Always default to light theme instead of system preference
              theme = 'light';
              console.log('ThemeScript: Using default light theme');
            }
            
            console.log('ThemeScript: Final theme decision:', theme);
            
            // Clear existing classes first
            document.documentElement.classList.remove('dark', 'light');
            
            // Apply theme immediately
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
              console.log('ThemeScript: Applied dark theme');
            } else {
              document.documentElement.classList.add('light');
              console.log('ThemeScript: Applied light theme');
            }
            
            console.log('ThemeScript: HTML classes now:', document.documentElement.className);
            
          } catch (e) {
            console.error('ThemeScript: Error occurred:', e);
            // Fallback to light theme if anything fails
            document.documentElement.classList.remove('dark', 'light');
            document.documentElement.classList.add('light');
          }
        })();
      `,
    }}
  />
);