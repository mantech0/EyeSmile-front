export interface Question {
    id: number;
    questionType: string;
    questionText: string;
    displayOrder: number;
    options: string[];
    multipleSelect: boolean;
}

export interface Answer {
    questionId: number;
    selectedOptions: string[];
} 