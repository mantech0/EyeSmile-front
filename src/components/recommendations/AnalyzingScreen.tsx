import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, CircularProgress } from '@mui/material';

interface AnalyzingScreenProps {
  isDemo?: boolean;
  autoCompleteTime?: number; // ミリ秒
  onAutoComplete?: () => void; // 自動完了時のコールバック
}

const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({ 
  isDemo = false,
  autoCompleteTime,
  onAutoComplete
}) => {
  const [dots, setDots] = useState("......");
  const [timer, setTimer] = useState(0);
  
  // 自動完了処理
  const handleAutoComplete = useCallback(() => {
    if (onAutoComplete) {
      console.log('解析処理タイムアウト - 自動的に次へ進みます');
      onAutoComplete();
    }
  }, [onAutoComplete]);
  
  useEffect(() => {
    // デモモードの場合は短時間で終了する
    const intervalTime = isDemo ? 250 : 500;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 6 ? "." : prev + ".");
      setTimer(prev => prev + 1);
    }, intervalTime);
    
    // 自動完了のタイマー設定
    let autoCompleteTimeout: NodeJS.Timeout | null = null;
    if (onAutoComplete) {
      // デモモードでは短く、通常モードでは長めの時間を設定
      const timeout = autoCompleteTime || (isDemo ? 3000 : 15000);
      console.log(`${timeout}ms後に自動的に次へ進みます (デモモード: ${isDemo})`);
      
      autoCompleteTimeout = setTimeout(handleAutoComplete, timeout);
    }
    
    return () => {
      clearInterval(interval);
      if (autoCompleteTimeout) {
        clearTimeout(autoCompleteTimeout);
      }
    };
  }, [isDemo, autoCompleteTime, handleAutoComplete, onAutoComplete]);
  
  return (
    <Container maxWidth="sm" sx={{ my: 4, py: 4, textAlign: 'center', height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* メガネアイコン - シンプルな黒い丸メガネ */}
      <Box sx={{ mb: 4 }}>
        <svg width="120" height="60" viewBox="0 0 120 60">
          <g fill="none" stroke="black" strokeWidth="6">
            <circle cx="40" cy="30" r="20" />
            <circle cx="80" cy="30" r="20" />
            <path d="M0 30 L20 30" />
            <path d="M100 30 L120 30" />
          </g>
        </svg>
      </Box>
      
      {/* 点線の枠線内に「解析中......」のテキスト */}
      <Box 
        sx={{ 
          p: 2, 
          px: 4,
          width: '70%',
          maxWidth: '300px',
          margin: '0 auto'
        }}
      >
        <CircularProgress size={30} sx={{ mb: 2 }} />
        <Typography variant="h6" align="center">
          解析中{dots}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {timer}秒経過
        </Typography>
        
        {isDemo && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
            デモモード: 実際のAPIは使用せず、サンプルデータを表示します
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default AnalyzingScreen; 