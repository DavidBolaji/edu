export interface Quiz {
  id: string;
  title: string;
  duration: number;
  userId?: string;
  quizDate: Date;
  questions: Question[];
  submissions: { userId: string }[];
}

export interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  isMultiChoice: boolean;
}
