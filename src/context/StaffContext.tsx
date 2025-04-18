import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

// LocalStorageのキー
const STORAGE_KEY = 'eyesmile_selected_staff';

// コンテキストプロバイダー
export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // LocalStorageから初期値を取得
  const getInitialStaff = (): StaffMember | null => {
    try {
      const storedStaff = localStorage.getItem(STORAGE_KEY);
      if (storedStaff) {
        return JSON.parse(storedStaff);
      }
      return null;
    } catch (error) {
      console.error('LocalStorageからスタッフ情報を取得できませんでした:', error);
      return null;
    }
  };

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(getInitialStaff());

  // スタッフ選択時にLocalStorageに保存
  const handleSetSelectedStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
      console.log('スタッフ情報をLocalStorageに保存しました:', staff);
    } catch (error) {
      console.error('LocalStorageにスタッフ情報を保存できませんでした:', error);
    }
  };

  // 初回マウント時のデバッグログ
  useEffect(() => {
    console.log('StaffProvider初期化 - 現在のスタッフ:', selectedStaff);
  }, []);

  return (
    <StaffContext.Provider
      value={{
        selectedStaff,
        setSelectedStaff: handleSetSelectedStaff,
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