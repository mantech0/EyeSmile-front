import React, { useRef, useEffect, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';
import './FaceCamera.css';

interface FaceMeasurements {
  faceWidth: number;    // mm単位
  eyeDistance: number;  // mm単位
  cheekArea: number;    // mm²単位
  noseHeight: number;   // mm単位
  templePosition: number; // mm単位
}

// 画面上の距離をミリメートルに変換する定数（キャリブレーション用）
const PIXEL_TO_MM = 0.2645833333;

// より現実的な測定値のための調整係数
const CALIBRATION_FACTOR = 2100;

// 面積計算用の追加調整係数
const AREA_CALIBRATION_FACTOR = 0.2;

interface FaceCameraProps {
  onCapture?: (measurements: FaceMeasurements, image: string) => void;
}

const FaceCamera: React.FC<FaceCameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [measurements, setMeasurements] = useState<FaceMeasurements | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedMeasurements, setCapturedMeasurements] = useState<FaceMeasurements | null>(null);

  // 2点間の距離を計算
  const calculateDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy) * PIXEL_TO_MM * CALIBRATION_FACTOR;
  };

  // 三角形の面積を計算
  const calculateTriangleArea = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number => {
    const baseArea = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) / 2;
    return baseArea * PIXEL_TO_MM * PIXEL_TO_MM * CALIBRATION_FACTOR * CALIBRATION_FACTOR * AREA_CALIBRATION_FACTOR;
  };

  // 顔幅を計算（頬骨弓間の距離）
  const calculateFaceWidth = (landmarks: Array<{ x: number; y: number; z: number }>): number => {
    // 頬骨弓のランドマークインデックス（左右）
    const leftCheekbone = landmarks[234];  // 左頬骨外側
    const rightCheekbone = landmarks[454]; // 右頬骨外側
    return calculateDistance(leftCheekbone, rightCheekbone);
  };

  // 目の距離を計算（両目の内角間）
  const calculateEyeDistance = (landmarks: Array<{ x: number; y: number; z: number }>): number => {
    // 目の内角のランドマークインデックス（左右）
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];
    return calculateDistance(leftEyeInner, rightEyeInner);
  };

  // 頬の面積を計算
  const calculateCheekArea = (landmarks: Array<{ x: number; y: number; z: number }>): number => {
    // 左頬の面積
    const leftCheekArea = calculateTriangleArea(
      landmarks[123],  // 頬の上部
      landmarks[147],  // 頬の下部
      landmarks[162]   // 頬の外側
    );

    // 右頬の面積
    const rightCheekArea = calculateTriangleArea(
      landmarks[352],  // 頬の上部
      landmarks[377],  // 頬の下部
      landmarks[392]   // 頬の外側
    );

    return leftCheekArea + rightCheekArea;
  };

  // 鼻の高さを計算
  const calculateNoseHeight = (landmarks: Array<{ x: number; y: number; z: number }>): number => {
    // 鼻のランドマークインデックス（上部と下部）
    const noseTop = landmarks[168];
    const noseBottom = landmarks[2];
    return calculateDistance(noseTop, noseBottom);
  };

  // こめかみの位置を計算（目の高さからの相対位置）
  const calculateTemplePosition = (landmarks: Array<{ x: number; y: number; z: number }>): number => {
    // 左目の中心
    const leftEye = landmarks[159];
    // 左こめかみ
    const leftTemple = landmarks[447];
    return calculateDistance(leftEye, leftTemple);
  };

  const handleCapture = () => {
    if (measurements && canvasRef.current) {
      setIsCapturing(true);
      // 現在の測定値を保存
      setCapturedMeasurements(measurements);
      // キャンバスの内容をBase64画像として取得
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      
      if (onCapture && measurements) {
        onCapture(measurements, imageData);
      }

      setTimeout(() => {
        setIsCapturing(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // 顔の測定値を計算
        const measurements: FaceMeasurements = {
          faceWidth: calculateFaceWidth(landmarks),
          eyeDistance: calculateEyeDistance(landmarks),
          cheekArea: calculateCheekArea(landmarks),
          noseHeight: calculateNoseHeight(landmarks),
          templePosition: calculateTemplePosition(landmarks)
        };

        setMeasurements(measurements);
        
        // ランドマークを描画
        drawConnectors(ctx, landmarks, FaceMesh.FACEMESH_TESSELATION, {
          color: '#C0C0C070',
          lineWidth: 1
        });

        // 重要な測定ポイントを強調表示
        const points = [
          landmarks[447], landmarks[227],  // こめかみ
          landmarks[133], landmarks[362],  // 目の内角
          landmarks[168], landmarks[2],    // 鼻の上部と下部
          landmarks[123], landmarks[147], landmarks[162],  // 左頬
          landmarks[352], landmarks[377], landmarks[392]   // 右頬
        ];

        ctx.fillStyle = '#FF0000';
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start();

    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, []);

  return (
    <div className="face-camera-container">
      <div className="camera-view">
        <video
          ref={videoRef}
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="camera-canvas"
        />
        <div className="face-guide">
          <svg width="300" height="400" viewBox="0 0 300 400" className="face-guide-svg">
            <ellipse
              cx="150"
              cy="200"
              rx="100"
              ry="140"
              fill="none"
              stroke="#646cff"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <line
              x1="150"
              y1="60"
              x2="150"
              y2="340"
              stroke="#646cff"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <line
              x1="50"
              y1="200"
              x2="250"
              y2="200"
              stroke="#646cff"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
        <div className={`capture-flash ${isCapturing ? 'active' : ''}`} />
      </div>

      <div className="camera-instructions">
        <p>顔を点線の枠内に合わせてください</p>
        <ul>
          <li>正面を向いて、まっすぐ前を見てください</li>
          <li>眼鏡をかけている場合は、そのままで構いません</li>
          <li>髪の毛が顔にかかっていない状態にしてください</li>
        </ul>
      </div>

      <div className="camera-controls">
        <button 
          className="capture-button"
          onClick={handleCapture}
          disabled={!measurements}
        >
          撮影
        </button>
      </div>

      {capturedMeasurements && (
        <div className="measurements-panel">
          <h3>測定結果</h3>
          <div className="measurement-grid">
            <div className="measurement-item">
              <span>顔幅:</span>
              <span>{capturedMeasurements.faceWidth.toFixed(1)}mm</span>
            </div>
            <div className="measurement-item">
              <span>目の距離:</span>
              <span>{capturedMeasurements.eyeDistance.toFixed(1)}mm</span>
            </div>
            <div className="measurement-item">
              <span>頬の面積:</span>
              <span>{capturedMeasurements.cheekArea.toFixed(1)}mm²</span>
            </div>
            <div className="measurement-item">
              <span>鼻の高さ:</span>
              <span>{capturedMeasurements.noseHeight.toFixed(1)}mm</span>
            </div>
            <div className="measurement-item">
              <span>こめかみの位置:</span>
              <span>{capturedMeasurements.templePosition.toFixed(1)}mm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCamera; 