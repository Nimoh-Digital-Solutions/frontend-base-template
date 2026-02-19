// Common type definitions used throughout the application

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export type Theme = 'light' | 'dark';
export type Locale = 'en' | 'es' | 'fr';

export interface AppConfig {
  theme: Theme;
  locale: Locale;
  debug: boolean;
}
