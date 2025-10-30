export interface Quiz {
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
}
