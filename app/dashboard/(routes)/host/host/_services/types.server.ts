// app/dashboard/_services/types.server.ts
export type QuizWithDetails = {
  id: string;
  title: string;
  userId: string;
  questions: Array<{
    id: string;
    question: string;
    options: any[]; // could be array of strings or objects {text}
    correctAnswers: any; // JSON
    isMultiChoice: boolean;
  }>;
  submissions: Array<any>; // prisma submission objects with user relation
};

export type SubmissionRow = {
  id: string;
  url: string;
  user: {
    id: string;
    fname: string;
    lname: string;
  };
  score: number;
  createdAt: string;
  updatedAt: string;
  rawSubmission: any; // full submission record for modal
};
