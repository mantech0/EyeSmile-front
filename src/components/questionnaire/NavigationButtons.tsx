import React from 'react';

interface NavigationButtonsProps {
    onNext: () => void;
    onPrev: () => void;
    canGoNext: boolean;
    canGoPrev: boolean;
    isLastStep?: boolean;
    isSubmitting?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
    onNext,
    onPrev,
    canGoNext,
    canGoPrev,
    isLastStep = false,
    isSubmitting = false
}) => {
    return (
        <div className="navigation-buttons">
            {canGoPrev && (
                <button 
                    className="nav-button prev"
                    onClick={onPrev}
                    disabled={isSubmitting}
                >
                    前へ
                </button>
            )}
            {canGoNext && (
                <button 
                    className="nav-button next"
                    onClick={onNext}
                    disabled={isSubmitting}
                >
                    {isLastStep ? (isSubmitting ? '送信中...' : '送信') : '次へ'}
                </button>
            )}
        </div>
    );
};

export default NavigationButtons; 