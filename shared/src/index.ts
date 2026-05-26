export type HealthResponse = {
  status: 'ok';
  service: string;
};

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface User {
  id: number;
  email: string;
  displayName: string;
  createdAt: number;
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  status: GoalStatus;
  createdAt: number;
}
