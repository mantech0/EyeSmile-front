import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QuestionnaireContainer from './components/questionnaire/QuestionnaireContainer';
import FaceCamera from './components/camera/FaceCamera';
import RecommendationsPage from './pages/RecommendationsPage';
import type { FaceMeasurements } from './types/measurements';
import { submitFaceMeasurements } from './services/api';

const HomePage: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementComplete, setMeasurementComplete] = useState(false);

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
          <FaceCamera onCapture={handleCapture} />
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