import axios from 'axios';
import { Answer } from '../types/questionnaire';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const submitQuestionnaire = async (answers: Answer[]) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/questionnaire/submit`,
      {
        responses: answers.map(answer => ({
          question_id: answer.questionId,
          selected_preference_ids: [answer.selectedOptions[0]] // 単一選択の場合は配列の最初の要素のみを使用
        }))
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    throw error;
  }
}; 