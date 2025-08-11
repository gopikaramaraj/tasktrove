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
  description:string;
  progress: number; // This might be user-specific, consider moving to a userChallenge collection
  communityName: string; // denormalized for easy display
  communityId: string;
}

export interface User {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  avatarUrl: string;
  xp: number;
  bio?: string;
  level: number;
}
