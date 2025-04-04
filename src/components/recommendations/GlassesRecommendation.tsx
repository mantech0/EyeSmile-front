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
import { DEMO_MODE, STATIC_IMAGES_URL } from '../../config';

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
  
  // 商品画像のURLをチェックして適切な画像を表示する
  const getFrameImageUrl = (urls: string[] | undefined, index: number = 0): string => {
    console.log("画像URL配列:", urls);
    
    // デモモードまたは開発環境ではダミー画像を使用
    if (DEMO_MODE) {
      console.log("デモモードではローカルのダミー画像を使用します");
      
      // ブランド名とスタイルから適切なファイル名を生成（真正面の画像を使用）
      const brandClean = frame.brand.toLowerCase().replace(/\s+/g, '-');
      const styleClean = frame.style.toLowerCase().replace(/\s+/g, '-');
      const filename = `${brandClean}-${styleClean}.jpg`;
      
      // Zoffブランドの場合は既存のダミー画像を使用
      if (frame.brand.includes("Zoff")) {
        return "/images/frames/zoff-sporty-round.jpg";
      }
      
      // JINS判定
      if (frame.brand.includes("JINS")) {
        return "/images/frames/jins-classic-round.jpg";
      }
      
      // デモブランド判定
      if (frame.brand.includes("Demo") || frame.brand.includes("デモ")) {
        if (frame.shape.toLowerCase().includes("round")) {
          return "/images/frames/zoff-sporty-round.jpg";
        } else if (frame.shape.toLowerCase().includes("square")) {
          return "/images/frames/jins-classic-square.jpg";
        } else {
          return "/images/frames/jins-classic-round.jpg";
        }
      }
      
      return `/images/frames/${filename}`;
    }
    
    if (!urls || urls.length === 0) {
      // デフォルトのプレースホルダー画像
      console.log("URLが見つからないため、デフォルト画像を使用します");
      return `https://placehold.jp/4fc3f7/ffffff/400x300.png?text=${encodeURIComponent(frame.brand + ' ' + frame.name)}`;
    }
    
    const url = urls[index];
    console.log("選択された画像URL:", url);
    
    if (url.startsWith('http')) {
      return url;
    } else if (url.startsWith('/')) {
      // 相対パスの場合は静的画像URLを使用
      if (STATIC_IMAGES_URL) {
        // 画像パスに/images/frames/を含む場合は、既に正しい形式と見なす
        if (url.includes('/images/frames/')) {
          // 静的画像URLと画像パスを適切に結合
          const fullUrl = `${STATIC_IMAGES_URL}${url}`;
          console.log("静的画像URLを使用:", fullUrl);
          return fullUrl;
        } else {
          // /frames/のみを含む場合は/images/を追加
          const path = url.startsWith('/frames/') ? `/images${url}` : url;
          const fullUrl = `${STATIC_IMAGES_URL}${path}`;
          console.log("静的画像URLを使用:", fullUrl);
          return fullUrl;
        }
      } else {
        // 静的画像URLが設定されていない場合はオリジンを使用
        const baseUrl = window.location.origin;
        console.log("相対パスを絶対URLに変換:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
    } else {
      // ファイル名のみの場合は、静的画像URLと組み合わせる
      if (STATIC_IMAGES_URL) {
        // 静的画像URLと画像名を結合
        const fullUrl = `${STATIC_IMAGES_URL}/images/frames/${url}`;
        console.log("ファイル名のみから静的画像URLを生成:", fullUrl);
        return fullUrl;
      }
      // 静的画像URLが設定されていない場合はプレースホルダーを使用
      console.log("不正なURL形式のため、プレースホルダーを使用します");
      return `https://placehold.jp/4fc3f7/ffffff/400x300.png?text=${encodeURIComponent(frame.brand + ' ' + frame.name)}`;
    }
  };
  
  // 表示用に価格をフォーマット
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };
  
  return (
    <Box sx={{ my: 4, mx: 'auto', maxWidth: isMobile ? '100%' : '1200px', px: isMobile ? 2 : 4 }}>
      {/* 顔型分析結果 (RESULT) */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, mx: 'auto', maxWidth: '600px' }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            align="center"
            sx={{ 
              pb: 1, 
              mb: 2, 
              borderBottom: '1px solid #e0e0e0' 
            }}
          >
            RESULT
          </Typography>
          
          <Typography variant="subtitle1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
            {face_analysis.style_category}な{face_analysis.face_shape}
          </Typography>
          
          {/* デバッグ用に現在の顔型を表示 */}
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="caption" align="center" sx={{ display: 'block', mb: 1, color: 'gray' }}>
              顔型: {face_analysis.face_shape}
            </Typography>
          )}
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              my: 3,
              position: 'relative',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* 顔型アイコン - 青い人型モデル */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 200,
                mb: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* 頭部 - 青い顔型モデル */}
                <g>
                  {/* 頭 */}
                  <ellipse cx="100" cy="90" rx="60" ry="70" fill="#4FC3F7" />
                  <ellipse cx="100" cy="95" rx="50" ry="60" fill="#29B6F6" />

                  {/* 顔のディテール */}
                  <rect x="75" y="70" width="50" height="8" rx="4" fill="#0288D1" opacity="0.5" />
                  <circle cx="75" cy="80" r="5" fill="#0288D1" opacity="0.7" />
                  <circle cx="125" cy="80" r="5" fill="#0288D1" opacity="0.7" />
                  <path d="M85 105 Q100 115 115 105" stroke="#0288D1" strokeWidth="2" fill="none" />

                  {/* 測定データの表示 */}
                  {/* 顔幅のマーカー */}
                  <line x1="40" y1="90" x2="160" y2="90" stroke="#E53935" strokeWidth="1" strokeDasharray="4" />
                  <line x1="40" y1="85" x2="40" y2="95" stroke="#E53935" strokeWidth="2" />
                  <line x1="160" y1="85" x2="160" y2="95" stroke="#E53935" strokeWidth="2" />
                  <text x="100" y="40" fontSize="12" textAnchor="middle" fill="#E53935" fontWeight="bold">顔幅: 140mm</text>
                  
                  {/* 目の距離のマーカー */}
                  <line x1="75" y1="80" x2="125" y2="80" stroke="#FF9800" strokeWidth="1" strokeDasharray="4" />
                  <circle cx="75" cy="80" r="2" stroke="#FF9800" strokeWidth="2" fill="#FF9800" />
                  <circle cx="125" cy="80" r="2" stroke="#FF9800" strokeWidth="2" fill="#FF9800" />
                  <text x="100" y="70" fontSize="11" textAnchor="middle" fill="#FF9800" fontWeight="bold">目の距離: 65mm</text>
                  
                  {/* 頬の大きさのマーカー */}
                  <path d="M65 95 Q90 120 135 95" stroke="#4CAF50" strokeWidth="1" strokeDasharray="4" fill="none" />
                  <text x="100" y="140" fontSize="11" textAnchor="middle" fill="#4CAF50" fontWeight="bold">頬の大きさ: 45㎠</text>
                </g>
                
                {/* 顔型の種類 */}
                <text x="100" y="180" fontSize="14" textAnchor="middle" fill="#3d4070" fontWeight="bold">
                  {face_analysis.face_shape}
                </text>
              </svg>
            </Box>
            
            {/* 測定値ボックス（削除） */}
          </Box>
          
          <Box sx={{ mb: 3, maxWidth: '400px', mx: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom align="center">
              顔の立体感
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ width: '30%' }}>
                メリハリ
              </Typography>
              <Box sx={{ width: '40%' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 5,
                    background: 'linear-gradient(to right, #FF6B6B, #FFE66D)'
                  }} 
                />
              </Box>
              <Typography variant="caption" align="right" sx={{ width: '30%' }}>
                マイルド
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3, maxWidth: '400px', mx: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom align="center">
              顔の構造
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ width: '30%' }}>
                シャープ
              </Typography>
              <Box sx={{ width: '40%' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={60}
                  sx={{ 
                    height: 8, 
                    borderRadius: 5,
                    background: 'linear-gradient(to right, #5B86E5, #36D1DC)'
                  }}
                />
              </Box>
              <Typography variant="caption" align="right" sx={{ width: '30%' }}>
                ラウンド
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {/* メイン推薦フレーム (あなたに似合うアイウェア) */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            mb: 3, 
            fontWeight: 'bold',
            textAlign: 'center' 
          }}
        >
          あなたに似合うアイウェア
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Card 
            sx={{ 
              maxWidth: isMobile ? '100%' : 380, 
              width: '100%',
              m: 1, 
              backgroundColor: '#f5f9ff',
              boxShadow: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 5
              }
            }}
            onClick={() => onTryOn && onTryOn(selectedFrame)}
          >
            <CardMedia
              component="img"
              alt={`${frame.brand} ${frame.name}`}
              height="240"
              image={getFrameImageUrl(frame.image_urls)}
              sx={{ objectFit: 'contain', p: 2, backgroundColor: '#ffffff' }}
              onError={(e) => {
                console.error(`画像の読み込みに失敗しました: ${frame.brand} ${frame.name}`);
                const target = e.target as HTMLImageElement;
                const currentSrc = target.src;
                console.log("失敗した画像URL:", currentSrc);
                
                // エラー処理の試行カウント (3回まで試行)
                const retryCount = parseInt(target.dataset.retryCount || '0', 10);
                if (retryCount >= 3) {
                  console.warn("最大試行回数に達しました。プレースホルダー画像を表示します。");
                  target.src = `https://placehold.jp/4fc3f7/ffffff/400x300.png?text=${encodeURIComponent(frame.brand + ' ' + frame.name)}`;
                  return;
                }
                
                target.dataset.retryCount = (retryCount + 1).toString();
                
                // URLにバックエンドドメインが含まれている場合
                if (currentSrc.includes('tech0-gen-8-step4-eyesmile-back.azurewebsites.net')) {
                  try {
                    // URLからパス部分を抽出
                    const urlObj = new URL(currentSrc);
                    const pathParts = urlObj.pathname.split('/');
                    
                    // パスに'frames'を含む最後の部分を取得
                    const framePart = pathParts.findIndex(part => part === 'frames');
                    if (framePart >= 0) {
                      const imageName = pathParts.slice(framePart).join('/');
                      console.log(`別のパスでリトライ: /images/${imageName}`);
                      
                      // まずローカルパスを試す
                      target.src = `/images/${imageName}`;
                      return;
                    }
                  } catch (err) {
                    console.error('URL解析エラー:', err);
                  }
                }
                
                // デモモードでなければファイル名のみで再試行
                if (!DEMO_MODE && frame.image_urls && frame.image_urls.length > 0) {
                  const fileNameMatch = currentSrc.match(/\/([^\/]+)$/);
                  if (fileNameMatch && fileNameMatch[1]) {
                    const fileName = fileNameMatch[1];
                    console.log(`ファイル名だけで再試行: ${fileName}`);
                    target.src = `/images/frames/${fileName}`;
                    return;
                  }
                }
                
                // すべての方法が失敗した場合、Zoffのダミー画像を使用
                console.warn("画像の読み込みに失敗しました。ダミー画像を使用します");
                target.src = `/images/frames/zoff-sporty-round.jpg`;
              }}
            />
            
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {frame.brand}
              </Typography>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                {frame.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {frame.style} - {frame.shape} - {frame.material}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {frame.frame_width}mm x {frame.lens_height}mm
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(frame.price)}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                フィット度: {Math.round(selectedFrame.fit_score)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={selectedFrame.fit_score} 
                color="success"
                sx={{ mb: 2, height: 6, borderRadius: 3 }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                スタイル度: {Math.round(selectedFrame.style_score)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={selectedFrame.style_score} 
                color="info"
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => onTryOn && onTryOn(selectedFrame)}
                startIcon={<ThumbUpIcon />}
                size="large"
                sx={{ mr: 1 }}
              >
                アイウェアを試す
              </Button>
              
              <Button 
                variant="outlined"
                fullWidth
                onClick={() => onFeedback && onFeedback({ frameId: frame.id, rating: 4 })}
                startIcon={<StoreIcon />}
                size="large"
              >
                相談する
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Box>
      
      {/* WHY - 推薦理由 */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
          <Typography 
            variant="h6" 
            gutterBottom
            align="center"
            sx={{ 
              pb: 1, 
              mb: 2, 
              borderBottom: '1px solid #e0e0e0' 
            }}
          >
            WHY - なぜこのメガネが似合うのか
          </Typography>
          
          <Typography variant="body1" paragraph>
            {recommendation_details.fit_explanation}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {recommendation_details.style_explanation}
          </Typography>
        </Paper>
      </Box>
      
      {/* 免責事項/コピーライト */}
      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          これらの推薦はデータに基づいた自動生成です。実際の試着をお勧めします。
        </Typography>
        <Typography variant="caption" color="text.secondary">
          © 2023 EyeSmile メガネレコメンデーションシステム
        </Typography>
      </Box>
    </Box>
  );
};

export default GlassesRecommendation;