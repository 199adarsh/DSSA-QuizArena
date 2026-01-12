
# Quizzyy

### A modern, competition-grade online quiz platform built by a Senior Full Stack Software Engineer (SDE-3)

## Technical Overview

<img src="https://img.shields.io/badge/Frontend-Next.js-blue?logo=next.js" alt="Next.js" />
<img src="https://img.shields.io/badge/Styling-Tailwind_CSS-blue?logo=tailwindcss" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Animation-Framer_Motion-blue?logo=framer" alt="Framer Motion" />
<img src="https://img.shields.io/badge/Primitives-shadcn%2Fui-blue?logo=react" alt="shadcn/ui" />

- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion, shadcn/ui or equivalent modern primitives

<img src="https://img.shields.io/badge/Backend-Node.js-blue?logo=node.js" alt="Node.js" />

- **Backend**: Node.js + lightweight API routes

<img src="https://img.shields.io/badge/Database-Firebase%20%7C%20MongoDB-blue?logo=mongodb&logo=firebase" alt="Firebase | MongoDB" />

- **Database**: Firebase / MongoDB

<img src="https://img.shields.io/badge/Auth-Google_Authentication-blue?logo=google" alt="Google Authentication" />

- **Auth**: Google Authentication

## User Experience

<img src="https://img.shields.io/badge/UI_Design-Glassmorphism%20%7C%20Soft_Gradients-blue" alt="Glassmorphism | Soft Gradients" />
<img src="https://img.shields.io/badge/UI_Design-Floating_Cards_with_Depth-blue" alt="Floating Cards with Depth" />
<img src="https://img.shields.io/badge/UI_Design-Subtle_Motion_Everywhere-blue" alt="Subtle Motion Everywhere" />

- **UI**: Glassmorphism / soft gradients, floating cards with depth, subtle motion everywhere (but never distracting), card-based layout, animated transitions between questions, progress indicator with micro-interactions, Framer Motion–style easing, mobile-first, thumb-friendly, dark mode default (with optional light mode)

## Functional Requirements

### Authentication & Attempt Control

- Google Authentication only
- One Google account = one quiz attempt (hard lock)
- Attempt state must persist across refresh, reconnect, or accidental close
- Once submitted or terminated → permanently locked

### JSON-Driven Quiz Engine (No Admin Panel)

- Quiz questions are loaded from a static or remote JSON file

## Build this like a real startup product

Every decision should optimize for fairness, polish, and trust.
