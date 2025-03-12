import React from 'react';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
    return (
        <div className="step-indicator">
            <div className="step-text">
                Step {currentStep + 1} / {totalSteps}
            </div>
            <div className="progress-bar">
                <div 
                    className="progress"
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default StepIndicator; 