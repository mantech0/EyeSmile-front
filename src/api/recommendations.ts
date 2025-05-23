import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface FaceData {
  face_width: number;
  eye_distance: number;
  cheek_area: number;
  nose_height: number;
  temple_position: number;
}

export interface StylePreference {
  personal_color?: string;
  preferred_styles?: string[];
  preferred_shapes?: string[];
  preferred_materials?: string[];
  preferred_colors?: string[];
}

export interface RecommendationRequest {
  face_data: FaceData;
  style_preference?: StylePreference;
}

export interface FrameDetail {
  id: number;
  name: string;
  brand: string;
  price: number;
  style: string;
  shape: string;
  material: string;
  color: string;
  frame_width: number;
  lens_width: number;
  bridge_width: number;
  temple_length: number;
  lens_height: number;
  weight: number;
  recommended_face_width_min: number;
  recommended_face_width_max: number;
  recommended_nose_height_min: number;
  recommended_nose_height_max: number;
  personal_color_season: string;
  face_shape_types: string[];
  style_tags: string[];
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface FrameRecommendation {
  frame: FrameDetail;
  fit_score: number;
  style_score: number;
  total_score: number;
  recommendation_reason: string;
}

export interface RecommendationDetail {
  fit_explanation: string;
  style_explanation: string;
  feature_highlights: string[];
}

export interface RecommendationResponse {
  primary_recommendation: FrameRecommendation;
  alternative_recommendations: FrameRecommendation[];
  face_analysis: {
    face_shape: string;
    style_category: string;
    demo_mode?: boolean;
  };
  recommendation_details: RecommendationDetail;
}

export interface AIExplanationResponse {
  status: string;
  explanation: {
    fit_explanation: string;
    style_explanation: string;
    feature_highlights: string[];
  };
}

/**
 * 利用可能なフレームの一覧を取得する
 */
export const getAllFrames = async (): Promise<FrameDetail[]> => {
  try {
    console.log('フレーム一覧を取得します');
    const response = await axios.get(`${API_BASE_URL}/api/v1/frames`);
    console.log(`${response.data.length}件のフレームデータを取得しました`);
    return response.data;
  } catch (error) {
    console.error('フレーム一覧取得エラー:', error);
    throw error;
  }
};

/**
 * 特定のフレームの詳細を取得する
 */
export const getFrameById = async (frameId: number): Promise<FrameDetail> => {
  try {
    console.log(`フレームID: ${frameId} の詳細を取得します`);
    const response = await axios.get(`${API_BASE_URL}/api/v1/frames/${frameId}`);
    return response.data;
  } catch (error) {
    console.error(`フレームID: ${frameId} の詳細取得エラー:`, error);
    throw error;
  }
};

/**
 * 顔の測定データとスタイル好みに基づいてメガネ推薦を取得する
 */
export const getGlassesRecommendations = async (
  faceData: FaceData,
  stylePreference?: StylePreference
): Promise<RecommendationResponse> => {
  // デモモードチェック - 環境変数からデモモードが有効かどうかを確認
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  console.log('デモモード設定:', isDemo);
  
  if (isDemo) {
    console.log('デモモードでの実行 - APIをスキップしてデモデータを使用します');
    // 少し遅延を入れて非同期処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateDemoRecommendation(faceData, stylePreference);
  }
  
  try {
    console.log('メガネ推薦APIを呼び出します', { faceData, stylePreference });
    
    const requestData: RecommendationRequest = {
      face_data: faceData,
      style_preference: stylePreference
    };
    
    // タイムアウト保護のためPromise.race使用
    const response = await Promise.race([
      axios.post(
        `${API_BASE_URL}/api/v1/recommendations/glasses`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 8000 // 8秒のタイムアウト
        }
      ),
      // タイムアウト用のPromise
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('手動タイムアウト: 8秒経過')), 8000)
      )
    ]);
    
    console.log('メガネ推薦APIレスポンス:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('メガネ推薦APIエラー:', error);
    console.error('エラーの詳細:', error.message);
    
    if (error.response) {
      // サーバーからのレスポンスがあったがエラーステータスだった場合
      console.error('サーバーエラー詳細:', error.response.status, error.response.data);
    } else if (error.request) {
      // リクエストは成功したがレスポンスがない場合
      console.error('レスポンスなし (タイムアウトなど):', error.request);
    }
    
    // デモモードに強制的に切り替える（環境変数を設定）
    console.log('エラーが発生したため、デモモードに切り替えます');
    // @ts-ignore: 環境変数を動的に設定
    import.meta.env.VITE_DEMO_MODE = 'true';
    
    // フォールバック処理 - デモデータを生成
    console.log('フォールバック: デモ推薦データを生成します');
    
    // 少し遅延を入れてUIのフリーズを防ぐ
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateDemoRecommendation(faceData, stylePreference);
  }
};

// デモ推薦データ生成用の関数（コード重複を減らすため分離）
const generateDemoRecommendation = async (
  faceData: FaceData,
  stylePreference?: StylePreference
): Promise<RecommendationResponse> => {
  try {
    console.log('デモモードでの推薦を生成します - 非同期処理をスキップ');
    
    // フレーム一覧の取得を試みるが、エラーの場合はハードコードされたデータを使用
    try {
      // フレーム一覧を取得
      const frames = await getAllFrames();
      
      if (frames && frames.length > 0) {
        // フレームデータから推薦レスポンスを生成
        const primaryFrame = frames[Math.floor(Math.random() * 5)]; // 最初の数フレームからランダムに選択
        
        // 代替推薦用に異なるフレームを4つ選択
        const alternativeFrames = [];
        const usedIndexes = new Set<number>();
        const primaryIndex = frames.findIndex(f => f.id === primaryFrame.id);
        usedIndexes.add(primaryIndex);
        
        while (alternativeFrames.length < 4 && usedIndexes.size < frames.length) {
          const randomIndex = Math.floor(Math.random() * frames.length);
          if (!usedIndexes.has(randomIndex)) {
            usedIndexes.add(randomIndex);
            alternativeFrames.push(frames[randomIndex]);
          }
        }
        
        // 推薦レスポンスの構築
        const response: RecommendationResponse = {
          primary_recommendation: {
            frame: primaryFrame,
            fit_score: 85.0,
            style_score: 90.0,
            total_score: 87.0,
            recommendation_reason: `${primaryFrame.brand}の${primaryFrame.name}は、あなたの顔の形状と好みのスタイルに適しています。`
          },
          alternative_recommendations: alternativeFrames.map(frame => ({
            frame,
            fit_score: 70 + Math.random() * 20,
            style_score: 70 + Math.random() * 20,
            total_score: 70 + Math.random() * 20,
            recommendation_reason: `${frame.brand}の${frame.name}も良い選択肢です。`
          })),
          face_analysis: {
            face_shape: faceData.face_width > 135 ? "丸型" : "楕円型",
            style_category: stylePreference?.preferred_styles?.[0] || "クラシック",
            demo_mode: true
          },
          recommendation_details: {
            fit_explanation: `あなたの顔幅(${faceData.face_width}mm)に合わせた最適なフレームを選びました。`,
            style_explanation: stylePreference?.preferred_styles ? 
              `あなたのお好みの${stylePreference.preferred_styles.join('・')}スタイルに合うフレームです。` : 
              "あなたの個性を引き立てるスタイリッシュなフレームです。",
            feature_highlights: [
              `${primaryFrame.material}素材`,
              `${primaryFrame.shape}シェイプ`,
              `${primaryFrame.color}カラー`
            ]
          }
        };
        
        console.log('フレーム一覧から生成した推薦データ:', response);
        return response;
      }
    } catch (fallbackError) {
      console.error('代替推薦生成エラー、ハードコードデータを使用します:', fallbackError);
    }
    
    // 以下は最終フォールバック: ハードコードされたデモデータ
  } catch (fallbackError) {
    console.error('代替推薦生成エラー:', fallbackError);
  }
  
  // 最終フォールバック: ハードコードされたデモデータ
  const demoResponse: RecommendationResponse = {
    primary_recommendation: {
      frame: {
        id: 1,
        name: "クラシックラウンド",
        brand: "Zoff",
        price: 15000,
        style: "クラシック",
        shape: "ラウンド",
        material: "チタン",
        color: "シルバー",
        frame_width: 135.0,
        lens_width: 50.0,
        bridge_width: 20.0,
        temple_length: 140.0,
        lens_height: 45.0,
        weight: 15.0,
        recommended_face_width_min: 125.0,
        recommended_face_width_max: 145.0,
        recommended_nose_height_min: 35.0,
        recommended_nose_height_max: 55.0,
        personal_color_season: "Winter",
        face_shape_types: ["丸型", "卵型"],
        style_tags: ["クラシック", "ビジネス", "カジュアル"],
        image_urls: ["/images/frames/zoff-sporty-round.jpg"],
        created_at: "2023-01-01T00:00:00",
        updated_at: "2023-01-01T00:00:00"
      },
      fit_score: 90.0,
      style_score: 85.0,
      total_score: 87.5,
      recommendation_reason: "このクラシックなラウンドフレームは、あなたの顔型と相性が良く、知的な印象を与えます。"
    },
    alternative_recommendations: [
      {
        frame: {
          id: 2,
          name: "モダンスクエア",
          brand: "JINS",
          price: 18000,
          style: "モダン",
          shape: "スクエア",
          material: "アセテート",
          color: "ブラック",
          frame_width: 138.0,
          lens_width: 52.0,
          bridge_width: 18.0,
          temple_length: 145.0,
          lens_height: 42.0,
          weight: 18.0,
          recommended_face_width_min: 128.0,
          recommended_face_width_max: 148.0,
          recommended_nose_height_min: 38.0,
          recommended_nose_height_max: 58.0,
          personal_color_season: "Winter",
          face_shape_types: ["楕円", "卵型"],
          style_tags: ["モダン", "ビジネス", "デイリー"],
          image_urls: ["/images/frames/jins-classic-square.jpg"],
          created_at: "2023-01-01T00:00:00",
          updated_at: "2023-01-01T00:00:00"
        },
        fit_score: 80.0,
        style_score: 85.0,
        total_score: 82.0,
        recommendation_reason: "このモダンなスクエアフレームは、あなたの顔立ちに知的な印象を加えます。"
      }
    ],
    face_analysis: {
      face_shape: "楕円顔",
      style_category: "クラシック",
      demo_mode: true
    },
    recommendation_details: {
      fit_explanation: "あなたの楕円形の顔には、このクラシックなラウンドフレームが調和します。顔の輪郭を引き立て、自然な印象を与えます。",
      style_explanation: "クラシックで知的な印象を与えるデザインです。様々なシーンで活躍します。",
      feature_highlights: ["軽量チタン素材", "クラシックデザイン", "調整可能なノーズパッド"]
    }
  };
  
  console.log('ハードコードされたデモデータを使用します');
  return demoResponse;
};

/**
 * AIを使用してフレームの詳細な説明を生成する
 */
export const generateAIExplanation = async (
  frameData: FrameDetail,
  faceData: FaceData,
  stylePreference?: StylePreference
): Promise<AIExplanationResponse> => {
  // デモモードチェック
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  
  if (isDemo) {
    console.log('デモモードでAI説明を生成します');
    return generateDemoAIExplanation(frameData, faceData, stylePreference);
  }
  
  try {
    console.log('AI説明生成APIを呼び出します', { frameData, faceData, stylePreference });
    const url = `${API_BASE_URL}/api/v1/ai-explanation/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frame_data: frameData,
        face_data: faceData,
        style_preference: stylePreference,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI説明生成APIレスポンス:', data);
    return data;
  } catch (error) {
    console.error('AIによる説明生成中にエラーが発生しました:', error);
    // エラー時はデモの説明を返す
    return generateDemoAIExplanation(frameData, faceData, stylePreference);
  }
};

/**
 * デモ用のAI説明を生成する
 */
const generateDemoAIExplanation = (
  frameData: FrameDetail,
  faceData: FaceData,
  stylePreference?: StylePreference
): AIExplanationResponse => {
  console.log('デモ用のAI説明を生成します', { frameData, faceData, stylePreference });
  
  return {
    status: 'success',
    explanation: {
      fit_explanation: `${frameData.shape}型のフレームはあなたの顔幅(${faceData.face_width}mm)に適しています。レンズ幅${frameData.lens_width}mmのサイズ感が、顔全体のバランスを整えます。ブリッジ幅${frameData.bridge_width}mmが鼻に自然にフィットし、長時間の着用でも快適です。`,
      style_explanation: `${frameData.brand}の${frameData.style}スタイルは、あなたの好みに合わせた洗練されたデザインです。${frameData.material}素材と${frameData.color}カラーの組み合わせが、あなたの個性を引き立てます。日常使いからビジネスシーンまで幅広く活躍します。`,
      feature_highlights: [
        `高品質な${frameData.material}素材を使用し、軽量かつ耐久性に優れています`,
        `${frameData.shape}シェイプが顔の輪郭とバランスよく調和します`,
        `${frameData.color}カラーが肌の色味を引き立てます`,
        "鼻あての高さが調整可能で、フィット感を向上",
        "レンズのゆがみが少なく視界が鮮明"
      ]
    }
  };
}; 