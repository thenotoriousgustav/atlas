# Product Requirements Document (PRD)
**Project Name:** Cabinet Expense & Subscription Tracker
**Date:** July 2026
**Document Version:** 1.0

## 1. Overview
The **Cabinet Expense & Subscription Tracker** is a new feature module integrated directly into the existing "Cabinet" web application. It aims to provide users with a streamlined, intuitive way to manually track their daily financial transactions, manage personal budgets, and keep a close eye on recurring subscription costs. 

## 2. Target Audience
**Primary Users:** Individuals seeking personal financial management.
**Use Cases:** 
- Tracking daily expenses and income.
- Managing personal budgets.
- Monitoring recurring subscriptions to avoid unwanted auto-renewals.

## 3. Core Features (MVP)

### 3.1. Expense & Income Tracking
- **Manual Data Entry:** Users can manually add expenses or income.
- **Categorization:** Support for customizable categories (e.g., Food, Transport, Utilities) and tags.
- **Date Selection:** Ability to log transactions for past, current, or future dates.

### 3.2. Subscription Management
- **Manual Entry:** Users can input subscription details including the service name, cost, and billing cycle (monthly, yearly, weekly).
- **Upcoming Renewals Dashboard:** A dedicated view showing which subscriptions are renewing soon.
- **Reminders:** Visual notifications/reminders for upcoming renewals to help users decide whether to keep or cancel a service.

### 3.3. Dashboard & Data Visualization
- **Monthly Breakdown:** A pie or donut chart displaying expense distribution across different categories for the current month.
- **Subscription Overview:** A clear metric showing the total active subscription cost per month/year.
- **Renewal Timeline:** A timeline or chronological list of upcoming subscription renewals.

## 4. Architecture & Technical Integration

- **Platform:** Web Application (Responsive design for both Desktop and Mobile browsers).
- **Integration:** Built as a new feature/route within the existing `@atlas/cabinet` Next.js application.
- **Authentication:** Reuses the existing Cabinet JWT/cookie-based authentication system.
- **UI Components:** Utilizes the shared `@atlas/ui` component library (Tailwind CSS, Radix UI) to maintain design consistency across the Cabinet ecosystem.
- **Data Fetching:** Handled via TanStack Query and the existing `api-client` package, leveraging the Axios instance with token rotation.
- **Forms:** Handled via TanStack Form.

## 5. Non-Functional Requirements
- **Performance:** Ensure real-time or near real-time updates when adding new transactions (via optimistic updates or query invalidation).
- **Responsiveness:** The UI must be fully usable on mobile devices, ensuring data entry is quick and frictionless on the go.
- **Aesthetics:** Adhere to the established premium, minimalist design system of the Cabinet application, featuring smooth interactions, micro-animations, and a cohesive color palette.

## 6. Future Enhancements (Post-MVP)
- OCR Receipt Scanning for automated entry.
- Bank account synchronization (e.g., via Plaid) for automatic transaction imports.
- Advanced cash flow analytics and custom reporting over custom date ranges.
- Shared/Household expense tracking capabilities.
