import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Slider, Button } from '@mui/material';

// グローバル変数の型定義
declare global {
  interface Window {
    _debug: {
      glassesImage: HTMLImageElement | null;
      videoElement: HTMLVideoElement | null;
      canvasElement: HTMLCanvasElement | null;
      imageLoaded: boolean;
      frameImage: string;
    };
    FaceMesh: any;
    Camera: any;
  }
}

// グローバルデバッグオブジェクトを初期化
if (typeof window !== 'undefined') {
  window._debug = window._debug || {
    glassesImage: null,
    videoElement: null,
    canvasElement: null,
    imageLoaded: false,
    frameImage: ''
  };
}

interface RealtimeTryOnProps {
  selectedGlasses: string | null;
  frameImage: string;
  loading: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const RealtimeTryOn: React.FC<RealtimeTryOnProps> = ({
  selectedGlasses,
  frameImage,
  loading,
  onLoad,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  // フレーム調整用の状態
  const [frameSize, setFrameSize] = useState(0.95);
  const [frameOffsetY, setFrameOffsetY] = useState(0.45);
  const [frameOffsetX, setFrameOffsetX] = useState(0.0);
  
  // 顔検出用の変数
  const lastFacePositionRef = useRef({
    x: 0, 
    y: 0, 
    eyeDistance: 0, 
    lastDetection: 0
  });

  // iOS/Safariを検出する関数
  const isIOSDevice = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  };
  
  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  };

  // フレーム画像のロード
  useEffect(() => {
    if (!frameImage) {
      console.error('フレーム画像のパスが指定されていません');
      setImageError('フレーム画像が指定されていません');
      return;
    }
    
    console.log('フレーム画像の読み込み開始:', frameImage);
    
    // デフォルト画像パス
    const defaultImagePath = '/images/frames-notempel/ZJ191007_14F1_3.png';
    
    // 画像のパスをチェック
    let imgPath = frameImage;
    if (!imgPath.startsWith('/images/')) {
      console.warn('画像パスが /images/ で始まっていません。デフォルト画像を使用します:', imgPath);
      imgPath = defaultImagePath;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // 画像読み込みタイムアウト
    const imgTimeout = setTimeout(() => {
      console.error('フレーム画像の読み込みがタイムアウトしました:', imgPath);
      img.src = '';
      
      // フォールバック画像を試す
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.onload = () => {
        console.log('フォールバック画像の読み込み成功');
        glassesImageRef.current = fallbackImg;
        setImageLoaded(true);
        setImageError(null);
      };
      fallbackImg.onerror = () => {
        setImageError('画像の読み込みに失敗しました');
        setImageLoaded(false);
      };
      fallbackImg.src = defaultImagePath;
    }, 5000); // 5秒でタイムアウト
    
    img.onload = () => {
      clearTimeout(imgTimeout);
      console.log('フレーム画像の読み込み完了:', img.width, 'x', img.height);
      
      try {
        // 透明化処理
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        
        const tempCtx = tempCanvas.getContext('2d', { alpha: true });
        if (!tempCtx) {
          throw new Error('キャンバスコンテキストの取得に失敗しました');
        }
        
        tempCtx.drawImage(img, 0, 0);
        
        try {
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
          } else if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 128;
          }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        
        const processedImg = new Image();
        processedImg.crossOrigin = 'anonymous';
        processedImg.onload = () => {
          glassesImageRef.current = processedImg;
          setImageLoaded(true);
          setImageError(null);
          
          if (typeof window !== 'undefined') {
            window._debug.glassesImage = processedImg;
            window._debug.imageLoaded = true;
            window._debug.frameImage = frameImage;
          }
        };
          
          processedImg.onerror = () => {
            console.error('処理済み画像の読み込みに失敗 - 元の画像を使用します');
            // 処理済み画像の読み込みに失敗した場合、元の画像を使用
            glassesImageRef.current = img;
            setImageLoaded(true);
            setImageError(null);
          };
        
        processedImg.src = tempCanvas.toDataURL('image/png');
        } catch (pixelError) {
          console.error('ピクセル処理エラー - 元の画像を使用します:', pixelError);
          // ピクセル操作でエラーが発生した場合、元の画像を使用
          glassesImageRef.current = img;
          setImageLoaded(true);
          setImageError(null);
        }
      } catch (error) {
        console.error('画像透明化処理エラー:', error);
        glassesImageRef.current = img;
        setImageLoaded(true);
        setImageError(null);
      }
    };
    
    img.onerror = () => {
      clearTimeout(imgTimeout);
      console.error('フレーム画像の読み込みに失敗しました:', imgPath);
      
      // フォールバック画像を試す
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      
      fallbackImg.onload = () => {
        console.log('フォールバック画像の読み込み成功');
        glassesImageRef.current = fallbackImg;
        setImageLoaded(true);
        setImageError(null);
      };
      
      fallbackImg.onerror = () => {
      const errorMessage = 'フレーム画像の読み込みに失敗しました';
      setImageError(errorMessage);
      setImageLoaded(false);
      glassesImageRef.current = null;
      
      if (onError) {
        onError(errorMessage);
      }
    };
    
      fallbackImg.src = defaultImagePath;
    };
    
    img.src = imgPath;
    
    return () => {
      clearTimeout(imgTimeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [frameImage, onError]);

  // MediaPipeスクリプトのロード
  useEffect(() => {
    // すでにロードされている場合はスキップ
    if (window.FaceMesh && window.Camera) {
      console.log('MediaPipeはすでにロードされています');
      return;
    }
    
    console.log('MediaPipe スクリプトを読み込み中...');
    
    // スクリプトをロードする関数
    const loadScriptWithTimeout = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        // タイムアウト設定
        const timeout = setTimeout(() => {
          console.error(`スクリプトの読み込みがタイムアウト: ${src}`);
          reject(new Error('スクリプト読み込みタイムアウト'));
        }, 10000); // 10秒でタイムアウト
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log(`スクリプトのロードに成功: ${src}`);
          resolve();
        };
        
        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`スクリプトのロードに失敗: ${src}`, error);
          reject(error);
        };
        
        document.head.appendChild(script);
      });
    };
    
    // MediaPipeスクリプトを順番にロード
    const loadScripts = async () => {
      try {
        // FaceMeshのスクリプトを読み込む
        await loadScriptWithTimeout('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
        
        // カメラのスクリプトを読み込む
        await loadScriptWithTimeout('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1632432234/camera_utils.js');
        
        console.log('すべてのMediaPipeスクリプトのロードが完了しました');
      } catch (error) {
        console.error('MediaPipe スクリプトのロード中にエラーが発生しました:', error);
        setCameraError('カメラシステムの初期化に失敗しました');
        if (onError) {
          onError('カメラシステムの初期化に失敗しました');
        }
      }
    };
    
    loadScripts();
  }, [onError]);

  // カメラの初期化関数
  const initCamera = async () => {
    if (!videoRef.current) {
      console.error('videoRef.currentがnullです');
      setCameraError('カメラの初期化に失敗しました');
      if (onError) onError('カメラの初期化に失敗しました');
      return;
    }
    
    setIsCameraLoading(true);
    
    try {
      console.log('カメラの初期化を開始...');
      
      // MediaDevicesインターフェースが利用可能か確認
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('このブラウザはカメラ機能をサポートしていません');
      }
      
      // iOSおよびSafariかどうかを確認
      const isIOS = isIOSDevice();
      const isSafariBrowser = isSafari();
      
      console.log(`デバイス検出: iOS=${isIOS}, Safari=${isSafariBrowser}`);
      
      // カメラの制約を設定（解像度を修正）
      let constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
      };
      
      // iOSデバイスの場合は設定を調整
      if (isIOS) {
        console.log('iOSデバイスを検出しました。特別な設定を適用します');
        // iOSに最適化された設定を使用
        constraints = {
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'user'
          },
          audio: false
        };
      }
      
      // コンソールに制約を表示
      console.log('カメラストリームを要求、使用する制約:', JSON.stringify(constraints));
      
      // カメラストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 取得したストリームの詳細をログに記録
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const settings = videoTracks[0].getSettings();
        console.log('カメラストリーム設定:', settings);
      }
      
      // videoエレメントにストリームを設定
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // iOSのSafariではonloadedmetadataが発火しない場合がある対策
        if (isIOS && isSafariBrowser) {
          console.log('iOS Safariの場合は手動で再生を開始します');
          
          // 少し遅延を入れて再生開始
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('iOS Safariでのカメラストリーム再生開始');
                  handleVideoPlay();
                })
                .catch(error => {
                  console.error('iOS Safariでのカメラストリーム再生失敗:', error);
                  setCameraError('カメラの開始に失敗しました');
                  setIsCameraLoading(false);
                  if (onError) onError('カメラの開始に失敗しました');
                });
            }
          }, 500);
        }
        
        // メタデータ読み込み時の処理（非iOSブラウザ向け）
        videoRef.current.onloadedmetadata = () => {
          console.log('カメラストリームのメタデータが読み込まれました');
          
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('カメラストリームの再生を開始しました');
                handleVideoPlay();
              })
              .catch(error => {
                console.error('カメラストリームの再生に失敗しました:', error);
                setCameraError('カメラの開始に失敗しました');
                setIsCameraLoading(false);
                if (onError) onError('カメラの開始に失敗しました');
              });
          }
        };
      }
      
      // エラーハンドリング
      if (videoRef.current) {
        videoRef.current.onerror = (event) => {
          console.error('ビデオエレメントでエラーが発生しました:', event);
          setCameraError('カメラの初期化中にエラーが発生しました');
          setIsCameraLoading(false);
          if (onError) onError('カメラの初期化中にエラーが発生しました');
        };
      }
      
    } catch (error) {
      console.error('カメラの初期化中にエラーが発生しました:', error);
      
      let errorMessage = 'カメラの初期化に失敗しました';
      
      // エラーメッセージの詳細化
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラへのアクセスを許可してください。';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'カメラデバイスが見つかりませんでした。';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'カメラが他のアプリケーションで使用中か、アクセスできません。';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = '指定したカメラの設定に対応していません。';
        } else if (error.name === 'TypeError' && isIOSDevice()) {
          errorMessage = 'iOSデバイスでカメラへのアクセスに失敗しました。Safari設定でカメラへのアクセスを許可してください。';
        }
      }
      
      setCameraError(errorMessage);
      setIsCameraLoading(false);
      if (onError) onError(errorMessage);
      
      // フォールバック描画を試みる
      startFallbackDrawing();
    }
  };

  // ビデオ再生開始時の共通処理
  const handleVideoPlay = () => {
    setIsCameraLoading(false);
    setCameraReady(true);
    
    // キャンバスのサイズを設定
    if (canvasRef.current && videoRef.current) {
      // videoの実際のサイズを取得
      const videoWidth = videoRef.current.videoWidth || 1280;
      const videoHeight = videoRef.current.videoHeight || 720;
      
      console.log(`ビデオサイズ: ${videoWidth}x${videoHeight}`);
      
      // キャンバスサイズを設定
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      console.log(`キャンバスサイズを設定: ${canvasRef.current.width}x${canvasRef.current.height}`);
      
      // デバッグ用のグローバル変数を設定
      if (typeof window !== 'undefined') {
        window._debug.videoElement = videoRef.current;
        window._debug.canvasElement = canvasRef.current;
      }
    } else {
      console.error('canvasRef.currentまたはvideoRef.currentがnullです');
    }
    
    // カメラストリームの準備ができたらFaceMeshを初期化
    if (window.FaceMesh && canvasRef.current) {
      console.log('MediaPipeが読み込まれたため、FaceMeshを初期化します');
      // FaceMeshを初期化
      setupFaceMeshDetection();
    } else {
      console.log('MediaPipeがまだ読み込まれていないため、FaceMeshの初期化を待機します');
    }
  };

  // メガネフレームを描画する関数
  const drawGlassesFrame = (ctx: CanvasRenderingContext2D, landmarks: any, frameImg: any) => {
    try {
      if (!glassesImageRef.current || !landmarks) {
        return;
      }
            
            // 目のランドマークインデックス
            // 左目の外側
            const leftEyeOuter = landmarks[263];
            // 左目の内側 
            const leftEyeInner = landmarks[362];
            // 右目の内側
            const rightEyeInner = landmarks[133];
            // 右目の外側
            const rightEyeOuter = landmarks[33];
            
            // 顔の幅のランドマーク（左右の頬）
            const leftCheek = landmarks[234];  // 左頬
            const rightCheek = landmarks[454]; // 右頬
      
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
            
            // 左右の目の位置を計算（ビデオが反転している場合の調整）
            // MediaPipeの座標系（0〜1）からキャンバスの座標系に変換
      const leftEyeX = leftEyeOuter.x * canvasWidth;
      const leftEyeY = leftEyeOuter.y * canvasHeight;
      const rightEyeX = rightEyeOuter.x * canvasWidth;
      const rightEyeY = rightEyeOuter.y * canvasHeight;
            
            // 顔の幅を計算
      const leftCheekX = leftCheek.x * canvasWidth;
      const rightCheekX = rightCheek.x * canvasWidth;
            const faceWidth = Math.abs(rightCheekX - leftCheekX);
            
            // 目の間の距離を計算
            const eyeDistance = Math.sqrt(
              Math.pow(rightEyeX - leftEyeX, 2) + 
              Math.pow(rightEyeY - leftEyeY, 2)
            );
            
            // 目の中心を計算
            const eyesCenterX = (leftEyeX + rightEyeX) / 2;
            const eyesCenterY = (leftEyeY + rightEyeY) / 2;
            
            // 顔の中心を計算
            const faceCenterX = (leftCheekX + rightCheekX) / 2;
            
            // 顔の位置情報を更新
            lastFacePositionRef.current = {
              x: faceCenterX,
              y: eyesCenterY,
              eyeDistance: eyeDistance,
              lastDetection: Date.now()
            };
            
            // フレームのサイズを計算（顔の幅に基づいて調整）
            const frameWidth = faceWidth * 1.1 * frameSize; 
            const aspectRatio = glassesImageRef.current.height / glassesImageRef.current.width;
            const frameHeight = frameWidth * aspectRatio;
            
            // 位置調整（顔の中心を基準に）
            const frameY = eyesCenterY - (frameHeight * frameOffsetY);
            const frameX = faceCenterX - (frameWidth / 2) + (frameOffsetX * frameWidth * 0.1);
            
            // フレームを描画
            ctx.drawImage(
              glassesImageRef.current,
              frameX,
              frameY,
              frameWidth,
              frameHeight
            );
            
            // ランドマークを軽く描画（顔の検出状況を視覚化）
            if (process.env.NODE_ENV === 'development') {
              ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
              ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
              ctx.lineWidth = 1;
              
              // 目の周りのランドマークをハイライト
              [leftEyeOuter, leftEyeInner, rightEyeInner, rightEyeOuter].forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x * canvasWidth, point.y * canvasHeight, 2, 0, 2 * Math.PI);
                ctx.fill();
              });
              
              // 目を結ぶ線
              ctx.beginPath();
              ctx.moveTo(leftEyeOuter.x * canvasWidth, leftEyeOuter.y * canvasHeight);
              ctx.lineTo(rightEyeOuter.x * canvasWidth, rightEyeOuter.y * canvasHeight);
              ctx.stroke();
            }
    } catch (error) {
      console.error('フレーム描画エラー:', error);
    }
  };

  // スライダーのハンドラ
  const handleSizeChange = (event: Event, newValue: number | number[]) => {
    setFrameSize(newValue as number);
  };

  const handleOffsetYChange = (event: Event, newValue: number | number[]) => {
    setFrameOffsetY(newValue as number);
  };

  const handleOffsetXChange = (event: Event, newValue: number | number[]) => {
    setFrameOffsetX(newValue as number);
  };

  // リセットボタンをクリックした時の処理
  const handleReset = () => {
    // ディスプレイの大きさに応じてデフォルト値を調整
    let defaultSize = 0.90;
    if (canvasRef.current) {
      const width = canvasRef.current.width;
      if (width < 600) {
        // モバイル向け
        defaultSize = 0.95;
      } else if (width > 1200) {
        // 大画面向け
        defaultSize = 0.85;
      }
    }
    
    setFrameSize(defaultSize);
    setFrameOffsetY(0.45);
    setFrameOffsetX(0.0);
  };

  // フォールバックの描画機能 - カメラが利用できない場合
  const startFallbackDrawing = () => {
    if (!canvasRef.current || !glassesImageRef.current) {
      console.error('フォールバック描画に必要なオブジェクトが見つかりません');
      return;
    }
    
    console.log('フォールバック描画モードを開始します');
    
    try {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;
      
      // キャンバスを適切なサイズに設定
      canvasRef.current.width = 1280;
      canvasRef.current.height = 720;
      
      // キャンバスをクリア
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // 背景色の設定
      canvasCtx.fillStyle = '#f0f0f0';
      canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // テキストの表示
      canvasCtx.fillStyle = '#333';
      canvasCtx.font = '24px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(
        'カメラを利用できないため、フレームのみを表示しています',
        canvasRef.current.width / 2,
        100
      );
      
      // フレーム画像を中央に表示
      const frameImg = glassesImageRef.current;
      const imgWidth = frameImg.width;
      const imgHeight = frameImg.height;
      const scale = Math.min(
        (canvasRef.current.width * 0.8) / imgWidth,
        (canvasRef.current.height * 0.6) / imgHeight
      );
      
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const x = (canvasRef.current.width - scaledWidth) / 2;
      const y = (canvasRef.current.height - scaledHeight) / 2 + 50; // テキスト分下に
      
      canvasCtx.drawImage(
        frameImg,
        x, y,
        scaledWidth, scaledHeight
      );
      
      // ユーザーへの指示を表示
      canvasCtx.fillStyle = '#333';
      canvasCtx.font = '18px Arial';
      canvasCtx.fillText(
        'カメラへのアクセスを許可して再読み込みするか、別のブラウザをお試しください',
        canvasRef.current.width / 2,
        canvasRef.current.height - 50
      );
      
      // フォールバックモードの設定
      setIsFallbackMode(true);
    } catch (error) {
      console.error('フォールバック描画中にエラーが発生しました:', error);
    }
  };

  // FaceMeshの検出を設定する関数 (グローバルアクセス可能)
  const setupFaceMeshDetection = () => {
    if (!window.FaceMesh || !videoRef.current || !canvasRef.current) {
      console.error('FaceMeshの初期化に必要なオブジェクトが見つかりません');
      setCameraError('顔認識システムの初期化に失敗しました');
      if (onError) onError('顔認識システムの初期化に失敗しました');
      return;
    }
    
    try {
      console.log('FaceMeshの初期化を開始...');
      
      // FaceMeshの設定
      const faceMesh = new window.FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      faceMesh.onResults((results: any) => {
        if (!canvasRef.current) {
          console.error('canvasRef.currentがnullです (onResults)');
          return;
        }
        
        const canvasCtx = canvasRef.current.getContext('2d');
        if (!canvasCtx) {
          console.error('キャンバスコンテキストの取得に失敗しました');
          return;
        }
        
        // 描画処理
        try {
          // カメラ映像をクリア
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // カメラ映像を描画
          canvasCtx.drawImage(
            results.image,
            0, 0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          
          // 顔が検出された場合
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            // ランドマークの取得
            const landmarks = results.multiFaceLandmarks[0];
            
            // フレームの描画
            drawGlassesFrame(canvasCtx, landmarks, null);
            setFaceDetected(true);
          } else {
            setFaceDetected(false);
          }
          
          canvasCtx.restore();
        } catch (drawError) {
          console.error('描画中にエラーが発生しました:', drawError);
        }
      });
      
      // カメラユーティリティの初期化（解像度を修正）
      if (videoRef.current && window.Camera) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMesh) {
              try {
                await faceMesh.send({ image: videoRef.current });
              } catch (error) {
                console.error('FaceMesh処理中にエラーが発生しました:', error);
              }
            }
          },
          width: 1280,
          height: 720
        });
        
        // カメラの開始
        camera.start()
          .then(() => {
            console.log('MediaPipeカメラが開始されました');
            faceMeshRef.current = faceMesh;
            cameraRef.current = camera;
            if (onLoad) onLoad();
          })
          .catch((error: Error) => {
            console.error('MediaPipeカメラの開始に失敗しました:', error);
            setCameraError('カメラシステムの開始に失敗しました');
            if (onError) onError('カメラシステムの開始に失敗しました');
            
            // フォールバック描画を試みる
            startFallbackDrawing();
          });
      } else {
        console.error('videoRefまたはCamera APIが利用できません');
        setCameraError('カメラシステムの初期化に失敗しました');
        if (onError) onError('カメラシステムの初期化に失敗しました');
        
        // フォールバック描画を試みる
        startFallbackDrawing();
      }
    } catch (error) {
      console.error('FaceMeshの初期化中にエラーが発生しました:', error);
      setCameraError('顔認識システムの初期化に失敗しました');
      if (onError) onError('顔認識システムの初期化に失敗しました');
      
      // フォールバック描画を試みる
      startFallbackDrawing();
    }
  };

  // カメラの初期化とフレーム描画
  useEffect(() => {
    // カメラとMediaPipeが初期化済みかどうかのチェック
    const checkMediaPipeLoaded = () => {
      return !!(window.FaceMesh && window.Camera);
    };
    
    let checkInterval: number | null = null;
    let attempts = 0;
    const maxAttempts = 20; // 最大10秒待機
    
    async function setupCamera() {
      if (!videoRef.current) {
        console.error('videoRef.currentがnullです - カメラを初期化できません');
        setCameraError('カメラの初期化に失敗しました');
        if (onError) onError('カメラの初期化に失敗しました');
          return;
        }
        
      // MediaPipeがロードされるまで待機
      if (!checkMediaPipeLoaded()) {
        console.log('MediaPipeのロードを待機しています...');
        
        checkInterval = window.setInterval(() => {
          attempts++;
          console.log(`MediaPipeロード確認: ${attempts}回目`);
          
          if (checkMediaPipeLoaded()) {
            console.log('MediaPipeのロードが完了しました');
            window.clearInterval(checkInterval!);
            initCamera();
          } else if (attempts >= maxAttempts) {
            console.error('MediaPipeのロードがタイムアウトしました');
            window.clearInterval(checkInterval!);
            setCameraError('カメラシステムの初期化がタイムアウトしました');
            if (onError) onError('カメラシステムの初期化に失敗しました - タイムアウト');
          }
        }, 500);
        return;
      }
      
      initCamera();
    }
    
    // カメラ初期化を開始
    setupCamera();
    
    // クリーンアップ関数
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (error) {
          console.error('FaceMeshクリーンアップエラー:', error);
        }
      }
    };
  }, [frameImage, imageLoaded, frameSize, frameOffsetY, frameOffsetX, onLoad, onError]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading && <CircularProgress />}
      
      {cameraError && (
        <Typography color="error" variant="h6" align="center">
          {cameraError}
        </Typography>
      )}
      
      {imageError && (
        <Typography color="error" variant="h6" align="center">
          {imageError}
        </Typography>
      )}
      
      {!cameraError && !imageError && (
        <Box
          sx={{
            position: 'relative',
            width: '100%', 
            maxWidth: '100%',
            height: '85vh',
            maxHeight: '100%',
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              backgroundColor: '#111', // 背景色を追加
              WebkitTransform: 'scaleX(-1)' // iOS Safari対応
            }}
            playsInline
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              WebkitTransform: 'scaleX(-1)', // iOS Safari対応
              borderRadius: '8px',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              backgroundColor: 'transparent' // 透明背景
            }}
          />
          
          {/* 顔検出メッセージ */}
          {!faceDetected && cameraReady && (
            <Box
              sx={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '8px',
                zIndex: 4
              }}
            >
              <Typography sx={{ color: 'white' }} variant="body2" align="center">
                顔が検出されていません。正面を向いてください。
              </Typography>
            </Box>
          )}
          
          {/* カメラ準備中メッセージ */}
          {isCameraLoading && !cameraError && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                zIndex: 4
              }}
            >
              <CircularProgress color="primary" />
              <Typography color="white" variant="body1" align="center" sx={{ textShadow: '0 0 5px black' }}>
                カメラを準備中...
              </Typography>
            </Box>
          )}
          
          {/* フレーム調整コントロール */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '400px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.1px',
              zIndex: 3
            }}
          >
            {/* サイズ調整 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'white', minWidth: '50px', fontSize: '0.7rem' }}>サイズ:</Typography>
              <Slider
                value={frameSize}
                onChange={handleSizeChange}
                min={0.5}
                max={1.5}
                step={0.01}
                sx={{ 
                  color: 'white',
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  }
                }}
              />
            </Box>
            
            {/* 上下位置 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'white', minWidth: '50px', fontSize: '0.7rem' }}>上下位置:</Typography>
              <Slider
                value={frameOffsetY}
                onChange={handleOffsetYChange}
                min={0.3}
                max={0.9}
                step={0.01}
                sx={{ 
                  color: 'white',
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  }
                }}
              />
            </Box>
            
            {/* 左右位置 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'white', minWidth: '50px', fontSize: '0.7rem' }}>左右位置:</Typography>
              <Slider
                value={frameOffsetX}
                onChange={handleOffsetXChange}
                min={-0.5}
                max={0.5}
                step={0.01}
                sx={{ 
                  color: 'white',
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  }
                }}
              />
            </Box>
            
            {/* リセットボタン */}
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              onClick={handleReset}
              sx={{ 
                alignSelf: 'center', 
                width: 'auto', 
                mt: 0.5,
                height: '28px',
                fontSize: '0.7rem',
                padding: '4px 10px',
                backgroundColor: 'rgba(25, 118, 210, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 1)'
                }
              }}
            >
              調整をリセット
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RealtimeTryOn;