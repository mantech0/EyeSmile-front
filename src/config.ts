// APIのベースURL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// フロントエンドのベースURL
export const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:3000';

// 静的画像のURL
export const STATIC_IMAGES_URL = import.meta.env.VITE_STATIC_IMAGES_URL || '';

// デモモード設定
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// デバッグモード設定
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.MODE === 'development';

// 環境に関する情報のログ出力
if (DEBUG_MODE) {
  console.log('環境設定:', {
    API_BASE_URL,
    FRONTEND_BASE_URL,
    STATIC_IMAGES_URL,
    DEMO_MODE,
    DEBUG_MODE,
    MODE: import.meta.env.MODE
  });
} 