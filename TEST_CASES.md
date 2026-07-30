# SubTrackr — End-to-End Test Cases & Verification Document

This document provides a complete, structured test suite and step-by-step verification manual for the **SubTrackr** web application. It covers all features, edge cases, system workflows, and recent security & UI bug fixes.

---

## 📌 Document Information

- **Project**: SubTrackr (Subscription Management & Financial Analytics System)
- **Version**: 1.0.0
- **Target Audience**: QA Engineers, Developers, Testers
- **Author**: Antigravity AI Pair Programmer
- **Date**: July 30, 2026

---

## 📊 Test Suite Overview Matrix

| Suite ID | Feature Module | Test Scenarios | Priority | Focus Areas |
| :--- | :--- | :---: | :---: | :--- |
| **TS-01** | Authentication & Security | 7 | High | Registration, OTP Email, Login, Token Refresh, Password Reset |
| **TS-02** | Workspace Management | 4 | High | Multi-Tenancy Workspaces, Color Themes, Icons, Workspace Filtering |
| **TS-03** | Subscription Inventory & Catalog | 6 | High | CRUD Operations, Preset Catalog Import, Static Status Badges |
| **TS-04** | Dashboard Search & Filtering | 4 | Medium | Multi-Field Filters, Search Bar, Price & Renewal Sorting |
| **TS-05** | User Settings & Multi-Currency | 3 | Medium | Currency Normalization (`USD`, `INR`, `EUR`), Notification Lead Days |
| **TS-06** | Data Export (CSV & PDF Reports) | 4 | High | Excel Date Formula Formatting, PDF Financial Statements, Free Trials |
| **TS-07** | Analytics & Forecasting | 3 | Medium | Monthly/Yearly Trends, Category Donut Chart, Renewal Timelines |

---

## 🔐 TS-01: Authentication & Security Test Cases

### TC-1.1: User Registration & OTP Email Dispatch
- **Module**: Auth (`/register`)
- **Description**: Verify user account creation with real-time field validation, password requirements, confirm password matching, and disabled button state.
- **Preconditions**: Target email does not exist in DB.
- **Test Steps**:
  1. Open browser and navigate to `http://localhost:3000/register`.
  2. Leave fields blank.
     - **Result**: Submit button is disabled (`opacity-40 cursor-not-allowed`).
  3. Enter invalid email `johndoe@com`.
     - **Result**: Error message displays `"Please enter a valid email address"`.
  4. Type password `pass`.
     - **Result**: Password requirement checklist displays red X icons for length (8+), uppercase, number, and special character.
  5. Type strong password `SecurePass123!`.
     - **Result**: All 4 password checklist items display green checkmarks.
  6. Enter mismatched Confirm Password `DifferentPass123!`.
     - **Result**: Error message displays `"Passwords do not match"`. Submit button remains disabled.
  7. Enter matching Confirm Password `SecurePass123!`.
     - **Result**: Submit button turns active.
  8. Click **Create account**.
- **Expected Results**:
  - User record created in MongoDB with `verified: false`.
  - OTP generated and email sent.
  - Redirects to `/verify-email?email=johndoe%40example.com`.

---

### TC-1.2: Email Verification OTP Handling
- **Module**: Auth (`/verify-email`)
- **Description**: Verify OTP validation logic (Invalid vs Valid).
- **Test Steps**:
  1. Navigate to `/verify-email`.
  2. Input an invalid OTP: `999999` and submit.
     - **Result**: Error toast displays `"Invalid OTP"`.
  3. Enter the actual 6-digit OTP code received in email and submit.
- **Expected Results**:
  - Toast displays `"Email verified successfully. You can now log in."`.
  - User document `verified` field updates to `true`.
  - Redirects user to `/login`.

---

### TC-1.3: User Login & JWT Session Cookie Handling
- **Module**: Auth (`/login`)
- **Description**: Verify login restrictions for unverified vs verified accounts.
- **Test Steps**:
  1. Attempt login with an unverified account.
     - **Result**: HTTP 401 error: `"email is not verified. please verify email before attempting to login"`.
  2. Enter credentials for a verified account and click **Sign in**.
- **Expected Results**:
  - HTTP 201 response returned.
  - Short-lived Access Token (15-min JWT) returned in JSON payload.
  - Long-lived Refresh Token (7-day JWT) stored in secure HTTP-Only cookie.
  - Redirects user to `/dashboard`.

---

### TC-1.4: Forgot Password — Non-Existent Email Error Handling (Fixed Bug)
- **Module**: Auth (`/forgot-password`)
- **Description**: Verify backend returns HTTP 404 when requesting a password reset for an unregistered email.
- **Test Steps**:
  1. Navigate to `/forgot-password`.
  2. Enter an email address that does **not** exist in the system (e.g., `unknown_user_99@gmail.com`).
  3. Click **Send reset link**.
- **Expected Results**:
  - API returns HTTP 404 status code with message: `"User with this email does not exist"`.
  - UI displays red error toast: `"User with this email does not exist"`.
  - No email is sent.

---

### TC-1.5: Forgot Password — Registered User Link Generation
- **Module**: Auth (`/forgot-password`)
- **Description**: Verify reset link generation for existing accounts.
- **Test Steps**:
  1. Navigate to `/forgot-password`.
  2. Enter a registered email address and submit.
- **Expected Results**:
  - Unused reset tokens for the user are cleared from `password_resets` collection.
  - New 32-character random token is generated; SHA-256 hash stored in DB with 10-minute expiry.
  - Reset email containing link `/reset-password?token=<PLAIN_TOKEN>` is dispatched.
  - UI displays confirmation message: `"If johndoe@example.com is registered, you'll receive a reset link shortly."`.

---

### TC-1.6: Password Reset Execution
- **Module**: Auth (`/reset-password`)
- **Description**: Verify resetting password via email link token.
- **Test Steps**:
  1. Open reset URL with plain token parameter (`/reset-password?token=<PLAIN_TOKEN>`).
  2. Enter new password: `NewSecretPass456!`.
  3. Click **Reset Password**.
- **Expected Results**:
  - Token hash is validated against DB.
  - User password in DB is updated with new crypt hash.
  - Used token is deleted from DB.
  - User can log in with new password.

---

### TC-1.7: Refresh Token Rotation & Session Renewal
- **Module**: Auth (`/api/auth/refresh`)
- **Description**: Verify automatic session renewal when access token expires.
- **Test Steps**:
  1. Log into `/dashboard`.
  2. Wait for access token expiration (3 days) or purge local state.
  3. Reload dashboard page.
- **Expected Results**:
  - Next.js app sends background GET to `/api/auth/refresh` sending the HTTP-Only cookie.
  - Backend verifies session, rotates refresh token hash, issues new access token.
  - User remains logged in seamlessly without interruption.

---

### TC-1.8: Session Expiration & Automatic Redirection to Login (Fixed)
- **Module**: Auth & Interceptor (`api.ts` & `AuthContext.tsx`)
- **Description**: Verify automatic redirection to `/login` when a user's session is expired or revoked.
- **Test Steps**:
  1. Log into `/dashboard`.
  2. Purge or invalidate the refresh token cookie (or wait for 7-day session expiry).
  3. Trigger an API action on the dashboard or reload.
- **Expected Results**:
  - Axios interceptor catches 401/403 and attempts silent refresh.
  - Refresh fails -> `sessionExpiredHandler` triggers.
  - Displays toast: `"Session expired. Please log in again."`.
  - AuthContext clears user & token state (`setUser(null)`).
  - Browser automatically redirects to `http://localhost:3000/login`.

---

## 📁 TS-02: Workspace Management Test Cases

### TC-2.1: Create Custom Workspace
- **Module**: Workspaces (`/dashboard`)
- **Description**: Create a workspace with custom category, theme, and icon.
- **Test Steps**:
  1. On dashboard, click **+ New Workspace**.
  2. Fill out details:
     - **Name**: `Freelance SaaS`
     - **Category**: `Development & Design`
     - **Theme Color**: Violet (`#8b5cf6`)
     - **Icon**: `Briefcase`
  3. Click **Create Workspace**.
- **Expected Results**:
  - Workspace added to user profile in MongoDB.
  - Workspace card rendered in top slider showing `0 subs` and `$0.00/mo`.

---

### TC-2.2: Workspace Master View & Filtering
- **Module**: Workspaces (`/dashboard`)
- **Description**: Switch between workspace-specific subscription views.
- **Test Steps**:
  1. Click **All Workspaces** master card.
     - **Result**: Displays all subscriptions across all workspaces.
  2. Click `Freelance SaaS` workspace card.
- **Expected Results**:
  - Card displays active border highlight and `"Active Filter"` badge.
  - Subscription list filters to display only items belonging to `Freelance SaaS`.

---

### TC-2.3: Edit Workspace Metadata
- **Module**: Workspaces (`/dashboard`)
- **Description**: Update workspace properties.
- **Test Steps**:
  1. Click external link icon or edit option on workspace card.
  2. Rename workspace to `Agency Client Tools`.
  3. Save changes.
- **Expected Results**:
  - Workspace title updates instantly across dashboard slider and detail page.

---

### TC-2.4: Delete Workspace
- **Module**: Workspaces (`/dashboard`)
- **Description**: Delete workspace and manage linked subscriptions.
- **Test Steps**:
  1. Click delete workspace button.
  2. Confirm confirmation modal.
- **Expected Results**:
  - Workspace deleted from database.
  - Dashboard view reverts to **All Workspaces**.

---

## 💳 TS-03: Subscription Inventory & Catalog Test Cases

### TC-3.1: Quick Add via Service Catalog Preset
- **Module**: Subscriptions (`/dashboard`)
- **Description**: Add subscription using built-in SaaS catalog templates.
- **Test Steps**:
  1. Click **+ Add Subscription**.
  2. Click on `Notion Pro` catalog item.
- **Expected Results**:
  - Service Name (`Notion`), Category (`Productivity`), Price (`$16.00`), Cycle (`Monthly`) pre-filled automatically.
  - User selects workspace and saves.

---

### TC-3.2: Create Custom Subscription
- **Module**: Subscriptions (`/dashboard`)
- **Description**: Manually enter subscription details.
- **Test Steps**:
  1. Click **+ Add Subscription** -> **Custom**.
  2. Enter:
     - **Service Name**: `AWS EC2 Server`
     - **Category**: `Cloud Infrastructure`
     - **Price**: `120.00`, **Currency**: `USD`
     - **Billing Cycle**: `Monthly`
     - **Renewal Date**: Set to 15 days from today
     - **Payment Method**: `Credit Card`
     - **Free Trial**: Check box
  3. Click **Save Subscription**.
- **Expected Results**:
  - Subscription card created in workspace grid.
  - Renewal status badge displays `15 days left`.
  - Sparkle badge displays `Free Trial`.

---

### TC-3.3: Static Status Badge Display (Verified UI Fix)
- **Module**: Subscriptions (`/dashboard`)
- **Description**: Verify subscription cards render static status badge without interactive select dropdown.
- **Test Steps**:
  1. View subscription cards on `/dashboard`.
- **Expected Results**:
  - Status renders cleanly as a static badge (`Active` in green, `Paused` in yellow, `Cancelled` in red).
  - No dropdown `<select>` element overlaying the badge.

---

### TC-3.4: Edit Subscription Details
- **Module**: Subscriptions (`/dashboard`)
- **Description**: Modify existing subscription parameters.
- **Test Steps**:
  1. Click pencil icon on `AWS EC2 Server` card.
  2. Change price to `150.00` and status to `Paused`.
  3. Click **Save Changes**.
- **Expected Results**:
  - Card updates immediately without page refresh.
  - Status badge changes to `Paused` (amber background).

---

### TC-3.5: Subscription Detail Page View
- **Module**: Subscriptions (`/dashboard/subscription/[id]`)
- **Description**: View individual subscription breakdown.
- **Test Steps**:
  1. Click **View details & stats** at bottom of card.
- **Expected Results**:
  - Opens dedicated page displaying annual cost breakdown, payment history timeline, renewal alerts, and notes.

---

### TC-3.6: Delete Subscription
- **Module**: Subscriptions (`/dashboard`)
- **Description**: Delete subscription item.
- **Test Steps**:
  1. Click trash icon on card.
  2. Confirm deletion popup.
- **Expected Results**:
  - Item removed from DB.
  - Total Monthly Spend and Subscription Count KPIs update immediately.

---

## 🔍 TS-04: Dashboard Search & Filtering Test Cases

### TC-4.1: Live Search by Service Name
- **Module**: Dashboard
- **Description**: Filter items by typing search string.
- **Test Steps**:
  1. Enter `AWS` in search bar.
- **Expected Results**:
  - Subscriptions grid updates instantly to show only matching services (`AWS EC2 Server`).

---

### TC-4.2: Multi-Field Filter Criteria
- **Module**: Dashboard
- **Description**: Combine category, status, and billing cycle filters.
- **Test Steps**:
  1. Open Filters panel.
  2. Select **Status** = `Active`, **Category** = `Cloud Infrastructure`, **Billing Cycle** = `Monthly`.
- **Expected Results**:
  - Displays only subscriptions matching ALL selected criteria.

---

### TC-4.3: Price & Renewal Sorting
- **Module**: Dashboard
- **Description**: Sort list by price or renewal date.
- **Test Steps**:
  1. Select **Sort By** = `Price`, **Order** = `Descending`.
- **Expected Results**:
  - Subscription with highest price appears first in list.

---

### TC-4.4: Reset Filters
- **Module**: Dashboard
- **Description**: Clear active filters.
- **Test Steps**:
  1. Click **Clear Filters** button.
- **Expected Results**:
  - All dropdowns reset; complete subscription inventory displays.

---

## ⚙️ TS-05: User Settings & Multi-Currency Test Cases

### TC-5.1: Primary Currency Update & Normalization
- **Module**: Settings Modal
- **Description**: Change user primary currency preference.
- **Test Steps**:
  1. Open Settings Modal from sidebar.
  2. Change Primary Currency to `INR` (Indian Rupee).
  3. Click **Save Settings**.
- **Expected Results**:
  - User preference updated in database.
  - Dashboard KPIs and workspace spending totals format values with `₹` / `INR` symbol.

---

### TC-5.2: Multi-Currency Live Conversion
- **Module**: Backend Analytics & KPIs
- **Description**: Convert subscriptions in `USD`, `EUR`, and `INR` into primary currency.
- **Test Steps**:
  1. Add Sub 1: `$10.00 USD/mo`.
  2. Add Sub 2: `₹1,000.00 INR/mo`.
  3. View **Est. Monthly Spend** KPI when primary currency is `INR`.
- **Expected Results**:
  - Backend applies exchange rates (e.g. $10 USD ≈ ₹835 INR) and displays total spend normalized in `INR` (`₹1,835.00`).

---

### TC-5.3: Notification Lead Days Customization
- **Module**: Settings Modal
- **Description**: Customize renewal alert lead days.
- **Test Steps**:
  1. Open Settings Modal -> Set **Default Renewal Alert Lead Days** to `5 days`.
  2. Click **Save Settings**.
- **Expected Results**:
  - Saved to user profile; alerts trigger 5 days before renewal dates.

---

## 📄 TS-06: Data Export (CSV & PDF Reports) Test Cases

### TC-6.1: CSV Export Excel Compatibility (Fixed Date Formula Formatting)
- **Module**: Export Modal
- **Description**: Verify CSV download formatting in Microsoft Excel.
- **Test Steps**:
  1. Open Export Modal -> Click **Download CSV**.
  2. Open `subtrackr_all_subscriptions.csv` in Microsoft Excel.
- **Expected Results**:
  - Headers: `Service Name, Category, Price, Currency, Billing Cycle, Renewal Date, Payment Method, Status, Free Trial, Notes`.
  - Renewal dates formatted as `="2026-08-15"`.
  - Excel displays dates cleanly (`2026-08-15`) without showing `########`.

---

### TC-6.2: PDF Financial Statement — Currency Symbol Normalization (Fixed)
- **Module**: Export Modal
- **Description**: Verify PDF statement formats Est. Monthly Spend in user primary currency.
- **Test Steps**:
  1. Set primary currency to `INR`.
  2. Open Export Modal -> Click **Generate PDF**.
- **Expected Results**:
  - PDF header title: `SubTrackr Financial Statement`.
  - **Est. Monthly Spend** KPI displays `₹7,535.49` (or `INR 7,535.49`) using user currency instead of hardcoded `$`.

---

### TC-6.3: PDF Financial Statement — Free Trials KPI Card (Fixed)
- **Module**: Export Modal
- **Description**: Verify PDF report includes Free Trials count KPI card.
- **Test Steps**:
  1. Open Export Modal -> Click **Generate PDF**.
  2. Inspect summary KPI grid row in printed document.
- **Expected Results**:
  - Summary grid contains 4 KPI cards:
    1. **Est. Monthly Spend**
    2. **Total Subscriptions**
    3. **Active Subscriptions**
    4. **Free Trials** (Count of subscriptions where `isFreeTrial` is true).

---

### TC-6.4: PDF Financial Statement — Table Notes Column (Fixed)
- **Module**: Export Modal
- **Description**: Verify PDF statement table includes Notes column.
- **Test Steps**:
  1. Inspect subscription table in generated PDF.
- **Expected Results**:
  - Table headers: `Service | Category | Price | Cycle | Renewal Date | Payment Method | Status | Notes`.
  - Notes column displays notes content or `-` if empty.

---

## 📊 TS-07: Analytics & Forecasting Test Cases

### TC-7.1: Monthly Spend Overview Charting
- **Module**: Analytics View
- **Description**: Verify monthly spend trend chart.
- **Test Steps**:
  1. Switch to **Analytics & Cash Flow Forecasting** tab on dashboard.
- **Expected Results**:
  - Interactive SVG bar chart renders monthly breakdown with previous month comparison bars.

---

### TC-7.2: Category Spending Distribution
- **Module**: Analytics View
- **Description**: Verify category percentage donut chart.
- **Test Steps**:
  1. View Spend by Category donut chart in Analytics view.
- **Expected Results**:
  - Donut ring displays colored segments for Entertainment, Productivity, Dev Tools, and Other.

---

### TC-7.3: Renewal Cash Flow Timeline
- **Module**: Analytics View
- **Description**: View upcoming renewal obligations.
- **Test Steps**:
  1. Inspect Renewal Timeline panel in Analytics view.
- **Expected Results**:
  - Lists subscriptions due within the next 7 days, 30 days, and 90 days with renewal costs.

---

## 🚀 Execution Summary

To run all automated verification builds for this project:

```powershell
# Frontend Verification
cd d:\authentication_tut\frontend
npm run build

# Backend Node Verification
cd d:\authentication_tut\backend
node server.js
```
