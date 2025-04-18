import React, { useState } from 'react';
import {
  Box,
  Typography,
  CardMedia,
  Divider,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  Container,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Grid
} from '@mui/material';
import {
  RecommendationResponse,
  FrameRecommendation
} from '../../api/recommendations';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import StoreIcon from '@mui/icons-material/Store';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DEMO_MODE, STATIC_IMAGES_URL } from '../../config';
import './GlassesRecommendation.css';

interface GlassesRecommendationProps {
  recommendation?: RecommendationResponse;
  loading?: boolean;
  error?: string;
  onTryOn?: (frame: FrameRecommendation) => void;
  onFeedback?: (feedback: { frameId: number; rating: number; comment?: string }) => void;
}

const GlassesRecommendation: React.FC<GlassesRecommendationProps> = ({
  recommendation,
  loading = false,
  error,
  onTryOn,
  onFeedback
}) => {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedFrame, setSelectedFrame] = React.useState<FrameRecommendation | null>(null);
  
  React.useEffect(() => {
    if (recommendation?.primary_recommendation) {
      setSelectedFrame(recommendation.primary_recommendation);
    }
  }, [recommendation]);
  
  if (loading) {
    return null; // ローディング表示はAnalyzingScreenコンポーネントに任せる
  }
  
  if (error) {
    return (
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#fff4f4' }}>
          <Typography variant="h6" color="error">
            エラーが発生しました
          </Typography>
          <Typography>{error}</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
            再試行
          </Button>
        </Paper>
      </Box>
    );
  }
  
  if (!recommendation || !selectedFrame) {
    return (
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">
            まだ推薦結果がありません
          </Typography>
          <Typography>顔のスキャンを完了して推薦を受け取ってください。</Typography>
        </Paper>
      </Box>
    );
  }
  
  const { primary_recommendation, alternative_recommendations, face_analysis, recommendation_details } = recommendation;
  const { frame } = selectedFrame;
  
  // フレーム画像URLの取得
  const getFrameImageUrl = (imagePaths?: string[]) => {
    // デフォルト画像パス
    const defaultImage = '/images/frames-notempel/ZJ191007_14F1_3.png';
    
    if (!imagePaths || imagePaths.length === 0) {
      console.log('画像パスが指定されていません。デフォルト画像を使用します。');
      return defaultImage;
    }
    
    // すでに/imagesから始まるパスの場合はそのまま返す
    const imagePath = imagePaths[0];
    if (imagePath.startsWith('/images/')) {
      console.log('既存の画像パスを使用:', imagePath);
      return imagePath;
    }
    
    // 画像名のみの場合はパスを構築
    if (!imagePath.includes('/')) {
      console.log('画像名からパスを構築:', `/images/frames-notempel/${imagePath}`);
      return `/images/frames-notempel/${imagePath}`;
    }
    
    // フルURLの場合はそのまま返す
    if (imagePath.startsWith('http')) {
      console.log('フルURLを使用:', imagePath);
      return imagePath;
    }
    
    // その他の場合はデフォルトパスを使用
    console.log('不明な形式のパス。デフォルト画像を使用します:', imagePath);
    return defaultImage;
  };
  
  // 表示用に価格をフォーマット
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };
  
  // 試着ページへのリンク処理を修正
  const handleTryOn = (frame: FrameRecommendation) => {
    try {
      console.log('試着ページへの遷移を開始します');
      
      if (!frame || !frame.frame) {
        console.error('フレーム情報が不足しています');
        return;
      }

      // 必須パラメータを取得
      const frameId = frame.frame.id.toString();
      const brand = encodeURIComponent(frame.frame.brand || 'ブランド不明');
      const name = encodeURIComponent(frame.frame.name || 'フレーム名不明');
      
      // 固定の画像パスを使用（テスト用）
      const imagePath = '/images/frames-notempel/ZJ191007_14F1_3.png';
      const imagePathEncoded = encodeURIComponent(imagePath);
      
      console.log('試着ページへ遷移します:', {
        frameId,
        brand,
        name,
        imagePath
      });
      
      // URLパラメータを使って直接遷移
      window.location.href = `/try-on?frameId=${frameId}&name=${name}&brand=${brand}&image=${imagePathEncoded}`;
    } catch (error) {
      console.error('試着ページへの遷移中にエラーが発生しました:', error);
    }
  };
  
  return (
    <div className="recommendation-container">
      {/* 顔型分析結果 (RESULT) */}
      <div className="result-section">
        <div className="result-header">
          <Typography variant="h5">RESULT</Typography>
          <Typography variant="subtitle1" className="face-shape-text">
            {face_analysis.style_category}な{face_analysis.face_shape}
          </Typography>
        </div>
        
        <div className="face-illustration">
          <img 
            src="/images/recommendations/glasses-overlay.png" 
            alt="顔型分析" 
            className="face-image" 
          />
        </div>
        
        <div className="analysis-description">
          <Typography variant="body1" align="center">
            あなたはクールな印象で<br />メリハリがあるシャープな顔立ちです。
          </Typography>
        </div>
        
        <div className="measurement-stats">
          <div className="stat-container">
            <div className="stat-label">顔の立体感</div>
            <div className="stat-bar-container">
              <div className="stat-labels">
                <span>メリハリ</span>
                <span>マイルド</span>
              </div>
              <div 
                className="stat-bar" 
                style={{ 
                  background: 'linear-gradient(to right, #FF5252 0%, #FF5252 70%, #FFCDD2 70%, #FFCDD2 100%)', 
                  height: '15px' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="stat-container">
            <div className="stat-label">顔の幅</div>
            <div className="stat-bar-container">
              <div className="stat-labels">
                <span>シャープ</span>
                <span>ラウンド</span>
              </div>
              <div 
                className="stat-bar" 
                style={{ 
                  background: 'linear-gradient(to right, #3F51B5 0%, #3F51B5 80%, #C5CAE9 80%, #C5CAE9 100%)', 
                  height: '15px' 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="metrics-panel">
          <div className="metric-row">
            <span className="metric-title">目の幅</span>
            <span className="metric-value">370mm</span>
          </div>
          <div className="metric-row">
            <span className="metric-title">顔の幅</span>
            <span className="metric-value">1370mm</span>
          </div>
          <div className="metric-row">
            <span className="metric-title">顔の長さ</span>
            <span className="metric-value">1970mm</span>
          </div>
        </div>
        
      </div>
      
      {/* メイン推薦フレーム (あなたに似合うアイウェア) */}
      <div className="recommendation-section">
        <Typography variant="h5" component="h2" className="section-title">
          あなたに似合うアイウェア
        </Typography>
        
        <div className="frame-card-container">
          <Card className="frame-card">
            <div className="frame-image-container">
              <img
                src={getFrameImageUrl(frame.image_urls)}
                alt={`${frame.brand} ${frame.name}`}
                className="frame-image"
                onError={(e) => {
                  console.error(`画像の読み込みに失敗しました: ${frame.brand} ${frame.name}`);
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/frames/ZJ71017_49A1.jpg";
                  target.onerror = null; // 無限ループ防止
                }}
              />
            </div>
            
            <CardContent className="frame-details">
              <Typography variant="subtitle2" color="text.secondary" align="center" gutterBottom>
                {frame.brand}
              </Typography>
              <Typography variant="h6" component="h3" className="frame-name" align="center">
                {frame.name}
              </Typography>
              <Typography variant="body2" className="frame-specs" align="center">
                {frame.style} - {frame.shape} - {frame.material}
              </Typography>
              
              <div className="frame-meta">
                <Typography variant="body2" color="text.secondary" align="center">
                  {frame.frame_width}mm x {frame.lens_height}mm
                </Typography>
                <Typography variant="h6" color="primary" className="frame-price" align="center">
                  {formatPrice(frame.price)}
                </Typography>
              </div>
              
              <Divider className="divider" />
              
              <div className="score-container">
                <div className="score-label">
                  <Typography variant="body2">フィット度:</Typography>
                  <Typography variant="body2">{Math.round(selectedFrame.fit_score)}%</Typography>
                </div>
                <div 
                  className="score-bar" 
                  style={{ 
                    background: `linear-gradient(to right, #2196F3 0%, #2196F3 ${Math.round(selectedFrame.fit_score)}%, #f0f0f0 ${Math.round(selectedFrame.fit_score)}%, #f0f0f0 100%)`,
                    height: '12px' 
                  }}
                ></div>
              </div>
              
              <div className="score-container">
                <div className="score-label">
                  <Typography variant="body2">スタイル度:</Typography>
                  <Typography variant="body2">{Math.round(selectedFrame.style_score)}%</Typography>
                </div>
                <div 
                  className="score-bar" 
                  style={{ 
                    background: `linear-gradient(to right, #FF9800 0%, #FF9800 ${Math.round(selectedFrame.style_score)}%, #f0f0f0 ${Math.round(selectedFrame.style_score)}%, #f0f0f0 100%)`,
                    height: '12px' 
                  }}
                ></div>
              </div>
            </CardContent>
            
            <CardActions className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("試着リンクがクリックされました");
                  handleTryOn(selectedFrame);
                }}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#1976D2',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  flex: '1',
                  height: '40px',
                  maxWidth: 'calc(50% - 4px)',
                  textAlign: 'center'
                }}
              >
                <VisibilityIcon style={{ fontSize: '16px' }} />
                試してみる
              </a>
              
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('相談するボタンがクリックされました');
                  if (onFeedback) {
                    onFeedback({ frameId: frame.id, rating: 4 });
                  }
                }}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#1976D2',
                  textDecoration: 'none',
                  border: '1px solid #1976D2',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  flex: '1',
                  height: '40px',
                  maxWidth: 'calc(50% - 4px)',
                  marginLeft: '8px',
                  textAlign: 'center'
                }}
              >
                <StoreIcon style={{ fontSize: '16px' }} />
                相談する
              </a>
            </CardActions>
          </Card>
        </div>
      </div>
      
      {/* WHY - 推薦理由 */}
      <div className="explanation-section">
        <div className="explanation-header">
          <Typography variant="h6" style={{ color: '#FFD700' }}>WHY - なぜこのメガネが似合うのか</Typography>
        </div>
        
        <div className="explanation-content">
          <Typography variant="body1" paragraph style={{ color: 'white' }}>
            {recommendation_details.fit_explanation}
          </Typography>
          
          <Typography variant="body1" paragraph style={{ color: 'white' }}>
            {recommendation_details.style_explanation}
          </Typography>
        </div>
      </div>
      
      {/* 免責事項/コピーライト */}
      <div className="footer-section">
        <Typography variant="caption" color="text.secondary" className="disclaimer">
          これらの推薦はデータに基づいた自動生成です。実際の試着をお勧めします。
        </Typography>
        <Typography variant="caption" color="text.secondary" className="copyright">
          © 2023 EyeSmile メガネレコメンデーションシステム
        </Typography>
      </div>
    </div>
  );
};

export default GlassesRecommendation;