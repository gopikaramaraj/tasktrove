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

export interface UserChallenge {
    id: string;
    userId: string;
    challengeId: string;
    communityId: string;
    progress: number;
    completedAt: {
        seconds: number;
        nanoseconds: number;
    } | null;
}

export interface UserHabit {
    id: string;
    userId: string;
    habitId: string;
    name: string;
    lastCheckIn: {
        seconds: number;
        nanoseconds: number;
    };
}
