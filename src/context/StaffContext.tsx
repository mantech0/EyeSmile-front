import React, { createContext, useContext, useState, ReactNode } from 'react';

// スタッフの型定義
export interface StaffMember {
  id: number;
  name: string;
  position: string;
  image: string;
}

// コンテキストの型定義
interface StaffContextType {
  selectedStaff: StaffMember | null;
  setSelectedStaff: (staff: StaffMember) => void;
}

// コンテキストの作成
const StaffContext = createContext<StaffContextType | undefined>(undefined);

// コンテキストプロバイダー
export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  return (
    <StaffContext.Provider
      value={{
        selectedStaff,
        setSelectedStaff,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

// カスタムフック
export const useStaff = (): StaffContextType => {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};

// デフォルトのスタッフデータ
export const staffMembers: StaffMember[] = [
  {
    id: 1,
    name: 'さとこさん',
    position: 'ベテラン店長20年選手',
    image: '/images/staff/satoko.jpg'
  },
  {
    id: 2,
    name: 'たくぞうさん',
    position: '丁寧な紳士店員',
    image: '/images/staff/takuzou.jpg'
  },
  {
    id: 3,
    name: 'あきさん',
    position: 'センスの良い若手',
    image: '/images/staff/aki.jpg'
  },
  {
    id: 4,
    name: 'りんさん',
    position: 'インバウンド対応が得意',
    image: '/images/staff/rin.jpg'
  }
]; 