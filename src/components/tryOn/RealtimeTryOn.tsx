import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh, FACEMESH_TESSELATION, Results } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

interface RealtimeTryOnProps {
  selectedGlasses: string | null;
}

const RealtimeTryOn: React.FC<RealtimeTryOnProps> = ({ selectedGlasses }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Camera | null>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (!canvasRef.current) return;

      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
            color: '#C0C0C070',
            lineWidth: 1,
          });
        }
      }

      canvasCtx.restore();
    });

    const newCamera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (!videoRef.current) return;
        await faceMesh.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    setCamera(newCamera);
    newCamera.start();

    return () => {
      newCamera.stop();
      faceMesh.close();
    };
  }, []);

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