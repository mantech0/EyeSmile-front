import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QuestionnaireContainer from './components/questionnaire/QuestionnaireContainer';
import FaceCamera from './components/camera/FaceCamera';
import RecommendationsPage from './pages/RecommendationsPage';
import type { FaceMeasurements } from './types/measurements';
import { submitFaceMeasurements } from './services/api';

// グローバル型定義は types/global.d.ts に移動しました

const HomePage: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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

    if (showCamera) {
      checkMediaPipeLoaded();
    }
  }, [showCamera]);

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
      setError(err instanceof Error ? err.message : '顔の測定データの送信中にエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 測定完了後、推薦ページにリダイレクト
  if (measurementComplete) {
    return <Navigate to="/recommendations" />;
  }

  return (
    <div className="App">
      <h1>EyeSmile</h1>
      {!showCamera ? (
        <>
          <QuestionnaireContainer onComplete={() => setShowCamera(true)} />
        </>
      ) : (
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
      )}
    </div>
  );
};

function App(): React.ReactElement {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 