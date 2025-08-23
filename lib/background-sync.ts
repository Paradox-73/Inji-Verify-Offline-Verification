/* eslint-disable no-console */
// lib/background-sync.ts
// Browser-side background sync using IndexedDB (no extra deps).
// Queues JSON jobs when offline, retries with exponential backoff, auto-flushes on online/visibility.

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Listener = (s: SyncStatus) => void;

type Job = {
  id: string;
  url: string;
  method: HttpMethod;
  body?: unknown;                 // JSON-serializable
  headers?: Record<string, string>;
  createdAt: number;              // ms
  tries: number;                  // retry count
  nextAt: number;                 // earliest time to retry (ms)
};

const DB_NAME = 'bg-sync';
const DB_VERSION = 1;
const STORE = 'jobs';

function isBrowser() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function now() {
  return Date.now();
}

function randomId() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  ).slice(0, 24);
}

function jitter(ms: number) {
  const delta = ms * 0.2;
  return ms + (Math.random() * 2 - 1) * delta;
}

function backoff(tries: number) {
  const base = 1000;                // 1s
  const cap = 5 * 60 * 1000;        // 5m
  const raw = base * Math.pow(2, Math.max(0, tries - 1));
  return Math.min(cap, jitter(raw));
}

// ---------- IndexedDB helpers ----------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('nextAt', 'nextAt');
        os.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putJob(job: Job) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(job);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function deleteJob(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getDueJobs(limit = 10): Promise<Job[]> {
  const db = await openDB();
  return new Promise<Job[]>((resolve, reject) => {
    const out: Job[] = [];
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('nextAt');
    const range = IDBKeyRange.upperBound(now());
    const req = idx.openCursor(range);
    req.onsuccess = () => {
      const cur = req.result;
      if (cur && out.length < limit) {
        out.push(cur.value as Job);
        cur.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function countJobs(): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- BackgroundSyncService (client) ----------

class BackgroundSyncService {
  private listeners = new Set<Listener>();
  private status: SyncStatus = 'idle';
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private intervalMs = 30_000; // passive check
  private flushing = false;

  // Track online state and expose a getter
  private online = typeof window !== 'undefined' ? navigator.onLine : true;

  // keep references so we can remove listeners on stop()
  private _onlineHandler?: () => void;
  private _visibilityHandler?: () => void;

  getOnlineStatus(): boolean {
    return this.online;
  }

  onStatus(cb: Listener) {
    this.listeners.add(cb);
    cb(this.status); // emit current
    return () => this.listeners.delete(cb);
  }

  private emit(s: SyncStatus) {
    this.status = s;
    // Use forEach to avoid downlevel iteration issues
    this.listeners.forEach((l) => l(s));
  }

  start(intervalMs = 30_000) {
    if (!isBrowser()) return;
    if (this.running) return;
    this.running = true;
    this.intervalMs = intervalMs;

    this._onlineHandler = () => {
      this.online = navigator.onLine;
      void this.flush();
    };
    this._visibilityHandler = () => {
      if (document.visibilityState === 'visible') void this.flush();
    };

    window.addEventListener('online', this._onlineHandler);
    window.addEventListener('offline', this._onlineHandler);
    document.addEventListener('visibilitychange', this._visibilityHandler);

    const tick = async () => {
      if (!this.running) return;
      await this.flush();
      this.loopTimer = setTimeout(tick, this.intervalMs);
    };
    this.loopTimer = setTimeout(tick, this.intervalMs);

    // initial attempt
    this.online = navigator.onLine;
    void this.flush();
  }

  stop() {
    this.running = false;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    this.loopTimer = null;

    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      window.removeEventListener('offline', this._onlineHandler);
      this._onlineHandler = undefined;
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = undefined;
    }
  }

  /**
   * Queue a JSON payload to an API endpoint. Safe offline.
   */
  async queueJson(
    url: string,
    payload: unknown,
    opts?: { method?: HttpMethod; headers?: Record<string, string> }
  ) {
    if (!isBrowser()) throw new Error('Background sync is browser-only');
    const job: Job = {
      id: randomId(),
      url,
      method: opts?.method ?? 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        ...(opts?.headers ?? {}),
      },
      createdAt: now(),
      tries: 0,
      nextAt: now(),
    };
    await putJob(job);
    if (navigator.onLine) void this.flush();
    return { id: job.id };
  }

  /**
   * Flush pending jobs now.
   */
  async flush(): Promise<{ processed: number; remaining: number }> {
    if (!isBrowser()) return { processed: 0, remaining: 0 };
    if (this.flushing) return { processed: 0, remaining: await countJobs() };
    if (!navigator.onLine) return { processed: 0, remaining: await countJobs() };

    this.flushing = true;
    this.emit('syncing');
    let processed = 0;

    try {
      while (navigator.onLine) {
        const jobs = await getDueJobs(10);
        if (!jobs.length) break;

        for (const job of jobs) {
          try {
            const res = await fetch(job.url, {
              method: job.method,
              headers: job.headers,
              body: job.body !== undefined ? JSON.stringify(job.body) : undefined,
            });

            if (!res.ok) {
              if (res.status >= 500) throw new Error(`Server ${res.status}`);
              // drop unrecoverable 4xx
              console.warn('[bg-sync] dropping job (client error):', job, res.status);
              await deleteJob(job.id);
            } else {
              await deleteJob(job.id);
            }
            processed++;
          } catch (err) {
            job.tries += 1;
            job.nextAt = now() + backoff(job.tries);
            await putJob(job); // update
            if (!navigator.onLine) break;
          }
        }
      }
      const remaining = await countJobs();
      this.emit(remaining === 0 ? 'success' : 'idle');
      if (this.status === 'success') setTimeout(() => this.emit('idle'), 1500);
      return { processed, remaining };
    } catch (e) {
      console.error('[bg-sync] flush failed', e);
      this.emit('error');
      setTimeout(() => this.emit('idle'), 1500);
      return { processed, remaining: await countJobs() };
    } finally {
      this.flushing = false;
    }
  }

  // ---------- Aliases for older calling code ----------

  /** Trigger an immediate sync (alias for flush) */
  async triggerSync(): Promise<{ processed: number; remaining: number }> {
    return this.flush();
  }

  /** Start periodic sync loop (alias for start) */
  startPeriodicSync(intervalMs = 30_000) {
    this.start(intervalMs);
  }

  /**
   * Queue typed payloads to conventional endpoints
   *  - 'verification-result' => POST /api/sync/verification-results
   *  - 'settings-sync'       => POST /api/sync/settings
   */
  async queueForSync(
    type: 'verification-result' | 'settings-sync',
    data: unknown
  ) {
    const url =
      type === 'verification-result'
        ? '/api/sync/verification-results'
        : '/api/sync/settings';

    return this.queueJson(url, data);
  }
}

export const backgroundSyncService = new BackgroundSyncService();

// Auto-start in the browser. Remove if you prefer manual start.
if (isBrowser()) {
  backgroundSyncService.start(30_000);
}
