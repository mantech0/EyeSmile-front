import React, { useState } from 'react';
import { Question, Answer } from '../../types/questionnaire';
import QuestionCard from './QuestionCard';
import StepIndicator from './StepIndicator';
import NavigationButtons from './NavigationButtons';
import { submitQuestionnaire } from '../../services/api';
import './questionnaire.css';

interface QuestionnaireContainerProps {
    onComplete: () => void;
}

const QuestionnaireContainer: React.FC<QuestionnaireContainerProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            // API通信を再開
            console.log('アンケート回答を送信します', answers);
            await submitQuestionnaire(answers);
            setIsComplete(true);
            onComplete();
        } catch (err) {
            console.error('エラー:', err);
            setError('回答の送信中にエラーが発生しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentAnswers = answers.find(a => a.questionId === questions[currentStep].id)?.selectedOptions || [];

    if (isComplete) {
        return (
            <div className="questionnaire-complete">
                <h2>ありがとうございました！</h2>
                <p>あなたに最適なアイウェアをご提案いたします。</p>
            </div>
        );
    }

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
            {error && <div className="error-message">{error}</div>}
            <NavigationButtons
                onNext={() => {
                    if (currentStep === questions.length - 1) {
                        handleSubmit();
                    } else {
                        setCurrentStep(prev => Math.min(prev + 1, questions.length - 1));
                    }
                }}
                onPrev={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                canGoNext={currentStep < questions.length - 1 || (currentStep === questions.length - 1 && currentAnswers.length > 0)}
                canGoPrev={currentStep > 0}
                isLastStep={currentStep === questions.length - 1}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default QuestionnaireContainer; 