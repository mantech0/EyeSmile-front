import React, { useState } from 'react';
import { Question, Answer } from '../../types/questionnaire';
import QuestionCard from './QuestionCard';
import StepIndicator from './StepIndicator';
import NavigationButtons from './NavigationButtons';
import './questionnaire.css';

const QuestionnaireContainer: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);

    // 仮のデータ（後でAPIから取得）
    const questions: Question[] = [
        {
            id: 1,
            questionType: 'scene',
            questionText: 'どんなシーンでアイウェアを着用をしたいですか？',
            displayOrder: 1,
            options: ['仕事', '日常生活', '遊び', 'スポーツ', 'その他'],
            multipleSelect: true
        },
        {
            id: 2,
            questionType: 'image',
            questionText: 'どのような印象に見られたいですか？',
            displayOrder: 2,
            options: ['知的', '活発', '落ち着き', '若々しく', 'クール', 'おしゃれ', 'かっこよく', 'かわいく', 'その他'],
            multipleSelect: true
        },
        {
            id: 3,
            questionType: 'fashion',
            questionText: 'どんな服装を普段しますか？',
            displayOrder: 3,
            options: ['カジュアル', 'フォーマル', 'スポーティ', 'モード', 'シンプル', 'ストリート', 'アウトドア', 'その他'],
            multipleSelect: true
        },
        {
            id: 4,
            questionType: 'personal_color',
            questionText: 'パーソナルカラーは何色ですか？',
            displayOrder: 4,
            options: ['Spring（スプリング）', 'Summer（サマー）', 'Autumn（オータム）', 'Winter（ウィンター）', 'わからない'],
            multipleSelect: false
        }
    ];

    const handleAnswer = (answer: Answer) => {
        setAnswers(prev => {
            const newAnswers = [...prev];
            const index = newAnswers.findIndex(a => a.questionId === answer.questionId);
            if (index !== -1) {
                newAnswers[index] = answer;
            } else {
                newAnswers.push(answer);
            }
            return newAnswers;
        });
    };

    const currentAnswers = answers.find(a => a.questionId === questions[currentStep].id)?.selectedOptions || [];

    return (
        <div className="questionnaire-container">
            <StepIndicator 
                currentStep={currentStep} 
                totalSteps={questions.length} 
            />
            <QuestionCard
                question={questions[currentStep]}
                onAnswer={handleAnswer}
                currentAnswers={currentAnswers}
            />
            <NavigationButtons
                onNext={() => setCurrentStep(prev => Math.min(prev + 1, questions.length - 1))}
                onPrev={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                canGoNext={currentStep < questions.length - 1}
                canGoPrev={currentStep > 0}
            />
        </div>
    );
};

export default QuestionnaireContainer; 