export interface UserProfile {
  uid: string;
  email: string;
  gameNickname: string;
  gameId: string;
  dfProfilerUrl?: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface UserRole {
  uid: string;
  role: 'admin' | 'user';
}
