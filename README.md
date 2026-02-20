# TaskTrove

## Project Overview
TaskTrove is a gamified productivity and community challenge platform built with Next.js 15 (App Router). It leverages Firebase for secure authentication and real-time database capabilities, while using Genkit AI for rich, personalized AI features like chatbots and custom challenge suggestions. The user interface is designed with Tailwind CSS and Radix UI primitives (shadcn/ui), ensuring a modern, accessible, and responsive experience.

## Main Features

### 1. **Robust Authentication & State Management**
- **Authentication**: Email/password and OAuth support powered by Firebase Auth.
- **State Management**: Global user state is managed via React Context (`AuthProvider` in `src/hooks/use-auth.tsx`). Route protection is seamlessly handled on the client-side by observing authentication states and selectively restricting access to protected routes while allowing public ones (`/login`, `/signup`, `/`).

### 2. **Communities & Gamified Challenges**
- **Community Hub**: Users can explore, join, and create communities (`/communities/create`), complete with real-time community chat (`CommunityChat.tsx`) and live check-ins (`LiveCheckinDialog.tsx`).
- **Interactive Challenges**: Users can participate in and create trackable challenges within communities. Features include leaderboards to drive engagement and competition.

### 3. **AI-Powered Dashboard**
- **Genkit AI Integration**: A dedicated AI pipeline (`src/ai/`) powers customized productivity interactions, including personalized challenge suggestions (`suggest-personalized-challenges.ts`) and an interactive chatbot (`ChatBot.tsx`).
- **Analytics & Tracking**: The dashboard provides a comprehensive view of user progress using statistical cards (`StatCard.tsx`), recent challenge tracking, and responsive charts via Recharts.

### 4. **Modern UI/UX & Component Architecture**
- **Component Architecture**: Highly modular design separating `ui` (reusable Radix/Tailwind components), `layout` (headers, application wrappers), and feature-specific components (`auth`, `communities`, `dashboard`).
- **Form Validation**: Type-safe, declarative forms built with React Hook Form and Zod ensure robust client-side validation and a sleek user experience.

## Routing Architecture

TaskTrove utilizes the **Next.js App Router** (`src/app/`) for intuitive, file-system-based routing:
- **Public Routes**: `/` (Home), `/login`, `/signup`.
- **Protected Routes**: 
  - `/dashboard`: User overview, AI chat, and personalized suggestions.
  - `/communities`: Browsing available communities.
  - `/communities/create`: Interface for creating a new community.
  - `/communities/[id]`: Detailed community view containing real-time chat and leaderboards.
  - `/communities/[id]/challenges/create`: Interface for adding new challenges to a community.
  - `/communities/[id]/challenges/[challengeId]`: Specific challenge details and interactive elements.
  - `/communities/[id]/settings`: Community management configuration.
  - `/games`: Dedicated gamified activities module.
  - `/profile`: User profile settings and personal history.

## Folder Structure Breakdown

```text
├── src/
│   ├── ai/                  # Genkit AI configurations and flow logic (chat, suggestions)
│   ├── app/                 # Next.js App Router providing pages, layouts, and routing logic
│   │   ├── communities/     # Community and challenge routes (dynamic [id] routing)
│   │   ├── dashboard/       # Protected user dashboard route
│   │   ├── games/           # Gamified feature routes
│   │   ├── login/           # Login route
│   │   ├── profile/         # User profile route
│   │   └── signup/          # Registration route
│   ├── components/          # React components structured by feature domain
│   │   ├── auth/            # Login, Signup, and OAuth form components
│   │   ├── communities/     # Challenge cards, chats, leaderboards, and creation forms
│   │   ├── dashboard/       # AI chatbot, suggestions, and statistical overview cards
│   │   ├── layout/          # Global layout wrappers (Header, AppLayout)
│   │   └── ui/              # Reusable UI primitives (shadcn/ui + Radix UI)
│   ├── firebase/            # Firebase error handling, listeners, and utilities
│   ├── hooks/               # Custom React hooks (use-auth, use-mobile, use-toast)
│   └── lib/                 # Core utilities, Firebase initialization, types, and polyfills
```

## Tech Stack
- **Framework**: Next.js 15 (React 18)
- **Styling**: Tailwind CSS & Framer Motion (via `tailwindcss-animate`)
- **UI Components**: Radix UI / shadcn/ui
- **Backend & Database**: Firebase (Authentication, Firestore)
- **AI Integration**: Google Genkit (`@genkit-ai/googleai`, `@genkit-ai/next`)
- **Form Management**: React Hook Form + Zod
- **Data Visualization**: Recharts
