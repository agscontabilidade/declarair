import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (import.meta.env.PROD && dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: `declarair@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
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
        // Filter browser extension errors
        if (
          event.exception?.values?.[0]?.value?.includes('Extension context invalidated') ||
          event.exception?.values?.[0]?.stacktrace?.frames?.some(
            f => f.filename?.includes('chrome-extension://')
          )
        ) {
          return null;
        }

        // Redact tokens from URLs
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/token=[^&]+/g, 'token=REDACTED');
        }
        if (event.request) {
          delete event.request.cookies;
        }

        return event;
      },
    });
  }
};

// Structured logging helpers

export function logError(error: Error, context?: Record<string, unknown>) {
  console.error('[Error]', error.message, context);
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  }
}

export function logWarning(message: string, context?: Record<string, unknown>) {
  console.warn('[Warning]', message, context);
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, { level: 'warning', extra: context });
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  console.log('[Info]', message, context);
}

export function setUserContext(user: {
  id: string;
  email?: string;
  nome?: string;
  escritorioId?: string | null;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.nome,
  });
  if (user.escritorioId) {
    Sentry.setContext('escritorio', { id: user.escritorioId });
  }
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function trackEvent(eventName: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: eventName,
    data,
    level: 'info',
  });
}
