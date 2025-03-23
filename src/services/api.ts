import axios from 'axios';
import { Answer } from '../types/questionnaire';
import { FaceMeasurements } from '../types/measurements';

// APIのベースURL設定
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Axiosインスタンスの作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // タイムアウトを300秒に延長
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // CORS with credentialsを有効化
});

// 選択肢とIDのマッピング
const PREFERENCE_MAPPINGS: { [key: string]: number } = {
  // シーン
  '仕事': 1,
  '日常生活': 2,
  '遊び': 3,
  'スポーツ': 4,
  'その他（シーン）': 5,

  // イメージ
  '知的': 11,
  '活発': 12,
  '落ち着き': 13,
  '若々しく': 14,
  'クール': 15,
  'おしゃれ': 16,
  'かっこよく': 17,
  'かわいく': 18,
  'その他（イメージ）': 19,

  // ファッション
  'カジュアル': 20,
  'フォーマル': 21,
  'スポーティ': 22,
  'モード': 23,
  'シンプル': 24,
  'ストリート': 25,
  'アウトドア': 26,
  'その他（ファッション）': 27,

  // パーソナルカラー
  'Spring（スプリング）': 28,
  'Summer（サマー）': 29,
  'Autumn（オータム）': 30,
  'Winter（ウィンター）': 31,
  'わからない': 32
};

export const submitQuestionnaire = async (answers: Answer[]) => {
  try {
    // リクエストデータの作成
    const requestData = {
      responses: answers.map(answer => {
        const mappedIds = answer.selectedOptions.map(option => {
          // 「その他」の場合、質問タイプに応じて適切なIDを返す
          if (option === 'その他') {
            switch (answer.questionId) {
              case 1: return PREFERENCE_MAPPINGS['その他（シーン）'];
              case 2: return PREFERENCE_MAPPINGS['その他（イメージ）'];
              case 3: return PREFERENCE_MAPPINGS['その他（ファッション）'];
              default: return null;
            }
          }
          
          const id = PREFERENCE_MAPPINGS[option];
          if (!id) {
            console.warn(`マッピングが見つかりません: ${option}`);
            return null;
          }
          return id;
        }).filter(id => id !== null);

        if (mappedIds.length === 0) {
          throw new Error(`選択された選択肢のマッピングが見つかりません: ${answer.selectedOptions.join(', ')}`);
        }

        return {
          question_id: answer.questionId,
          selected_preference_ids: mappedIds
        };
      })
    };

    console.log('送信するデータ:', requestData);
    console.log('APIエンドポイント:', `${API_BASE_URL}/api/v1/questionnaire/submit`);

    const response = await api.post('/api/v1/questionnaire/submit', requestData);
    console.log('レスポンス:', response.data);
    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('APIエラー:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('サーバーとの通信がタイムアウトしました。ネットワーク接続を確認してください。');
      }

      if (!error.response) {
        throw new Error('サーバーに接続できません。バックエンドサーバーが起動しているか確認してください。');
      }

      throw new Error(`回答の送信に失敗しました: ${error.response.data?.detail || error.message}`);
    }
    console.error('予期せぬエラー:', error);
    throw error;
  }
};

// 顔の測定データをサーバーに送信
export const submitFaceMeasurements = async (measurements: FaceMeasurements) => {
  try {
    // 仮のユーザーID（本来はログインユーザーのIDを使用）
    const temporary_user_id = 1;

    const requestData = {
      user_id: temporary_user_id,
      face_width: Math.round(measurements.faceWidth),
      eye_distance: Math.round(measurements.eyeDistance),
      cheek_area: Math.round(measurements.cheekArea),
      nose_height: Math.round(measurements.noseHeight),
      temple_position: Math.round(measurements.templePosition)
    };

    console.log('送信する顔の測定データ:', requestData);
    const response = await api.post('/api/v1/face-measurements/submit', requestData);
    console.log('レスポンス:', response.data);
    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('APIエラー:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('サーバーとの通信がタイムアウトしました。');
      }

      if (!error.response) {
        throw new Error('サーバーに接続できません。バックエンドサーバーが起動しているか確認してください。');
      }

      throw new Error(`顔の測定データの送信に失敗しました: ${error.response.data?.detail || error.message}`);
    }
    console.error('予期せぬエラー:', error);
    throw error;
  }
}; 