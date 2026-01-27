# AI Editor Rules and Project Guidelines

This document outlines the technical stack and specific rules for code generation and modification within this project to ensure consistency, maintainability, and adherence to best practices.

## 1. Tech Stack Overview

This project is a modern, mobile-first financial tracking application built with the following core technologies:

*   **Framework:** React (using TypeScript).
*   **Tooling:** Vite.
*   **Styling:** Tailwind CSS (mobile-first approach is mandatory).
*   **UI Library:** shadcn/ui (built on Radix UI primitives).
*   **Routing:** React Router DOM.
*   **Data Management:** TanStack React Query for server state.
*   **Backend/Database/Auth:** Supabase.
*   **Icons:** Lucide React.
*   **Charting:** Recharts.

## 2. Library Usage Rules

| Area | Library/Tool | Rule |
| :--- | :--- | :--- |
| **UI Components** | `shadcn/ui` | Use pre-built components from `src/components/ui/` whenever possible. If a component is missing or requires significant customization, create a new component file in `src/components/`. |
| **Styling** | Tailwind CSS | All styling must be done using Tailwind CSS utility classes. Ensure all new components are responsive and prioritize mobile layouts. |
| **Icons** | `lucide-react` | Use this package for all icons. |
| **Data Fetching** | `useQuery`, `useMutation` (TanStack Query) | Use React Query for managing all asynchronous data operations (fetching, adding, deleting transactions). |
| **Database/Auth** | Supabase | Use the client exported from `@/integrations/supabase/client` for all interactions with the database and authentication services. |
| **Notifications** | `sonner` | Use the `toast` utility from `sonner` for all user feedback (success, error messages). |
| **Date Handling** | `date-fns` | Use `date-fns` for all date manipulation and formatting (e.g., `format`, `addMonths`, `subMonths`). |
| **Routing** | `react-router-dom` | Use React Router for navigation. Keep the main route definitions in `src/App.tsx`. |

## 3. Code Structure and Conventions

*   **File Structure:**
    *   Pages must reside in `src/pages/`.
    *   Components must reside in `src/components/`.
    *   Custom hooks must reside in `src/hooks/`.
*   **Component Creation:** Every new component or hook must be created in its own dedicated file. Do not add new components to existing files.
*   **Code Quality:** Prioritize simplicity, elegance, and readability. Avoid over-engineering.
*   **Error Handling:** Do not use `try/catch` blocks unless specifically requested; allow errors to bubble up for centralized handling (e.g., via React Query error callbacks or global error boundaries).