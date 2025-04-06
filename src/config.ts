// APIのベースURL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// フロントエンドのベースURL
export const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// 静的画像のURL
export const STATIC_IMAGES_URL = import.meta.env.VITE_STATIC_IMAGES_URL || '/images/frames';

// デモモード設定 - デフォルトで有効に変更
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

// バックエンドの接続タイムアウト設定
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 5000);

// デバッグモード設定
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.MODE === 'development';

// フレームのダミーデータ
export const DUMMY_FRAMES = [
  {
    id: 1,
    name: 'クラシックオーバル',
    description: 'オーバル型の上品なデザイン',
    price: 29800,
    imageUrl: '/images/frames/classic_oval.jpg',
    style: 'クラシック',
    material: 'チタン',
    color: 'ゴールド',
    shape: 'オーバル'
  },
  {
    id: 2,
    name: 'モダンスクエア',
    description: '四角型のモダンなデザイン',
    price: 32000,
    imageUrl: '/images/frames/modern_square.jpg',
    style: 'モダン',
    material: 'プラスチック',
    color: '黒',
    shape: 'スクエア'
  },
  {
    id: 3,
    name: 'ラウンドメタル',
    description: '丸型のメタルフレーム',
    price: 26500,
    imageUrl: '/images/frames/round_metal.jpg',
    style: 'クラシック',
    material: 'メタル',
    color: 'シルバー',
    shape: 'ラウンド'
  }
];

// 環境に関する情報のログ出力
if (DEBUG_MODE) {
  console.log('環境設定:', {
    API_BASE_URL,
    FRONTEND_BASE_URL,
    STATIC_IMAGES_URL,
    DEMO_MODE,
    DEBUG_MODE,
    API_TIMEOUT,
    MODE: import.meta.env.MODE
  });
} 

// API接続エラー時のハンドリング
export function handleApiError(error: any): void {
  console.error('APIエラー:', error);
  if (!DEMO_MODE) {
    console.warn('APIエラーが発生したため、デモモードに切り替えます');
    (window as any).__FORCE_DEMO_MODE = true;
  }
}

// 現在のデモモード状態を取得
export function isInDemoMode(): boolean {
  return DEMO_MODE || (window as any).__FORCE_DEMO_MODE === true;
} 