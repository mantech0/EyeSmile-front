import React, { useState, useEffect } from 'react';
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

    // スクロールを有効化する
    useEffect(() => {
        // HTML要素のスクロールを確実に有効化
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        
        // iOSでのスクロール問題を解決するためのタッチイベントリスナー
        const handleTouchMove = (e: TouchEvent) => {
            // デフォルトの動作を妨げない
            e.stopPropagation();
        };
        
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        
        // クリーンアップ
        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    // 質問が変わった時に上部にスクロール
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

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
            options: ['華やか・おしゃれ', 'スタイリッシュ・トレンド感', '知的・クール・落着き', '活発・明るい・親しみやすい', 'その他'],
            multipleSelect: true
        },
        {
            id: 3,
            questionType: 'fashion',
            questionText: 'どんな服装を普段しますか？（好きですか？）',
            displayOrder: 3,
            options: ['カジュアル・シンプル', 'フォーマル・モード', 'スポーティ・アウトドア', 'ストリート', 'その他'],
            multipleSelect: true
        },
        {
            id: 4,
            questionType: 'personal_color',
            questionText: 'パーソナルカラーは何色ですか？',
            displayOrder: 4,
            options: ['イエベ（春）', 'ブルベ（夏）', 'イエベ（秋）', 'ブルベ（冬）', 'わからない'],
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
            <div className="questionnaire-page">
                <div className="questionnaire-container">
                    <div className="questionnaire-complete">
                        <h2>ありがとうございました！</h2>
                        <p>あなたに最適なアイウェアをご提案いたします。</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="questionnaire-page">
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
                
                {/* 余分なスペースを追加して「次へ」ボタンが見えるようにする */}
                <div style={{ height: '60px' }} />
                
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
        </div>
    );
};

export default QuestionnaireContainer; 