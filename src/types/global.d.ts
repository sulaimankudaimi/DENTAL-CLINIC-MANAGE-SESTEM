import type { EyadatiApi } from '@shared/contracts';

declare global {
  interface Window {
    eyadati?: EyadatiApi;
  }
}

export {};
