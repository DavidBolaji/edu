export interface Submission {
  id: string;
  url: string;
  user: {
    id: string;
    fname: string;
    lname: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Portal {
  id: string;
  desc: string;
  course: string;
  level: string;
  type: 'AUDIO' | 'EBOOK' | 'VIDEO';
  openDate: string;
  closeDate: string;
  submissions: Submission[];
}

export interface PortalFormValues {
  course: string;
  type: string;
  desc: string;
  level: string;
  openDate: Date;
  closeDate: Date;
}
