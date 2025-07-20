import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import QuestionnaireContainer from './components/questionnaire/QuestionnaireContainer';
import FaceCamera from './components/camera/FaceCamera';
import RecommendationsPage from './pages/RecommendationsPage';
import TryOnPage from './pages/TryOnPage';
import LoginPage from './pages/LoginPage';
import QuestionnairePage from './pages/QuestionnairePage';
import StaffPage from './pages/StaffPage';
import { StaffProvider } from './context/StaffContext';
import type { FaceMeasurements } from './types/measurements';
import { submitFaceMeasurements } from './services/api';
import { isInDemoMode, handleApiError } from './config';

// グローバル型定義は types/global.d.ts に移動しました

const HomePage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [demoActive, setDemoActive] = useState(isInDemoMode());
  const navigate = useNavigate();

  // 定期的にデモモードの状態を確認
  useEffect(() => {
    const checkDemoMode = () => {
      const currentDemoMode = isInDemoMode();
      if (currentDemoMode !== demoActive) {
        setDemoActive(currentDemoMode);
      }
    };
    
    // 初回チェック
    checkDemoMode();
    
    // 1秒ごとにデモモード状態を確認
    const interval = setInterval(checkDemoMode, 1000);
    
    return () => clearInterval(interval);
  }, [demoActive]);

  const handleQuestionnaireComplete = () => {
    // アンケート完了後、カメラページに進む
    navigate('/camera');
  };

  return (
    <div className="App" style={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <h1>EyeSmile</h1>
      {demoActive && (
        <div className="demo-mode-badge">
          デモモード有効
        </div>
      )}
      <QuestionnaireContainer onComplete={handleQuestionnaireComplete} />
    </div>
  );
};

// カメラページコンポーネント
const CameraPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [demoActive, setDemoActive] = useState(isInDemoMode());

  useEffect(() => {
    // MediaPipeのCDNファイルが正しくロードされているか確認
    const checkMediaPipeLoaded = async () => {
      try {
        // グローバルオブジェクトでMediaPipeの利用可能性をチェック
        console.log('MediaPipe依存関係をチェックしています...');
        console.log('MediaPipe Globals:');
        console.log('FaceMesh available:', window.FaceMesh ? 'Yes' : 'No');
        console.log('Camera available:', window.Camera ? 'Yes' : 'No');
        console.log('drawConnectors available:', window.drawConnectors ? 'Yes' : 'No');
        
        // いずれかが利用できない場合はエラーを表示
        if (!window.FaceMesh || !window.Camera || !window.drawConnectors) {
          throw new Error('MediaPipeライブラリが正しく読み込まれていません');
        }
      } catch (err) {
        console.error('MediaPipe依存関係の確認中にエラーが発生しました:', err);
        setCameraError('カメラ機能の初期化に問題が発生しました。ブラウザを更新してみてください。');
      }
    };

    checkMediaPipeLoaded();
  }, []);

  // 定期的にデモモードの状態を確認
  useEffect(() => {
    const checkDemoMode = () => {
      const currentDemoMode = isInDemoMode();
      if (currentDemoMode !== demoActive) {
        setDemoActive(currentDemoMode);
      }
    };
    
    // 初回チェック
    checkDemoMode();
    
    // 1秒ごとにデモモード状態を確認
    const interval = setInterval(checkDemoMode, 1000);
    
    return () => clearInterval(interval);
  }, [demoActive]);

  const handleCapture = async (measurements: FaceMeasurements, image: string) => {
    setCapturedImage(image);
    setError(null);
    setIsSubmitting(true);

    try {
      // API通信を再開
      console.log('顔測定データを送信します', measurements);
      await submitFaceMeasurements(measurements);
      // 測定完了フラグを設定
      setMeasurementComplete(true);
    } catch (err) {
      // エラー処理
      if (err instanceof Error) {
        // API接続エラーの場合、デモモードに切り替える
        console.error('エラー発生:', err.message);
        handleApiError(err);
        
        // すでにデモモードになっているか確認
        if (isInDemoMode()) {
          console.log('デモモードでエラーをバイパスし、測定完了とします');
          setMeasurementComplete(true);
          return;
        }
        setError(err.message);
      } else {
        setError('顔の測定データの送信中にエラーが発生しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 測定完了後、推薦ページにリダイレクト
  if (measurementComplete) {
    return <Navigate to="/recommendations" />;
  }

  return (
    <div className="App" style={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <h1>EyeSmile</h1>
      {demoActive && (
        <div className="demo-mode-badge">
          デモモード有効
        </div>
      )}
      <div className="camera-section">
        {cameraError ? (
          <div className="error-message">
            <h3>カメラエラー</h3>
            <p>{cameraError}</p>
            <button onClick={() => window.location.reload()}>ページを更新</button>
          </div>
        ) : (
          <FaceCamera onCapture={handleCapture} />
        )}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {isSubmitting && (
          <div className="loading-message">
            データを送信中...
          </div>
        )}
        {capturedImage && (
          <div className="captured-data">
            <h3>撮影データ</h3>
            <img src={capturedImage} alt="撮影画像" style={{ maxWidth: '300px' }} />
          </div>
        )}
      </div>
    </div>
  );
};

function App(): React.ReactElement {
  return (
    <StaffProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route path="/qa" element={<HomePage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/try-on" element={<TryOnPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </StaffProvider>
  );
}

export default App; 