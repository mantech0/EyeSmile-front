import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

interface RealtimeTryOnProps {
  selectedGlasses: string | null;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const RealtimeTryOn: React.FC<RealtimeTryOnProps> = ({ selectedGlasses, onLoad, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // MediaPipeの初期化を待機
        await import('@mediapipe/face_mesh');
        onLoad?.();

        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          if (!canvasRef.current) return;

          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
              drawConnectors(canvasCtx, landmarks, FaceMesh.FACEMESH_TESSELATION, {
                color: '#C0C0C070',
                lineWidth: 1,
              });
            }
          }

          canvasCtx.restore();
        });

        if (!videoRef.current) {
          throw new Error('ビデオ要素の初期化に失敗しました');
        }

        const newCamera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!videoRef.current) return;
            await faceMesh.send({ image: videoRef.current });
          },
          width: 640,
          height: 480
        });

        setCamera(newCamera);
        await newCamera.start();
      } catch (error) {
        console.error('Error initializing camera or MediaPipe:', error);
        onError?.(error instanceof Error ? error.message : '仮想トライオン機能の初期化に失敗しました');
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (camera) {
        camera.stop();
      }
    };
  }, [onLoad, onError]);

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        エラー: {error}
        <br />
        カメラへのアクセスを許可してください。
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px' }}>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)',
        }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  );
};

export default RealtimeTryOn; 