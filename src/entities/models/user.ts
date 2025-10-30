import {
  Course,
  Level,
  User as PUser,
  ROLE,
  SubscriptionPlan,
} from '@prisma/client';

export interface User {
  id: string;
  email: string;
}
export interface UserWithPassword {
  id: string;
  email: string;
  password: string;
}

export type ReturnUserDetail = PUser & {
  _count: { courses: number; subscriptions: number };
  subscribers: { subscribedId: string; subscriberId: string }[];
  subscriptions: { subscriberId: string }[];
  subscriptionPlan: SubscriptionPlan | null;
  courses: (Course & { levels: Level[] })[];
};

export interface UserDetail {
  id: string;
  fname: string;
  lname: string;
  email: string;
  initials: string | null;
  picture: string | null;
  phone: string;
  role: ROLE;
  school: string;
  isLive: boolean;
  code: string | null;
  _count: { courses: number; subscriptions: number };
  wallet: {
    amount: number;
  };
  subscriptions: string[];
  subscriptionPlan: SubscriptionPlan | null;
  courses: (Course & { levels: Level[] })[];
}
