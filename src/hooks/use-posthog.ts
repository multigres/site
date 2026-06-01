import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { posthogClient } from '@/lib/posthog-client';

function getPostHogConfig() {
  const isProd = import.meta.env.PROD;

  return {
    apiKey: isProd
      ? import.meta.env.NEXT_PUBLIC_POSTHOG_KEY
      : import.meta.env.NEXT_PUBLIC_POSTHOG_STAGING_KEY ||
        import.meta.env.NEXT_PUBLIC_POSTHOG_KEY,
    apiHost: isProd
      ? import.meta.env.NEXT_PUBLIC_POSTHOG_HOST
      : import.meta.env.NEXT_PUBLIC_POSTHOG_STAGING_HOST ||
        import.meta.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

export function usePostHog() {
  const location = useLocation();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current || typeof window === 'undefined') return;

    const { apiKey, apiHost } = getPostHogConfig();
    if (!apiKey || !apiHost) return;

    posthogClient.init(apiKey, apiHost);
    isInitialized.current = true;

    posthogClient.capturePageView({
      $current_url: window.location.href,
      $pathname: location.pathname,
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!isInitialized.current || typeof window === 'undefined') return;

    posthogClient.capturePageView({
      $current_url: window.location.href,
      $pathname: location.pathname,
    });
  }, [location.pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      posthogClient.capturePageLeave({
        $current_url: window.location.href,
        $pathname: location.pathname,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname]);

  return {
    capture: (event: string, properties?: Record<string, unknown>) => {
      posthogClient.capture(event, properties);
    },
    identify: (distinctId: string, properties?: Record<string, unknown>) => {
      posthogClient.identify(distinctId, properties);
    },
  };
}
