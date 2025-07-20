import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Container, CircularProgress, Button } from '@mui/material';

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
  const [showSkipButton, setShowSkipButton] = useState(false);
  
  // タイマー参照を保持
  const autoCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const forceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 自動完了処理
  const handleAutoComplete = useCallback(() => {
    if (onAutoComplete) {
      console.log('解析処理タイムアウト - 自動的に次へ進みます');
      // すべてのタイマーをクリア
      if (autoCompleteTimeoutRef.current) {
        clearTimeout(autoCompleteTimeoutRef.current);
        autoCompleteTimeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (forceTimeoutRef.current) {
        clearTimeout(forceTimeoutRef.current);
        forceTimeoutRef.current = null;
      }
      onAutoComplete();
    }
  }, [onAutoComplete]);
  
  // 手動で次へ進む処理
  const handleSkip = useCallback(() => {
    console.log('ユーザーがスキップボタンをクリックしました');
    // タイマーをクリア
    if (autoCompleteTimeoutRef.current) {
      clearTimeout(autoCompleteTimeoutRef.current);
      autoCompleteTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (forceTimeoutRef.current) {
      clearTimeout(forceTimeoutRef.current);
      forceTimeoutRef.current = null;
    }
    
    handleAutoComplete();
  }, [handleAutoComplete]);
  
  // 絶対に実行されるべき強制タイマー
  useEffect(() => {
    // 長めのデッドライン - このタイマーは絶対に発火する
    const finalDeadline = 8000; // 8秒後には必ず次へ進む
    
    console.log(`${finalDeadline}ms後に強制的に次へ進みます`);
    forceTimeoutRef.current = setTimeout(() => {
      console.log('最終デッドラインに達しました。強制的に次へ進みます。');
      handleAutoComplete();
    }, finalDeadline);
    
    // スキップボタンを表示（すぐに表示）
    const skipButtonTimeout = setTimeout(() => {
      setShowSkipButton(true);
    }, 800);
    
    return () => {
      if (forceTimeoutRef.current) {
        clearTimeout(forceTimeoutRef.current);
        forceTimeoutRef.current = null;
      }
      clearTimeout(skipButtonTimeout);
    };
  }, [handleAutoComplete]);
  
  useEffect(() => {
    // デモモードの場合は短時間で終了する
    const intervalTime = isDemo ? 250 : 500;
    
    // 前のインターバルをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    intervalRef.current = setInterval(() => {
      setDots(prev => prev.length >= 6 ? "." : prev + ".");
      setTimer(prev => prev + 1);
    }, intervalTime);
    
    // 自動完了のタイマー設定
    if (onAutoComplete) {
      // 前のタイマーをクリア
      if (autoCompleteTimeoutRef.current) {
        clearTimeout(autoCompleteTimeoutRef.current);
        autoCompleteTimeoutRef.current = null;
      }
      
      // デモモードでは短く、通常モードでは長めの時間を設定
      const timeout = autoCompleteTime || (isDemo ? 2000 : 4000);
      console.log(`${timeout}ms後に自動的に次へ進みます (デモモード: ${isDemo})`);
      
      autoCompleteTimeoutRef.current = setTimeout(handleAutoComplete, timeout);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (autoCompleteTimeoutRef.current) {
        clearTimeout(autoCompleteTimeoutRef.current);
        autoCompleteTimeoutRef.current = null;
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
        
        {showSkipButton && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSkip}
            sx={{ mt: 2 }}
          >
            スキップ
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default AnalyzingScreen; 