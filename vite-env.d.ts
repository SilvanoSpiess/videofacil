/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_GHL_WEBHOOK_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface Window {
    aistudio?: {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
}
