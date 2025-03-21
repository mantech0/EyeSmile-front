import axios from 'axios';
import { Answer } from '../types/questionnaire';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
          const baseOption = option.replace('（その他）', '');
          const id = PREFERENCE_MAPPINGS[baseOption];
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

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/questionnaire/submit`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('レスポンス:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('APIエラー:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`回答の送信に失敗しました: ${error.response?.data?.detail || error.message}`);
    }
    console.error('予期せぬエラー:', error);
    throw error;
  }
}; 