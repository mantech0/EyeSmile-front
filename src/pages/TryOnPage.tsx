import React, { useState, useEffect } from 'react';
import RealtimeTryOn from '../components/tryOn/RealtimeTryOn';
import axios from 'axios';

interface Frame {
  id: number;
  name: string;
  image_url: string;
  // 他の必要なプロパティを追加
}

const TryOnPage: React.FC = () => {
  const [selectedGlasses, setSelectedGlasses] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);

  useEffect(() => {
    const fetchFrames = async () => {
      setIsLoadingFrames(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/frames`);
        console.log('Frames response:', response.data);
        setFrames(response.data);
      } catch (err) {
        console.error('Error fetching frames:', err);
        setError('フレームデータの取得に失敗しました');
      } finally {
        setIsLoadingFrames(false);
      }
    };

    fetchFrames();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">バーチャルトライオン</h1>
      <div className="flex flex-col items-center">
        {isLoadingFrames && <div>フレームデータを読み込み中...</div>}
        {isLoading && (
          <div className="text-center mb-4">
            カメラを初期化中...
          </div>
        )}
        {error ? (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className="cursor-pointer p-2 border rounded"
                  onClick={() => setSelectedGlasses(frame.image_url)}
                >
                  <img src={frame.image_url} alt={frame.name} className="w-full" />
                  <p className="text-center mt-2">{frame.name}</p>
                </div>
              ))}
            </div>
            <RealtimeTryOn 
              selectedGlasses={selectedGlasses}
              onLoad={() => setIsLoading(false)}
              onError={(err) => {
                setError(err);
                setIsLoading(false);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TryOnPage; 