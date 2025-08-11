export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  imageUrl: string;
  bannerUrl: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  communityName: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  xp: number;
}
