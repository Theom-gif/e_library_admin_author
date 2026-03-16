# Next.js Enterprise Architecture Guide

## Project Overview

This project is built using Next.js (App Router) with TypeScript and
follows a scalable enterprise architecture designed for:

-   High performance
-   Maintainability
-   Clear separation of concerns
-   Large team collaboration
-   AI-assisted development
-   Long‑term scalability

The architecture is feature-driven with shared core modules commonly
used in large organizations.

------------------------------------------------------------------------

# Architecture Principles

## 1. Feature-Based Architecture

Each feature is isolated to avoid code coupling.

Benefits: - Easy scaling - Easy debugging - Faster onboarding

## 2. Layered Structure

UI → Hooks → Services → API → Backend

## 3. Service Layer Pattern

All backend communication must go through a service layer.

Never call APIs directly inside UI components.

## 4. Centralized API Client

A single API client manages: - authentication headers - request
interceptors - response interceptors - error handling

## 5. Strong Type Safety

All backend responses must have defined TypeScript interfaces.

------------------------------------------------------------------------

# Project Structure

    src
    │
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/
    │   │   └── register/
    │   │
    │   ├── (dashboard)/
    │   │   ├── books/
    │   │   ├── users/
    │   │   └── settings/
    │   │
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── features/
    │   ├── auth/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── services/
    │   │   ├── types/
    │   │   └── index.ts
    │   │
    │   ├── users/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── services/
    │   │   ├── types/
    │   │   └── index.ts
    │
    ├── components/
    │   ├── ui/
    │   ├── forms/
    │   └── layout/
    │
    ├── services/
    │   ├── apiClient.ts
    │   └── authToken.ts
    │
    ├── hooks/
    │   └── useDebounce.ts
    │
    ├── lib/
    │   ├── axios.ts
    │   └── react-query.ts
    │
    ├── types/
    │   └── api.ts
    │
    ├── utils/
    │   ├── formatDate.ts
    │   └── validators.ts
    │
    ├── config/
    │   ├── env.ts
    │   └── routes.ts
    │
    ├── constants/
    │   └── appConstants.ts
    │
    └── styles/
        └── globals.css

------------------------------------------------------------------------

# Performance Best Practices

## Use Server Components by Default

Next.js App Router supports Server Components.

Use client components only when needed.

Example:

    "use client"

Use only when: - using state - using browser APIs - using event handlers

------------------------------------------------------------------------

## Dynamic Imports

    const Chart = dynamic(() => import('@/components/Chart'), {
      ssr: false
    })

------------------------------------------------------------------------

## Image Optimization

Always use:

    next/image

------------------------------------------------------------------------

# API Integration

## Central API Client

    src/services/apiClient.ts

``` ts
import axios from "axios"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000
})
```

------------------------------------------------------------------------

## Request Interceptor

``` ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
```

------------------------------------------------------------------------

# Feature Service Example

    features/users/services/userService.ts

``` ts
import { apiClient } from "@/services/apiClient"
import { User } from "../types/user"

export const getUsers = async (): Promise<User[]> => {
  const res = await apiClient.get("/users")
  return res.data
}
```

------------------------------------------------------------------------

# AI Development Guidelines

## Rule 1 --- No API Calls in Components

Wrong:

    fetch("/api/users")

Correct:

Use:

    services/userService.ts

------------------------------------------------------------------------

## Rule 2 --- Strict Feature Isolation

Each feature must contain:

    components/
    hooks/
    services/
    types/

------------------------------------------------------------------------

## Rule 3 --- Types First

Before calling an API create types.

    features/users/types/user.ts

------------------------------------------------------------------------

## Rule 4 --- Reusable UI Components

Shared UI components must live in:

    components/ui

Examples:

-   Button
-   Modal
-   Card
-   Input
-   Table

------------------------------------------------------------------------

# Testing Strategy

Recommended structure:

    tests/
    ├── unit/
    ├── integration/
    └── e2e/

Tools:

-   Jest
-   React Testing Library
-   Playwright

------------------------------------------------------------------------

# Environment Variables

Store secrets in:

    .env.local

Example:

    NEXT_PUBLIC_API_URL=http://localhost:9090/api
    NEXT_PUBLIC_APP_NAME=NextEnterpriseApp

Never commit `.env.local`.

------------------------------------------------------------------------

# Development Workflow

    main
    │
    ├── develop
    │   ├── feature/auth
    │   ├── feature/users
    │   └── feature/books
    │
    └── hotfix/*

------------------------------------------------------------------------

# Installation

    git clone <repo>
    cd project
    npm install

------------------------------------------------------------------------

# Run Development Server

    npm run dev

------------------------------------------------------------------------

# Production Build

    npm run build
    npm start

------------------------------------------------------------------------

# Recommended Stack

  Tool          Purpose
  ------------- --------------
  Next.js       Framework
  TypeScript    Type safety
  Axios         API requests
  React Query   Data caching
  Zod           Validation
  TailwindCSS   UI styling

------------------------------------------------------------------------

# Code Quality

Recommended:

-   ESLint
-   Prettier
-   Husky
-   Lint-staged

------------------------------------------------------------------------

# Architecture Goal

This architecture ensures:

-   High performance
-   Clean code structure
-   Easy maintenance
-   Scalable features
-   AI-friendly development
-   Large team collaboration

------------------------------------------------------------------------

Maintained using modern enterprise standards for scalable Next.js
applications.
