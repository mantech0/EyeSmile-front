import React, { useRef, useEffect, useState } from 'react';
// MediaPipeをグローバルから取得するため、importを削除
// import { Camera } from '@mediapipe/camera_utils';
// import { FaceMesh } from '@mediapipe/face_mesh';
// import { drawConnectors } from '@mediapipe/drawing_utils';
import './FaceCamera.css';

// グローバル型定義は types/global.d.ts に移動しました

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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  // iOSデバイスかどうかを検出
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOSDevice(isIOS);
    console.log('デバイス検出:', isIOS ? 'iOSデバイス' : '非iOSデバイス');
  }, []);

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
      // キャンバスの内容をBase64画像として取得
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      
      if (onCapture && measurements) {
        onCapture(measurements, imageData);
      }

      setTimeout(() => {
        setIsCapturing(false);
      }, 500);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  // カメラ初期化関数を分離
  const initializeCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // グローバルから取得
      const FaceMesh = window.FaceMesh;
      const Camera = window.Camera;
      const drawConnectors = window.drawConnectors;

      if (!FaceMesh || !Camera || !drawConnectors) {
        throw new Error('MediaPipeライブラリがグローバルに読み込まれていません');
      }

      console.log('FaceMeshを初期化しています...');
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          console.log(`Loading MediaPipe file: ${file}`);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 顔をより大きく表示するために画像を拡大して描画
        const scale = 1.3; // 拡大係数
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 拡大して中央寄りに描画
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

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
          
          // ランドマークを最小限に表示（デバッグ用）
          if (process.env.NODE_ENV === 'development') {
            try {
              // ランドマークも拡大して描画
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.scale(scale, scale);
              ctx.translate(-centerX, -centerY);
              
              drawConnectors(ctx, landmarks, FaceMesh.FACEMESH_TESSELATION, {
                color: '#C0C0C070',
                lineWidth: 0.5
              });
              
              ctx.restore();
            } catch (error) {
              console.error('ランドマーク描画中にエラーが発生しました:', error);
            }
          }
        }
      });

      // iOS向けのカメラ設定調整
      let cameraOptions = {
        onFrame: async () => {
          if (videoRef.current) {
            try {
              await faceMesh.send({ image: videoRef.current });
            } catch (error) {
              console.error('FaceMesh送信中にエラーが発生しました:', error);
            }
          }
        },
        width: 1280, // より高解像度に設定
        height: 720
      };

      // MediaPipe Cameraの初期化とiOS向け調整
      console.log('MediaPipe Cameraを初期化しています...');
      const camera = new Camera(videoRef.current, cameraOptions);

      console.log('カメラを起動しています...');
      
      // カメラが読み込まれたときに設定を調整
      if (videoRef.current) {
        // canvasサイズをvideoに合わせる
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            // ビデオの実際のサイズを取得
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            
            console.log(`ビデオサイズ: ${videoWidth}x${videoHeight}`);
            
            // キャンバスサイズを更新
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            
            // レスポンシブ対応のためのCSSスタイルはそのまま
          }
        };
      }

      // カメラ起動
      try {
        await camera.start();
        console.log('カメラが正常に起動しました');
        setIsCameraReady(true);
      } catch (error) {
        console.error('カメラの起動に失敗しました:', error);
        setCameraError('カメラの起動に失敗しました。アクセス権限を確認してください。');
        if (isIOSDevice) {
          setCameraError('iOSデバイスでカメラを起動できませんでした。Safariの設定でカメラアクセスを許可してください。');
        }
      }

      return () => {
        console.log('カメラを停止しています...');
        camera.stop();
        faceMesh.close();
      };
    } catch (error) {
      console.error('カメラ初期化中にエラーが発生しました:', error);
      setCameraError(`カメラの初期化中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      return () => {};
    }
  };

  // ユーザー操作によるカメラ起動（iOSでの制限対策）
  const startCamera = () => {
    console.log('ユーザー操作でカメラを起動します');
    initializeCamera();
  };

  // コンポーネントマウント時のセットアップ
  useEffect(() => {
    // iOSの場合は自動起動しない
    if (isIOSDevice) {
      console.log('iOSデバイスのため、カメラは手動で起動します');
      return;
    }
    
    // 非iOSの場合は自動起動
    console.log('非iOSデバイスのため、カメラを自動起動します');
    initializeCamera();
    
    // クリーンアップ関数はinitializeCamera内で返しているものを使用
  }, [isIOSDevice]);

  return (
    <div className="face-camera-container">
      {cameraError ? (
        <div className="camera-error">
          <p>{cameraError}</p>
          <button className="retry-button" onClick={startCamera}>
            カメラを再起動
          </button>
        </div>
      ) : (
        <>
          <div className="camera-view">
            <video
              ref={videoRef}
              style={{ display: 'none' }}
              playsInline // iOSの自動全画面表示を防止
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="camera-canvas"
            />
            {!isCameraReady && isIOSDevice && (
              <div className="camera-start-overlay">
                <button 
                  className="start-camera-button"
                  onClick={startCamera}
                >
                  カメラを起動する
                </button>
                <p className="camera-note">※iOSではカメラ起動に許可が必要です</p>
              </div>
            )}
            {!capturedImage && isCameraReady && (
              <div className="face-guide">
                <svg viewBox="0 0 300 400" className="face-guide-svg">
                  {/* 楕円形のガイド - 顔に合わせて拡大 */}
                  <ellipse
                    cx="150"
                    cy="180"
                    rx="130"
                    ry="170"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  {/* 横線のガイド - 目の高さに合わせる */}
                  <line
                    x1="20"
                    y1="180"
                    x2="280"
                    y2="180"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                </svg>
              </div>
            )}
            <div className={`capture-flash ${isCapturing ? 'active' : ''}`} />
          </div>

          <div className="camera-controls">
            {!capturedImage ? (
              <button 
                className="capture-button"
                onClick={handleCapture}
                disabled={!measurements || !isCameraReady}
              >
                撮影してください
              </button>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  className="capture-button"
                  onClick={() => { if (onCapture && measurements) onCapture(measurements, capturedImage); }}
                >
                  次へ
                </button>
                <button 
                  className="alternative-action"
                  onClick={handleRetake}
                >
                  写真を撮り直す
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FaceCamera; 