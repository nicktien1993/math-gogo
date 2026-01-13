
export type Grade = '一年級' | '二年級' | '三年級' | '四年級' | '五年級' | '六年級';
export type Difficulty = '易' | '中' | '難';
export type ThemeMode = 'default' | 'warm' | 'cold';
export type Publisher = '康軒' | '南一' | '翰林';
export type Semester = '上' | '下';

// Missing Chapter interface for curriculum data
export interface Chapter {
  id: string;
  title: string;
  subChapters: string[];
}

export interface SelectionParams {
  publisher: Publisher;
  year: string;
  grade: Grade;
  semester: Semester;
  difficulty: Difficulty;
  unitTitle: string;
}

export interface HandoutContent {
  title: string;
  concept: string;
  visualAidSvg?: string; 
  examples: Array<{
    question: string;
    stepByStep: string[];
    answer: string;
    visualAidSvg?: string;
  }>;
  tips: string;
  checklist: string[]; 
  exercises?: Array<{
    question: string;
    visualAidSvg?: string;
  }>;
}

export interface HomeworkConfig {
  calculationCount: number;
  wordProblemCount: number;
  difficulty?: Difficulty;
}

export interface HomeworkContent {
  title: string;
  questions: Array<{
    type: string;
    content: string;
    hint?: string;
    answer: string;
    visualAidSvg?: string;
  }>;
  checklist: string[]; 
}
