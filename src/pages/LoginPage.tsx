import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // ダミーのログイン処理 - スタッフ選択ページに進む
    navigate('/staff');
  };

  return (
    <div className="login-page">
      <div className="login-background"></div>
      <div className="login-content">
        <div className="login-button-container">
          <button className="login-button" onClick={handleLogin}>
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 