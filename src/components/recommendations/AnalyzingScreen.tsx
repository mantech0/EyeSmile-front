import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress } from '@mui/material';

interface AnalyzingScreenProps {
  isDemo?: boolean;
}

const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({ isDemo = false }) => {
  const [dots, setDots] = useState("......");
  const [timer, setTimer] = useState(0);
  
  useEffect(() => {
    // デモモードの場合は短時間で終了する
    const intervalTime = isDemo ? 250 : 500;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 6 ? "." : prev + ".");
      setTimer(prev => prev + 1);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [isDemo]);
  
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