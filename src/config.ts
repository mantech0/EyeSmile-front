// APIのベースURL
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

// フロントエンドのベースURL
export const FRONTEND_BASE_URL = process.env.REACT_APP_FRONTEND_BASE_URL || 'http://localhost:3000';

// デモモード設定
export const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

// デバッグモード設定
export const DEBUG_MODE = process.env.REACT_APP_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';

// 環境に関する情報のログ出力
if (DEBUG_MODE) {
  console.log('環境設定:', {
    API_BASE_URL,
    FRONTEND_BASE_URL,
    DEMO_MODE,
    DEBUG_MODE,
    NODE_ENV: process.env.NODE_ENV
  });
} 