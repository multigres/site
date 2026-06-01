import posthog from 'posthog-js';
import type { PostHogConfig } from 'posthog-js';

const MAX_PENDING_EVENTS = 20;

class PostHogClient {
  private initialized = false;
  private pendingGroups: Record<string, string> = {};
  private pendingIdentification: {
    userId: string;
    properties?: Record<string, unknown>;
  } | null = null;
  private pendingEvents: Array<{
    event: string;
    properties: Record<string, unknown>;
  }> = [];
  private readonly maxPendingEvents = MAX_PENDING_EVENTS;

  init(apiKey: string, apiHost: string) {
    if (this.initialized || typeof window === 'undefined') return;
    if (!apiKey) return;

    const config: Partial<PostHogConfig> = {
      api_host: apiHost,
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: false,
      persistence: 'localStorage',
      loaded: (loadedPosthog) => {
        Object.entries(this.pendingGroups).forEach(([type, id]) => {
          loadedPosthog.group(type, id);
        });
        this.pendingGroups = {};

        if (this.pendingIdentification) {
          try {
            loadedPosthog.identify(
              this.pendingIdentification.userId,
              this.pendingIdentification.properties,
            );
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('PostHog identify failed:', error);
            }
          }
          this.pendingIdentification = null;
        }

        this.pendingEvents.forEach(({ event, properties }) => {
          try {
            loadedPosthog.capture(event, properties, { transport: 'sendBeacon' });
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('PostHog capture failed:', error);
            }
          }
        });
        this.pendingEvents = [];
      },
    };

    posthog.init(apiKey, config);
    this.initialized = true;
  }

  capturePageView(properties: Record<string, unknown>) {
    this.capture('$pageview', properties);
  }

  capturePageLeave(properties: Record<string, unknown>) {
    this.capture('$pageleave', properties);
  }

  capture(event: string, properties?: Record<string, unknown>) {
    if (!this.initialized) {
      if (this.pendingEvents.length >= this.maxPendingEvents) {
        this.pendingEvents.shift();
      }
      this.pendingEvents.push({ event, properties: properties || {} });
      return;
    }

    try {
      posthog.capture(event, properties, { transport: 'sendBeacon' });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('PostHog capture failed:', error);
      }
    }
  }

  identify(userId: string, properties?: Record<string, unknown>) {
    if (!this.initialized) {
      this.pendingIdentification = { userId, properties };
      return;
    }

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('PostHog identify failed:', error);
      }
    }
  }

  isLoaded(): boolean {
    return typeof posthog !== 'undefined' && posthog.__loaded;
  }
}

export const posthogClient = new PostHogClient();
