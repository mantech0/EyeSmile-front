import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RealtimeTryOn from '../components/tryOn/RealtimeTryOn';
import { Box, IconButton, Typography, Button, Paper, ButtonGroup } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useStaff, staffMembers } from '../context/StaffContext';

// APIから受け取るフレーム情報の型定義
interface ApiFrame {
  id: number;
  name: string;
  brand: string;
  image_url: string;
}

// 詳細なフレーム情報の型定義
interface FrameWithData {
  frame: {
    id: number;
    name: string;
    brand: string;
    style: string;
    shape: string;
    material: string;
    price: number;
    frame_width: number;
    lens_height: number;
    image_urls: string[];
  };
  fit_score: number;
  style_score: number;
}

const TryOnPage: React.FC = () => {
  const [selectedGlasses, setSelectedGlasses] = useState<string | null>(null);
  const [frameImage, setFrameImage] = useState<string>('/images/frames-notempel/ZJ191007_14F1_3.png');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<ApiFrame[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<ApiFrame | null>(null);
  const [selectedFrameWithData, setSelectedFrameWithData] = useState<FrameWithData | null>(null);
  const [imagePreloaded, setImagePreloaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingImage, setLoadingImage] = useState(false);
  const [userRating, setUserRating] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedStaff } = useStaff();

  // デバッグログを追加
  useEffect(() => {
    console.log('TryOnPage - 選択されたスタッフ情報:', selectedStaff);
  }, [selectedStaff]);

  // デフォルトのスタッフを設定（選択されていない場合）
  const defaultStaff = selectedStaff || staffMembers[0];

  // URLクエリパラメータを解析
  useEffect(() => {
    console.log('TryOnPage マウント - URLパラメータとlocationを確認');
    
    // URLからクエリパラメータを取得
    const params = new URLSearchParams(window.location.search);
    const frameIdParam = params.get('frameId');
    const nameParam = params.get('name');
    const brandParam = params.get('brand');
    const imageParam = params.get('image');
    
    console.log('URLクエリパラメータ:', { frameIdParam, nameParam, brandParam, imageParam });
    
    // デフォルト画像パス（常に存在する画像）
    const defaultImagePath = '/images/frames-notempel/ZJ191007_14F1_3.png';
    
    // パラメータが存在する場合は使用
    if (frameIdParam) {
      console.log('URLパラメータが検出されました。パラメータありモードで初期化します。');
      setSelectedGlasses(frameIdParam);
      
      // 安全な画像パスとして常にデフォルト画像を使用
      setFrameImage(defaultImagePath);
      
      // ブランドと名前のデコード
      const decodedName = nameParam ? decodeURIComponent(nameParam) : 'フレーム';
      const decodedBrand = brandParam ? decodeURIComponent(brandParam) : 'ブランド';
      
      // フレーム情報をセット
      const frameInfo: ApiFrame = {
        id: Number(frameIdParam),
        name: decodedName,
        brand: decodedBrand,
        image_url: defaultImagePath
      };
      
      setSelectedFrame(frameInfo);
      
      // RealtimeTryOnコンポーネントに渡すためのデータを作成
      const frameWithData: FrameWithData = {
        frame: {
          id: Number(frameIdParam),
          name: decodedName,
          brand: decodedBrand,
          style: 'クラシック',
          shape: 'ラウンド',
          material: 'チタン',
          price: 15000,
          frame_width: 135,
          lens_height: 45,
          image_urls: [defaultImagePath],
        },
        fit_score: 90,
        style_score: 85
      };
      
      setSelectedFrameWithData(frameWithData);
      
      // 読み込み完了
      setLoading(false);
    } else {
      console.log('URLパラメータがないため、デフォルト設定を使用します（パラメータなしモード）');
      
      // デフォルト値を設定
      setFrameImage(defaultImagePath);
      setSelectedGlasses('1');
      
      // デフォルトのフレーム情報を設定
      const defaultFrame: ApiFrame = {
        id: 1,
        name: 'デモフレーム',
        brand: 'EyeSmile',
        image_url: defaultImagePath
      };
      
      setSelectedFrame(defaultFrame);
      
      // デフォルトのフレームデータを設定
      const defaultFrameWithData: FrameWithData = {
        frame: {
          id: 1,
          name: 'デモフレーム',
          brand: 'EyeSmile',
          style: 'クラシック',
          shape: 'ラウンド',
          material: 'チタン',
          price: 15000,
          frame_width: 135,
          lens_height: 45,
          image_urls: [defaultImagePath],
        },
        fit_score: 90,
        style_score: 85
      };
      
      setSelectedFrameWithData(defaultFrameWithData);
      
      // 読み込み完了
      setLoading(false);
    }
  }, [location]);
  
  // 戻るボタンのハンドラ
  const handleGoBack = () => {
    // 推薦ページに戻る
    console.log('推薦ページに戻ります');
    window.location.href = '/recommendations';
  };

  // ユーザー評価ハンドラ
  const handleRating = (rating: string) => {
    setUserRating(rating);
    console.log(`ユーザーが評価しました: ${rating}`);
    // ここにAPIへの評価送信ロジックを追加することも可能
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden', 
      bgcolor: '#f5f5f5',
      position: 'relative',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 戻るボタン */}
      <IconButton 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
        }}
        onClick={handleGoBack}
      >
        <ArrowBackIcon />
      </IconButton>
      
      {/* メインコンテンツ - カメラ部分 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
      {error ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column',
          padding: 3
        }}>
          <Typography variant="h6" color="error" gutterBottom>
            エラーが発生しました
          </Typography>
          <Typography variant="body1" align="center" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </Box>
      ) : (
        <Box sx={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <RealtimeTryOn
            selectedGlasses={selectedGlasses}
            frameImage={frameImage}
            loading={loading}
            onError={() => setError('カメラの初期化に失敗しました')}
          />
        </Box>
      )}
      </Box>
      
      {/* 評価ボタンエリア */}
      <Box sx={{ 
        width: '100%', 
        padding: '10px', 
        backgroundColor: '#f0f9ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography sx={{ marginBottom: '8px', fontSize: '15px', fontWeight: 500 }}>
            このフレームはいかがですか？
          </Typography>
          <ButtonGroup variant="contained" size="medium" sx={{ '& .MuiButton-root': { margin: '0 8px', borderRadius: '20px' } }}>
            <Button 
              color="success"
              startIcon={<ThumbUpIcon />} 
              onClick={() => handleRating('いいね！')}
              sx={{ 
                backgroundColor: userRating === 'いいね！' ? '#2e7d32' : '#287edf',
                fontWeight: 'bold',
              }}
            >
              いいね！
            </Button>
            <Button 
              color="primary"
              startIcon={<ThumbsUpDownIcon />} 
              onClick={() => handleRating('まあまあ')}
              sx={{ 
                backgroundColor: userRating === 'まあまあ' ? '#1976d2' : '#287edf',
                fontWeight: 'bold',
              }}
            >
              まあまあ
            </Button>
            <Button 
              color="error"
              startIcon={<ThumbDownIcon />} 
              onClick={() => handleRating('いまいち')}
              sx={{ 
                backgroundColor: userRating === 'いまいち' ? '#d32f2f' : '#287edf',
                fontWeight: 'bold',
              }}
            >
              いまいち
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
      
      {/* AIアバターと吹き出しコメント */}
      {userRating && (
        <Box sx={{
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#f9f2e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            width: '100%',
            maxWidth: '600px',
            gap: 2
          }}>
            {/* スタッフアバター */}
            <Box 
              sx={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                overflow: 'hidden',
                border: '2px solid white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}
              onClick={() => {
                console.log("現在のスタッフ: ", selectedStaff);
                console.log("スタッフID: ", selectedStaff?.id);
              }}
            >
              <img 
                src={selectedStaff ? selectedStaff.image : staffMembers[0].image} 
                alt={selectedStaff ? selectedStaff.name : staffMembers[0].name} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }} 
              />
            </Box>
            
            {/* 吹き出しコメント */}
            <Box sx={{ 
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '10px 15px',
              position: 'relative',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              flex: 1,
              '&:before': {
                content: '""',
                position: 'absolute',
                left: '-10px',
                bottom: '15px',
                width: '20px',
                height: '20px',
                backgroundColor: 'white',
                transform: 'rotate(45deg)',
                borderRadius: '2px',
                boxShadow: '-2px 2px 2px rgba(0,0,0,0.05)',
                zIndex: 0
              }
            }}>
              <Typography sx={{ position: 'relative', zIndex: 1 }}>
                {userRating === 'いいね！' && (
                  selectedStaff && selectedStaff.id === 1 ? 'お似合いです！知的で洗練された雰囲気が出ていますね！' :
                  selectedStaff && selectedStaff.id === 2 ? 'とても素晴らしい選択です。フレームの角度が絶妙ですね。' :
                  selectedStaff && selectedStaff.id === 3 ? 'トレンド感があってお洒落ですね！とても似合っています！' :
                  selectedStaff && selectedStaff.id === 4 ? 'Perfect choice! このフレームはあなたの表情を引き立てています！' :
                  'お似合いです！素敵な雰囲気になりますね！'
                )}
                {userRating === 'まあまあ' && (
                  selectedStaff && selectedStaff.id === 1 ? '今かけているアイウェアは、ややなりたいイメージ（おしゃれ）というよりは、ちょっとビジネス寄りに見えるかもしれないですね！' :
                  selectedStaff && selectedStaff.id === 2 ? 'フレームの形は良いですが、もう少し調整が必要かもしれませんね。他のスタイルも試してみましょう。' :
                  selectedStaff && selectedStaff.id === 3 ? 'もう少しカラーバリエーションを試してみると、より魅力的になるかも！' :
                  selectedStaff && selectedStaff.id === 4 ? 'Not bad! ただ他のデザインも試してみる価値はありますよ！' :
                  'もう少し調整すると、より良くなりそうですね！'
                )}
                {userRating === 'いまいち' && (
                  selectedStaff && selectedStaff.id === 1 ? 'ご意見ありがとうございます。別のスタイルやカラーをご提案しますので、ぜひ他のフレームもお試しください。' :
                  selectedStaff && selectedStaff.id === 2 ? '承知しました。お客様の顔立ちに合わせた別のフレームをご用意します。' :
                  selectedStaff && selectedStaff.id === 3 ? 'もっとお似合いするフレームがあるはず！他にも素敵なデザインがありますよ！' :
                  selectedStaff && selectedStaff.id === 4 ? 'I see! 他のフレームで印象が変わるか試してみましょう！' :
                  '他のフレームも試してみましょう！'
                )}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TryOnPage; 