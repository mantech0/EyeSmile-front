import React from 'react';
import QuestionnaireContainer from '../components/questionnaire/QuestionnaireContainer';
import { useNavigate } from 'react-router-dom';

const QuestionnairePage: React.FC = () => {
  const navigate = useNavigate();

  const handleQuestionnaireComplete = () => {
    // アンケート完了後、QAページに進む
    navigate('/qa');
  };

  return (
    <div className="questionnaire-page">
      <QuestionnaireContainer onComplete={handleQuestionnaireComplete} />
    </div>
  );
};

export default QuestionnairePage; 