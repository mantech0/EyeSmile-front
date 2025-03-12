import React from 'react';

interface NavigationButtonsProps {
    onNext: () => void;
    onPrev: () => void;
    canGoNext: boolean;
    canGoPrev: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
    onNext,
    onPrev,
    canGoNext,
    canGoPrev
}) => {
    return (
        <div className="navigation-buttons">
            {canGoPrev && (
                <button 
                    className="nav-button prev"
                    onClick={onPrev}
                >
                    前へ
                </button>
            )}
            {canGoNext && (
                <button 
                    className="nav-button next"
                    onClick={onNext}
                >
                    次へ
                </button>
            )}
        </div>
    );
};

export default NavigationButtons; 