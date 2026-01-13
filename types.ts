
export type Difficulty = '易' | '中' | '難';
export type ThemeMode = 'default' | 'warm' | 'cold';
export type Grade = '一年級' | '二年級' | '三年級' | '四年級' | '五年級' | '六年級' | '';
export type Publisher = '康軒' | '南一' | '翰林';
export type Semester = '上' | '下';

export interface SelectionParams {
  difficulty: Difficulty;
  unitTitle: string;
  grade: Grade;
  publisher: Publisher;
  year: string;
  semester: Semester;
}

export interface Chapter {
  id: string;
  title: string;
  subChapters: string[];
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