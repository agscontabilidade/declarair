import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (import.meta.env.PROD && dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        if (
          event.exception?.values?.[0]?.value?.includes('Extension context invalidated') ||
          event.exception?.values?.[0]?.value?.includes('chrome-extension://')
        ) {
          return null;
        }
        return event;
      },
    });
  }
};
