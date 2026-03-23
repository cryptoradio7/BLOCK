'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    // Sauvegarder la fonction fetch originale
    const originalFetch = window.fetch;

    // #region agent log
    const log = (location: string, message: string, data: any) => {
      // Utiliser originalFetch pour éviter la récursion infinie
      originalFetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          message,
          data,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
    };
    // #endregion

    // Intercepter tous les appels fetch
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let url: string;
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else {
        url = input.url;
      }

      // Ignorer les appels de logging pour éviter la récursion
      if (url.includes('127.0.0.1:7243') || url.includes('localhost:7243')) {
        return originalFetch(input, init);
      }

      // Rediriger les appels vers localhost:3002 vers localhost:3001
      if (url.includes('localhost:3002') || url.includes('127.0.0.1:3002')) {
        const correctedUrl = url.replace(/localhost:3002|127\.0\.0\.1:3002/g, 'localhost:3001');
        
        // Si c'est une URL complète, créer un nouvel objet Request/URL
        if (typeof input === 'string') {
          input = correctedUrl;
        } else if (input instanceof URL) {
          input = new URL(correctedUrl);
        } else {
          input = new Request(correctedUrl, input);
        }
      }

      // Appeler la fonction fetch originale
      return originalFetch(input, init);
    };

    // Nettoyer lors du démontage
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}



