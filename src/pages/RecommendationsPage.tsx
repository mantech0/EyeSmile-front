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
      try {
        setLoading(true);
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
          // 少し待ってから再試行
          setTimeout(() => {
            setError(null);
            setLoading(true);
            fetchRecommendations();
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
    console.log('Try on frame:', frameRecommendation);
    // 未実装: 試着機能
    alert(`「${frameRecommendation.frame.name}」を試着機能は現在開発中です`);
  };
  
  const handleFeedback = (feedback: { frameId: number; rating: number; comment?: string }) => {
    console.log('Feedback:', feedback);
    // 未実装: フィードバック送信機能
    alert('フィードバックをいただきありがとうございます！');
  };
  
  const renderContent = () => {
    if (loading) {
      return <AnalyzingScreen 
        isDemo={isDemo} 
        autoCompleteTime={isDemo ? 3000 : 10000}
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
                setError('推薦データの取得に失敗しました。ページを再読み込みしてください。');
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
    <Container>
      <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleGoBack}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
      </Box>
      
      {renderContent()}
    </Container>
  );
};

export default RecommendationsPage; 