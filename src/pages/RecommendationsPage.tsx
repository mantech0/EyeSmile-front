import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Alert, Button, CircularProgress } from '@mui/material';
import GlassesRecommendation from '../components/recommendations/GlassesRecommendation';
import AnalyzingScreen from '../components/recommendations/AnalyzingScreen';
import { 
  getGlassesRecommendations, 
  RecommendationResponse, 
  FaceData, 
  StylePreference, 
  FrameRecommendation,
  getAllFrames,
  generateAIExplanation
} from '../api/recommendations';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE_URL } from '../config';

const RecommendationsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [availableFrames, setAvailableFrames] = useState<number>(0);
  const [generatingAIExplanation, setGeneratingAIExplanation] = useState(false);
  const [isDemo, setIsDemo] = useState<boolean>(import.meta.env.VITE_DEMO_MODE === 'true');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // 即時ロード用のデモデータを生成する関数
  const generateImmediateDemo = () => {
    console.log('即時表示用のデモデータを生成');
    
    const demoFrame = {
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
    };
    
    const demoResponse: RecommendationResponse = {
      primary_recommendation: {
        frame: demoFrame,
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
    
    return demoResponse;
  };
  
  // 即時表示専用のデモデータを設定（最初のレンダリング時のみ）
  useEffect(() => {
    // デモモードが有効な場合、即座にデモデータを表示
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      console.log('即時表示用デモデータをロード中...');
      const demoData = generateImmediateDemo();
      setRecommendations(demoData);
      
      // 短いタイマーで自動的にローディングを終了
      setTimeout(() => {
        setLoading(false);
        console.log('デモデータの表示が完了しました');
      }, 2000);
    }
  }, []);
  
  // URLクエリパラメータまたはlocation stateから顔測定データを取得　
  const getFaceMeasurementData = (): FaceData => {
    try {
      // locationのstateから取得を試みる
      if (location.state && location.state.faceMeasurements) {
        const measurements = location.state.faceMeasurements;
        return {
          face_width: measurements.faceWidth || 140.0,
          eye_distance: measurements.eyeDistance || 65.0,
          cheek_area: measurements.cheekArea || 45.0,
          nose_height: measurements.noseHeight || 45.0,
          temple_position: measurements.templePosition || 82.0
        };
      }
      
      // データがない場合はデフォルト値を使用
      return {
        face_width: 140.0,
        eye_distance: 65.0,
        cheek_area: 45.0,
        nose_height: 45.0,
        temple_position: 82.0
      };
    } catch (error) {
      console.error('顔測定データの取得エラー:', error);
      // エラー時はデフォルト値を使用
      return {
        face_width: 140.0,
        eye_distance: 65.0,
        cheek_area: 45.0,
        nose_height: 45.0,
        temple_position: 82.0
      };
    }
  };
  
  useEffect(() => {
    const checkFrameAvailability = async () => {
      try {
        const frames = await getAllFrames();
        setAvailableFrames(frames.length);
        console.log(`使用可能なフレーム数: ${frames.length}`);
      } catch (error) {
        console.error('フレーム数の確認エラー:', error);
      }
    };
    
    checkFrameAvailability();
  }, []);
  
  useEffect(() => {
    // デモモードを先に検出して設定
    const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    setIsDemo(demoMode);
    console.log('デモモード設定:', demoMode);
    
    const fetchRecommendations = async () => {
      // 既に推薦データがある場合は処理をスキップ
      if (recommendations) {
        console.log('既に推薦データが存在するため、API呼び出しをスキップします');
        setLoading(false);
        return;
      }
      
      // 通常はローディング状態を維持
      if (!demoMode) {
        setLoading(true);
      }
      setError(null);
      
      // APIリクエストタイムアウト用の変数
      let timeoutId: NodeJS.Timeout | null = null;
      
      // 強制タイムアウト処理
      const forceTimeout = () => {
        console.log('API呼び出しがタイムアウトしました。デモモードに切り替えます。');
        setIsDemo(true);
        
        // デモデータを強制的に取得
        const faceData = getFaceMeasurementData();
        const stylePreference: StylePreference = {
          personal_color: "冬",
          preferred_styles: ["クラシック", "ビジネス"],
          preferred_shapes: ["ラウンド", "スクエア"],
          preferred_materials: ["チタン"],
          preferred_colors: ["ブラック", "シルバー"]
        };
        
        getGlassesRecommendations(faceData, stylePreference)
          .then(demoData => {
            console.log('タイムアウトによりデモデータを表示します:', demoData);
            setRecommendations(demoData);
            setLoading(false);
          })
          .catch(err => {
            console.error('デモデータ取得エラー:', err);
            setError('データの読み込みに失敗しました。ページをリロードしてください。');
            setLoading(false);
          });
      };
      
      // タイムアウトを設定（デモモードでは短く、通常モードでは長めに）
      timeoutId = setTimeout(forceTimeout, demoMode ? 5000 : 15000);
      
      // MediaPipeのロード状態をチェック（デモモードでなければ）
      if (!demoMode) {
        try {
          // MediaPipe関連のグローバル変数が存在しない場合はエラーとして処理
          if (!window.FaceMesh || !window.Camera || !window.drawConnectors) {
            console.warn('MediaPipeライブラリがロードされていないため、デモモードに切り替えます');
            // 明示的にデモモードに切り替え
            setIsDemo(true);
          }
        } catch (mpError) {
          console.error('MediaPipe検証エラー:', mpError);
          // MediaPipe関連のエラーが発生した場合もデモモードに切り替え
          setIsDemo(true);
        }
      }
      
      try {
        // 顔データの取得
        const faceData = getFaceMeasurementData();
        console.log('使用する顔測定データ:', faceData);
        
        // スタイル設定
        const stylePreference: StylePreference = {
          personal_color: "冬",
          preferred_styles: ["クラシック", "ビジネス"],
          preferred_shapes: ["ラウンド", "スクエア"],
          preferred_materials: ["チタン"],
          preferred_colors: ["ブラック", "シルバー"]
        };
        
        console.log('APIを呼び出し中...', { faceData, stylePreference });
        
        // APIからレコメンデーションを取得
        const recommendationData = await getGlassesRecommendations(
          faceData,
          stylePreference
        );
        
        // タイムアウトをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.log("レコメンデーション取得完了:", recommendationData);
        
        if (recommendationData) {
          setRecommendations(recommendationData);
          // デモモードの場合は処理を即時完了
          setLoading(false);
          console.log("データ設定完了。ローディング終了。");
        } else {
          throw new Error('レコメンデーションデータが空です');
        }
      } catch (error: any) {
        console.error('レコメンデーション取得エラー:', error);
        const errorMessage = error.message || 'レコメンデーションの取得中にエラーが発生しました。';
        setError(`${errorMessage} もう一度お試しください。`);
        setLoading(false);
        
        // エラーが発生した場合、デモモードに切り替え
        if (!isDemo) {
          console.log('エラーが発生したため、デモモードに切り替えます');
          setIsDemo(true);
          
          // タイムアウトをクリア
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          // 少し待ってからデモデータを表示
          setTimeout(() => {
            setError(null);
            const demoData = generateImmediateDemo();
            setRecommendations(demoData);
            setLoading(false);
          }, 1500);
        }
      }
    };
    
    fetchRecommendations();
  }, [location]);
  
  // 主要な推薦フレームが変更されたときにAI説明を生成
  useEffect(() => {
    if (recommendations && !generatingAIExplanation) {
      generateFrameExplanation(recommendations.primary_recommendation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendations]);

  const generateFrameExplanation = async (frameRecommendation: FrameRecommendation) => {
    if (!frameRecommendation || generatingAIExplanation) return;
    
    try {
      setGeneratingAIExplanation(true);
      
      // 顔データとスタイル設定を取得
      const faceData = getFaceMeasurementData();
      const stylePreference = {
        personal_color: "冬",
        preferred_styles: ["クラシック", "ビジネス"],
        preferred_shapes: ["ラウンド", "スクエア"],
        preferred_materials: ["チタン"],
        preferred_colors: ["ブラック", "シルバー"]
      };
      
      // AI説明を生成
      const response = await generateAIExplanation(
        frameRecommendation.frame,
        faceData,
        stylePreference
      );
      
      if (response.status === 'success' && recommendations) {
        // 既存の推薦オブジェクトをコピー
        const updatedRecommendations = { ...recommendations };
        
        // 説明部分を更新
        updatedRecommendations.recommendation_details = {
          fit_explanation: response.explanation.fit_explanation,
          style_explanation: response.explanation.style_explanation,
          feature_highlights: response.explanation.feature_highlights
        };
        
        // 状態を更新
        setRecommendations(updatedRecommendations);
      }
    } catch (error) {
      console.error('AIによる説明生成中にエラーが発生しました:', error);
    } finally {
      setGeneratingAIExplanation(false);
    }
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleTryOn = (frameRecommendation: FrameRecommendation) => {
    // TryOnPageへナビゲート
    console.log('TryOnPageへ移動します', frameRecommendation);
    
    // 画像URLを確実に設定
    let frameImageUrl = '/images/frames-notempel/ZJ191007_14F1_3.png'; // デフォルト画像
    
    if (frameRecommendation.frame.image_urls && frameRecommendation.frame.image_urls.length > 0) {
      frameImageUrl = frameRecommendation.frame.image_urls[0];
      
      // ローカルパスの場合、フルURLに変換
      if (!frameImageUrl.startsWith('http')) {
        frameImageUrl = `${window.location.origin}${frameImageUrl}`;
      }
    }
    
    // デバッグ用にタイムスタンプを追加（キャッシュ対策）
    const timestamp = new Date().getTime();
    
    // フォース遷移を行う（ハードリロード）
    window.location.href = `/try-on?frameId=${frameRecommendation.frame.id}&name=${encodeURIComponent(frameRecommendation.frame.name)}&brand=${encodeURIComponent(frameRecommendation.frame.brand)}&image=${encodeURIComponent(frameImageUrl)}&t=${timestamp}`;
    
    // 通常のReact Router遷移はバックアッププランとして残しておく
    /* 
    navigate('/try-on', {
      state: {
        frameId: frameRecommendation.frame.id,
        frameImage: frameImageUrl,
        frameName: frameRecommendation.frame.name,
        frameBrand: frameRecommendation.frame.brand,
        fromRecommendations: true,
        timestamp: timestamp
      },
      replace: false
    });
    */
  };
  
  const handleFeedback = (feedback: { frameId: number; rating: number; comment?: string }) => {
    console.log('Feedback:', feedback);
    // 未実装: フィードバック送信機能
    alert('フィードバックをいただきありがとうございます！');
  };
  
  const renderContent = () => {
    if (loading) {
      // 10秒後に強制的にローディングを終了
      setTimeout(() => {
        if (loading) {
          console.log('強制的にローディングを終了します');
          setLoading(false);
          
          // 推薦データがない場合は、デモデータを生成
          if (!recommendations) {
            console.log('推薦データがないため、デモデータを生成します');
            const demoData = generateImmediateDemo();
            setRecommendations(demoData);
            
            // デモモードに切り替え
            setIsDemo(true);
            // @ts-ignore: 環境変数を動的に設定
            import.meta.env.VITE_DEMO_MODE = 'true';
          }
        }
      }, 10000);
      
      return <AnalyzingScreen 
        isDemo={isDemo} 
        autoCompleteTime={isDemo ? 3000 : 7000}
        onAutoComplete={() => {
          console.log('AnalyzingScreenからの自動完了を検出');
          // 強制的にロード完了状態に設定
          if (recommendations) {
            setLoading(false);
          } else if (isDemo) {
            // デモモードで推薦がまだない場合は強制的に取得を再試行
            console.log('デモデータを強制的に取得します');
            const faceData = getFaceMeasurementData();
            const stylePreference: StylePreference = {
              personal_color: "冬",
              preferred_styles: ["クラシック", "ビジネス"],
              preferred_shapes: ["ラウンド", "スクエア"],
              preferred_materials: ["チタン"],
              preferred_colors: ["ブラック", "シルバー"]
            };
            
            // デモ推薦を取得
            getGlassesRecommendations(faceData, stylePreference)
              .then(data => {
                setRecommendations(data);
                setLoading(false);
              })
              .catch(err => {
                console.error('強制デモデータ取得エラー:', err);
                // エラーが発生しても、デモデータを生成して表示
                const demoData = generateImmediateDemo();
                setRecommendations(demoData);
                setError(null);
                setLoading(false);
              });
          }
        }}
      />;
    }
    
    if (error) {
      return (
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            再試行
          </Button>
        </Box>
      );
    }
    
    if (!recommendations) {
      // 推薦がない場合は即座にデモデータを生成して表示
      if (isDemo) {
        const demoData = generateImmediateDemo();
        setRecommendations(demoData);
      }
      
      return (
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            データを読み込み中...
          </Typography>
        </Box>
      );
    }
    
    return (
      <GlassesRecommendation 
        recommendation={recommendations}
        onTryOn={handleTryOn}
        onFeedback={handleFeedback}
      />
    );
  };
  
  return (
    <Container maxWidth={false} disableGutters sx={{ p: 0, m: 0, width: '100%' }}>
      {renderContent()}
    </Container>
  );
};

export default RecommendationsPage; 