/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_APPLE_CLIENT_ID: string;
  readonly VITE_APPLE_REDIRECT_URI: string;
  readonly VITE_APPLE_REDIRECT_URI_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
