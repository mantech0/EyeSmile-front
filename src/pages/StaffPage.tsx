import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StaffPage.css';
import { useStaff, staffMembers } from '../context/StaffContext';

const StaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedStaff } = useStaff();
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [showFooter, setShowFooter] = useState(false);

  const handleStaffSelect = (staffId: number) => {
    setSelectedStaffId(staffId);
    // スタッフデータをコンテキストに保存
    const staffData = staffMembers.find(staff => staff.id === staffId);
    if (staffData) {
      setSelectedStaff(staffData);
    }
    // フッターを表示（少し遅延をつける）
    setTimeout(() => {
      setShowFooter(true);
    }, 300);
  };

  const handleNext = () => {
    // QAページに遷移
    navigate('/qa');
  };

  // 選択されたスタッフの情報を取得
  const selectedStaffInfo = selectedStaffId ? staffMembers.find(staff => staff.id === selectedStaffId) : null;

  return (
    <div className="staff-page">
      <div className="staff-header">
        <h1>今日は誰に相談しますか？</h1>
      </div>

      <div className="staff-list">
        {staffMembers.map((staff) => (
          <div 
            key={staff.id} 
            className={`staff-card ${selectedStaffId === staff.id ? 'selected' : ''}`}
            onClick={() => handleStaffSelect(staff.id)}
          >
            <div className="staff-image-container">
              <img src={staff.image} alt={staff.name} className="staff-image" />
            </div>
            <div className="staff-info">
              <div className="staff-position">{staff.position}</div>
              <div className="staff-name">「{staff.name}」</div>
            </div>
          </div>
        ))}
      </div>

      {showFooter && (
        <div className="staff-footer">
          <div className="footer-message-container">
            <div className="staff-avatar">
              <img 
                src={selectedStaffInfo?.image || '/images/staff/watakushi.jpg'} 
                alt={selectedStaffInfo?.name || 'スタッフ'} 
              />
            </div>
            <div className="speech-bubble">
              <p>本日はわたくしが担当します。</p>
              <p>4つの質問に回答→顔写真を撮影することでお勧めのアイウェアを提案いたします。</p>
            </div>
          </div>
          <div className="next-button-container">
            <button className="next-button" onClick={handleNext}>
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage; 