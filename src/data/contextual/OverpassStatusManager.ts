/**
 * Manages Overpass API status polling and rate limit information.
 *
 * The Overpass API provides a /status endpoint that reports:
 * - Current server time
 * - Available request slots and when they open
 * - Count of currently running queries
 *
 * This manager polls that endpoint periodically to enable intelligent request scheduling:
 * instead of using a fixed throttle delay, we wait until the actual next available slot.
 *
 * Gracefully degrades if the status endpoint is unavailable (exceptions are caught).
 */

export type OverpassStatus = {
  currentTime: Date;
  slots: Array<{
    availableAfter: Date;
  }>;
  currentlyRunningQueries: number;
};

export class OverpassStatusManager {
  private statusUrl: string;
  private pollIntervalMs: number;
  private timeoutMs: number;
  private cacheTtlMs: number;

  private cachedStatus: OverpassStatus | null = null;
  private cacheTimestamp: number = 0;
  private pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pollPromise: Promise<void> | null = null;
  private fetchAbortController: AbortController | null = null;
  private isDisposed = false;

  constructor(
    statusUrl: string = 'https://overpass-api.de/api/status',
    pollIntervalMs: number = 30000,
    timeoutMs: number = 5000,
    cacheTtlMs: number = 30000
  ) {
    this.statusUrl = statusUrl;
    this.pollIntervalMs = pollIntervalMs;
    this.timeoutMs = timeoutMs;
    this.cacheTtlMs = cacheTtlMs;

    // Start polling immediately (non-blocking)
    this.schedulePoll();
  }

  /**
   * Get the next available slot time from cached status.
   * Returns null if status is unavailable or unhealthy.
   * Waits for the first available slot across all reported slots.
   */
  async getNextAvailableSlot(): Promise<Date | null> {
    if (this.isDisposed) {
      return null;
    }

    const status = await this.getStatus();
    if (!status || status.slots.length === 0) {
      return null;
    }

    // Find the earliest available slot
    let earliestSlot: Date | null = null;
    for (const slot of status.slots) {
      if (!earliestSlot || slot.availableAfter < earliestSlot) {
        earliestSlot = slot.availableAfter;
      }
    }

    return earliestSlot;
  }

  /**
   * Get the current cached status, or fetch a fresh one if cache is stale.
   * Returns null if fetch fails.
   */
  async getStatus(): Promise<OverpassStatus | null> {
    if (this.isDisposed) {
      return null;
    }

    const now = Date.now();
    const isCacheValid =
      this.cachedStatus && now - this.cacheTimestamp < this.cacheTtlMs;

    if (isCacheValid) {
      return this.cachedStatus;
    }

    // Fetch fresh status (don't await, let polling handle it)
    // But return cached status immediately to avoid blocking
    if (!this.pollPromise) {
      this.pollPromise = this.fetchStatus();
    }

    return this.cachedStatus;
  }

  /**
   * Check if the status manager is healthy (has recent cached status).
   */
  isHealthy(): boolean {
    if (!this.cachedStatus) {
      return false;
    }
    const age = Date.now() - this.cacheTimestamp;
    return age < this.cacheTtlMs * 2; // Allow 2x TTL before considering unhealthy
  }

  /**
   * Get the current API load level (number of running queries).
   * Returns 0 if status is unavailable.
   */
  getCurrentLoad(): number {
    return this.cachedStatus?.currentlyRunningQueries ?? 0;
  }

  /**
   * Manually trigger a status poll (useful for testing).
   */
  async poll(): Promise<void> {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
    await this.fetchStatus();
    this.schedulePoll();
  }

  /**
   * Clean up: stop polling and clear cache.
   */
  dispose(): void {
    this.isDisposed = true;
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
    this.fetchAbortController?.abort();
    this.fetchAbortController = null;
    this.cachedStatus = null;
    this.pollPromise = null;
  }

  // Private helpers

  private schedulePoll(): void {
    if (this.isDisposed) {
      return;
    }
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
    }
    this.pollTimeoutId = setTimeout(() => {
      this.pollPromise = this.fetchStatus();
    }, this.pollIntervalMs);
  }

  private async fetchStatus(): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    try {
      this.fetchAbortController = new AbortController();
      const timeoutId = setTimeout(
        () => this.fetchAbortController?.abort(),
        this.timeoutMs
      );

      const response = await fetch(this.statusUrl, {
        signal: this.fetchAbortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[OverpassStatusManager] Status endpoint returned ${response.status}`
        );
        this.pollPromise = null;
        this.schedulePoll();
        return;
      }

      const text = await response.text();
      const status = this.parseStatus(text);

      if (status) {
        this.cachedStatus = status;
        this.cacheTimestamp = Date.now();
        console.debug(
          `[OverpassStatusManager] Fetched status: ${status.slots.length} slots, ${status.currentlyRunningQueries} running queries`
        );
      }
    } catch (error) {
      if (this.isDisposed) {
        return; // Silently ignore errors during cleanup
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('[OverpassStatusManager] Status fetch timeout');
        } else {
          console.warn(
            `[OverpassStatusManager] Failed to fetch status: ${error.message}`
          );
        }
      }
    }

    this.pollPromise = null;
    this.schedulePoll();
  }

  /**
   * Parse the plain-text status response from Overpass API.
   *
   * Example response:
   * ```
   * Connected as: 2152559756
   * Current time: 2026-02-18T14:00:39Z
   * Announced endpoint: gall.openstreetmap.de/
   * Rate limit: 4
   * Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
   * Slot available after: 2026-02-18T14:01:12Z, in 33 seconds.
   * Currently running queries (pid, space limit, time limit, start time):
   * 3756 262144 180 2026-02-18T13:59:43Z
   * ```
   */
  private parseStatus(text: string): OverpassStatus | null {
    try {
      let currentTime: Date | null = null;
      const slots: Array<{ availableAfter: Date }> = [];
      let queryCount = 0;

      const lines = text.split('\n');
      let inQuerySection = false;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('Current time:')) {
          const timeStr = trimmed.substring('Current time:'.length).trim();
          currentTime = new Date(timeStr);
        } else if (trimmed.startsWith('Slot available after:')) {
          // Line format: "Slot available after: 2026-02-18T14:01:07Z, in 28 seconds."
          const match = trimmed.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
          if (match) {
            slots.push({
              availableAfter: new Date(match[1]),
            });
          }
        } else if (trimmed.match(/^\d+\s+slots?\s+available\s+now\./i)) {
          // Line format: "4 slots available now." or "1 slot available now."
          // These slots are available immediately
          if (currentTime) {
            const match = trimmed.match(/^(\d+)\s+slots?/);
            if (match && match[1]) {
              const count = parseInt(match[1], 10);
              for (let i = 0; i < count; i++) {
                slots.push({
                  availableAfter: currentTime,
                });
              }
            }
          }
        } else if (trimmed.startsWith('Currently running queries')) {
          inQuerySection = true;
        } else if (
          inQuerySection &&
          trimmed.length > 0 &&
          /^\d+/.test(trimmed)
        ) {
          // Count lines in query section (each line is a running query)
          queryCount++;
        }
      }

      if (!currentTime) {
        console.warn(
          '[OverpassStatusManager] Could not parse current time from status'
        );
        return null;
      }

      return {
        currentTime,
        slots,
        currentlyRunningQueries: queryCount,
      };
    } catch (error) {
      console.warn(`[OverpassStatusManager] Failed to parse status: ${error}`);
      return null;
    }
  }
}
