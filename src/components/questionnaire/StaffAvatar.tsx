import React from 'react';
import { useStaff } from '../../context/StaffContext';
import './StaffAvatar.css';

const StaffAvatar: React.FC = () => {
  const { selectedStaff } = useStaff();

  if (!selectedStaff) {
    return null;
  }

  return (
    <div className="qa-staff-avatar-container">
      <div className="qa-staff-avatar">
        <img src={selectedStaff.image} alt={selectedStaff.name} />
      </div>
      <div className="qa-staff-name">
        {selectedStaff.name}
      </div>
    </div>
  );
};

export default StaffAvatar; 