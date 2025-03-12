import React from 'react';
import { Question, Answer } from '../../types/questionnaire';

interface QuestionCardProps {
    question: Question;
    onAnswer: (answer: Answer) => void;
    currentAnswers: string[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
    question, 
    onAnswer, 
    currentAnswers 
}) => {
    const handleOptionSelect = (option: string) => {
        let newSelected: string[];
        if (question.multipleSelect) {
            // 複数選択の場合
            newSelected = currentAnswers.includes(option)
                ? currentAnswers.filter(item => item !== option)
                : [...currentAnswers, option];
        } else {
            // 単一選択の場合
            newSelected = [option];
        }
        onAnswer({
            questionId: question.id,
            selectedOptions: newSelected
        });
    };

    return (
        <div className="question-card">
            <h3 className="question-text">{question.questionText}</h3>
            <div className="options-grid">
                {question.options.map((option) => (
                    <button
                        key={option}
                        className={`option-button ${currentAnswers.includes(option) ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {question.multipleSelect && (
                <p className="helper-text">※複数選択可能です</p>
            )}
        </div>
    );
};

export default QuestionCard; 