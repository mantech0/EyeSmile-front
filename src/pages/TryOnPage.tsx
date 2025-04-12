import React, { useState } from 'react';
import RealtimeTryOn from '../components/tryOn/RealtimeTryOn';

const TryOnPage: React.FC = () => {
  const [selectedGlasses, setSelectedGlasses] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">バーチャルトライオン</h1>
      <div className="flex flex-col items-center">
        <RealtimeTryOn selectedGlasses={selectedGlasses} />
      </div>
    </div>
  );
};

export default TryOnPage; 