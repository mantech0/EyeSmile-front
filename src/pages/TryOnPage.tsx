import React, { useState } from 'react';
import RealtimeTryOn from '../components/tryOn/RealtimeTryOn';

const TryOnPage: React.FC = () => {
  const [selectedGlasses, setSelectedGlasses] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">バーチャルトライオン</h1>
      <div className="flex flex-col items-center">
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
          <RealtimeTryOn 
            selectedGlasses={selectedGlasses}
            onLoad={() => setIsLoading(false)}
            onError={(err) => {
              setError(err);
              setIsLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TryOnPage; 