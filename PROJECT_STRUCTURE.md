# Project Documentation

## Project Structure

```text
├── .env
├── .firebaserc
├── .gitignore
├── .idx/
│   ├── dev.nix
│   └── icon.png
├── .modified
├── README.md
├── apphosting.yaml
├── components.json
├── docs/
│   └── blueprint.md
├── firebase.json
├── firestore.rules
├── generate-docs.js
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── src/
│   ├── ai/
│   │   ├── dev.ts
│   │   ├── flows/
│   │   │   ├── chat.ts
│   │   │   └── suggest-personalized-challenges.ts
│   │   └── genkit.ts
│   ├── app/
│   │   ├── communities/
│   │   │   ├── [id]/
│   │   │   │   ├── challenges/
│   │   │   │   │   ├── [challengeId]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── create/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── games/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── profile/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── components/
│   │   ├── FirebaseErrorListener.tsx
│   │   ├── Logo.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── OAuthButtons.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── communities/
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── CommunityCard.tsx
│   │   │   ├── CommunityChat.tsx
│   │   │   ├── CreateChallengeForm.tsx
│   │   │   ├── CreateCommunityForm.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── LiveCheckinDialog.tsx
│   │   ├── dashboard/
│   │   │   ├── ChatBot.tsx
│   │   │   ├── PersonalizedSuggestions.tsx
│   │   │   ├── RecentChallenges.tsx
│   │   │   └── StatCard.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   └── Header.tsx
│   │   └── ui/
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── tooltip.tsx
│   ├── firebase/
│   │   ├── error-emitter.ts
│   │   └── errors.ts
│   ├── hooks/
│   │   ├── use-auth.tsx
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── lib/
│       ├── firebase.ts
│       ├── liveCheckinWebrtc.ts
│       ├── placeholder-images.json
│       ├── polyfill.ts
│       ├── types.ts
│       └── utils.ts
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

## Key File Contents

