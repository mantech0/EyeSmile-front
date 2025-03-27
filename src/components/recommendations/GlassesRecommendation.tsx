import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
  Paper,
  Button,
  Rating,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  RecommendationResponse,
  FrameRecommendation
} from '../../api/recommendations';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StoreIcon from '@mui/icons-material/Store';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedFrame, setSelectedFrame] = React.useState<FrameRecommendation | null>(null);
  const [rating, setRating] = React.useState<number | null>(null);
  
  React.useEffect(() => {
    if (recommendation?.primary_recommendation) {
      setSelectedFrame(recommendation.primary_recommendation);
    }
  }, [recommendation]);
  
  if (loading) {
    return (
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Skeleton width="60%" />
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="rectangular" height={100} sx={{ my: 2 }} />
            <Skeleton variant="rectangular" width={120} height={36} />
          </Grid>
        </Grid>
      </Box>
    );
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
  
  // 表示用に価格をフォーマット
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        あなたにぴったりのメガネ
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1">
          <strong>顔分析結果:</strong> あなたは「{face_analysis.face_shape}」の顔型です
        </Typography>
        <Typography variant="body2" color="text.secondary">
          あなたの顔型に合わせて、{face_analysis.style_category}スタイルのフレームを中心にご提案しています。
        </Typography>
      </Paper>
      
      <Grid container spacing={4}>
        {/* メインの推薦フレーム表示 */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="img"
              image={frame.image_urls[0] || "https://placehold.jp/300x200.png"}
              alt={frame.name}
              sx={{ 
                height: 300, 
                objectFit: 'contain',
                backgroundColor: '#f5f5f5'
              }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" component="h2">
                  {frame.name}
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(frame.price)}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {frame.brand}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 1 }}>
                <Chip label={frame.style} size="small" />
                <Chip label={frame.shape} size="small" />
                <Chip label={frame.material} size="small" />
                <Chip label={frame.color} size="small" />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>フレーム幅:</strong> {frame.frame_width}mm
                </Typography>
                <Typography variant="body2">
                  <strong>レンズ幅:</strong> {frame.lens_width}mm
                </Typography>
                <Typography variant="body2">
                  <strong>ブリッジ幅:</strong> {frame.bridge_width}mm
                </Typography>
                <Typography variant="body2">
                  <strong>テンプル長:</strong> {frame.temple_length}mm
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => onTryOn && onTryOn(selectedFrame)}
                >
                  バーチャル試着
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  <FavoriteBorderIcon />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 推薦の詳細表示 */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              推薦理由
            </Typography>
            <Typography variant="body1" paragraph>
              {selectedFrame.recommendation_reason}
            </Typography>
            
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" gutterBottom>
                フィット評価
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating 
                  value={selectedFrame.fit_score / 20} 
                  precision={0.5} 
                  readOnly 
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2">
                  {selectedFrame.fit_score}/100
                </Typography>
              </Box>
              <Typography variant="body2" paragraph>
                {recommendation_details.fit_explanation}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                スタイル評価
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating 
                  value={selectedFrame.style_score / 20} 
                  precision={0.5} 
                  readOnly 
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2">
                  {selectedFrame.style_score}/100
                </Typography>
              </Box>
              <Typography variant="body2" paragraph>
                {recommendation_details.style_explanation}
              </Typography>
            </Paper>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                特徴
              </Typography>
              <Grid container spacing={1}>
                {recommendation_details.feature_highlights.map((feature, index) => (
                  <Grid item key={index}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={feature}
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                購入オプション
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<LocalShippingIcon />} 
                  sx={{ flex: 1 }}
                >
                  オンラインで購入
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<StoreIcon />} 
                  sx={{ flex: 1 }}
                >
                  店舗を検索
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                あなたの評価
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  value={rating}
                  onChange={(_, newValue) => {
                    setRating(newValue);
                    onFeedback && onFeedback({
                      frameId: frame.id,
                      rating: newValue || 0
                    });
                  }}
                  icon={<FavoriteIcon fontSize="inherit" />}
                  emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {rating ? `${rating}点を評価しました` : '評価してください'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      {/* 代替推薦 */}
      {alternative_recommendations.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            その他のおすすめ
          </Typography>
          <Grid container spacing={2}>
            {alternative_recommendations.map((altRec) => (
              <Grid item xs={12} sm={6} md={3} key={altRec.frame.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3
                    },
                    border: selectedFrame.frame.id === altRec.frame.id ? '2px solid' : 'none',
                    borderColor: 'primary.main'
                  }}
                  onClick={() => setSelectedFrame(altRec)}
                >
                  <CardMedia
                    component="img"
                    image={altRec.frame.image_urls[0] || "https://placehold.jp/300x200.png"}
                    alt={altRec.frame.name}
                    sx={{ height: 140, objectFit: 'contain', bgcolor: '#f5f5f5' }}
                  />
                  <CardContent>
                    <Typography variant="h6" component="h3" noWrap>
                      {altRec.frame.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {altRec.frame.brand} - {altRec.frame.style}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {formatPrice(altRec.frame.price)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Rating value={altRec.total_score / 20} precision={0.5} readOnly size="small" />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {Math.round(altRec.total_score)}点
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default GlassesRecommendation;