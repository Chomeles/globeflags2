/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: KVNamespace;
  NODE_ENV: string;
}

// Füge fehlende Typen hinzu
declare global {
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
} 