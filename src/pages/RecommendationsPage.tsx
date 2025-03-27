import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Button } from '@mui/material';
import GlassesRecommendation from '../components/recommendations/GlassesRecommendation';
import { getGlassesRecommendations, RecommendationResponse, FaceData, StylePreference, FrameRecommendation } from '../api/recommendations';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const RecommendationsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // 実際のアプリケーションでは、locationからのstate（測定データとスタイル好み）を使用
        // または前のステップで取得したデータを使用
        
        // デモ用のダミーデータ
        const dummyFaceData: FaceData = {
          face_width: 145,
          eye_distance: 65,
          cheek_area: 120,
          nose_height: 50,
          temple_position: 70
        };
        
        const dummyStylePreference: StylePreference = {
          personal_color: 'Autumn',
          preferred_styles: ['クラシック', 'カジュアル'],
          preferred_shapes: ['ラウンド'],
          preferred_materials: ['チタン', 'アセテート'],
          preferred_colors: ['ブラック', 'ゴールド']
        };
        
        const result = await getGlassesRecommendations(dummyFaceData, dummyStylePreference);
        setRecommendations(result);
        setLoading(false);
      } catch (err) {
        console.error('推薦の取得中にエラーが発生しました:', err);
        setError('メガネの推薦を取得できませんでした。もう一度お試しください。');
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [location]);
  
  const handleTryOn = (frameRecommendation: FrameRecommendation) => {
    // バーチャル試着機能へのナビゲーション（未実装）
    console.log('バーチャル試着が選択されました:', frameRecommendation);
    // navigate('/try-on', { state: { frame: frameRecommendation.frame } });
    
    // 実装前の通知
    alert('バーチャル試着機能は現在開発中です。もうしばらくお待ちください。');
  };
  
  const handleFeedback = (feedback: { frameId: number; rating: number; comment?: string }) => {
    // フィードバックの送信処理（未実装）
    console.log('フィードバックが送信されました:', feedback);
    // APIへのフィードバック送信ロジックはここに追加
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
        <Typography variant="h4" component="h1">
          メガネ推薦結果
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 10 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            あなたに最適なメガネを探しています...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            顔の特徴とスタイル好みに基づいてぴったりの組み合わせを検索中
          </Typography>
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ my: 4 }}
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              再試行
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <GlassesRecommendation
          recommendation={recommendations || undefined}
          onTryOn={handleTryOn}
          onFeedback={handleFeedback}
        />
      )}
    </Container>
  );
};

export default RecommendationsPage; 