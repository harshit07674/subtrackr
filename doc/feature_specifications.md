# Feature Specifications: SubTrackr Expansion Plan

This document details the selected features for the **SubTrackr** expansion. The features are organized in a logical, flow-wise progression: starting with **Foundation & Settings**, moving through **Data Entry & Integration**, **Data Organization**, **Visual Analytics**, and ending with **Alerts & Portability**.

---

## Flow 1: Foundation & Settings (System Behavior Configuration)

### 1.1 User Settings: Primary Currency & Default Notification Days
- **Description**: Add a User Settings/Preferences view to the user profile.
  - **Primary Currency**: Allows the user to select their default display currency (e.g., USD, EUR, INR, GBP). All dashboard metrics, KPI panels, and chart expenses will automatically convert and display in this selected primary currency.
  - **Default Notification Days**: A configurable preference determining how many days before renewal the user wants to receive alerts (e.g., 1 day, 3 days, 7 days before).
- **Logical Flow**: Configured at user onboarding or settings edit $\rightarrow$ Saved to user schema $\rightarrow$ Drives calculations and notification scheduling.

### 1.2 Live Currency Exchange Rates Integration
- **Description**: Replace the hardcoded exchange rate dictionary with a background service integrating a public conversion API (e.g., Frankfurter API). The backend will fetch conversion rates daily for supported currencies (USD, EUR, GBP, AUD, CAD, JPY, INR) and cache them in a MongoDB database model.
- **Logical Flow**: Triggered daily via cron $\rightarrow$ Updates `ExchangeRates` model $\rightarrow$ Used by the backend when calculating dashboard metrics and monthly equivalent costs.

---

## Flow 2: Data Entry & Integration (Onboarding Subscriptions)

### 2.1 Pre-Populated Service Catalog
- **Description**: A local library of popular subscription services (e.g., Netflix, Spotify, ChatGPT, GitHub, AWS, Google One). Selecting a service from this catalog auto-populates the service name, category, default pricing options, logo/icon color, and notes.
- **Logical Flow**: User clicks "Add Subscription" $\rightarrow$ Type-ahead search of pre-populated catalog $\rightarrow$ User selects a service $\rightarrow$ Form fields auto-populate.

### 2.2 External Subscription Usage Tracking API
- **Description**: For compatible catalog entries that expose developer usage APIs (e.g., GitHub API, OpenAI billing/usage API, AWS CloudWatch, etc.), users can optionally input their API keys or authenticate via OAuth. A background service will fetch actual usage data (e.g., API tokens consumed, hours used, data transferred) and display usage statistics on the subscription details page.
  - **Value**: Helps users detect under-utilized subscriptions (e.g., "You have paid $20 for ChatGPT this month but only used 2 queries").
- **Logical Flow**: Subscription added from catalog $\rightarrow$ Toggle "Track Usage" $\rightarrow$ Input credentials $\rightarrow$ Scheduled background worker fetches usage $\rightarrow$ Details page displays usage charts and alerts if usage is critically low.

### 2.3 CSV Bulk Import
- **Description**: A bulk import mechanism allowing users to upload a CSV file containing their existing subscriptions. The system validates the CSV formatting (columns like `serviceName`, `price`, `currency`, `billingCycle`, `renewalDate`, `paymentMethod`) and adds them all to the user's active workspace.
- **Logical Flow**: Click "Import CSV" on dashboard $\rightarrow$ Upload CSV $\rightarrow$ Preview data grid & resolve errors $\rightarrow$ Save bulk subscriptions to database.

---

## Flow 3: Data Organization (Workspaces)

### 3.1 Separate Workspaces (Personal vs. Business)
- **Description**: Workspaces provide account partitioning. A user can create and toggle between workspaces (e.g., "Personal", "Work", "SaaS Startup"). Subscriptions, dashboard analytics, charts, alerts, and settings are fully isolated per workspace.
- **Logical Flow**: User logs in $\rightarrow$ Toggles active workspace in the sidebar $\rightarrow$ Dashboard displays data filtered by `workspaceId`.

---

## Flow 4: Visual Analytics & Forecasting (Consuming Data)

### 4.1 Spending Trends Chart
- **Description**: An interactive line or bar chart showing the user's historical spend month-over-month. It visualizes whether subscription costs are growing or shrinking over time.
- **Logical Flow**: Dashboard mounts $\rightarrow$ Fetch monthly historical sum endpoints $\rightarrow$ Render time-series chart.

### 4.2 Expenses by Payment Group
- **Description**: A visual distribution or table listing subscription costs grouped by payment method (e.g., Visa card ending in 4242, PayPal account, Apple Pay). 
  - **Value**: Helps users ensure they have enough funds on specific payment cards/accounts before renewal dates.
- **Logical Flow**: Dashboard analytics fetch $\rightarrow$ Group by `paymentMethod` $\rightarrow$ Render progress bars or tables indicating percentage and currency totals per card.

### 4.3 Category Breakdown Pie Chart
- **Description**: An interactive pie/donut chart showing the percentage and amount of spending across categories (e.g., Entertainment: 40%, DevOps: 30%, Utilities: 30%).
- **Logical Flow**: Dashboard analytics fetch $\rightarrow$ Group by `category` $\rightarrow$ Render SVG donut chart.

### 4.4 Future Cost Projections (Cash Flow Forecasting)
- **Description**: A cash-flow forecast showing upcoming subscription charges over the next 30 days, 6 months, and 12 months. It handles recurring frequencies (daily, weekly, monthly, yearly) and accounts for free trials rolling into paid cycles.
- **Logical Flow**: Dashboard calculates renewal timelines based on dates and frequencies $\rightarrow$ Projects daily cash-outflows $\rightarrow$ Renders an interactive bar chart of future projections.

---

## Flow 5: Alerts & Portability (Actionable Features)

### 5.1 Native Push Notifications
- **Description**: Integrates native browser push notifications via Web Push API and Service Workers. If the user grants permission, they will receive native OS notifications directly on their device before a subscription renews or a free trial expires, in addition to the daily email.
- **Logical Flow**: Service worker requests push token $\rightarrow$ Saves subscription token to database $\rightarrow$ Daily cron job fires $\rightarrow$ Pushes payload to browser push endpoints.

### 5.2 CSV / PDF Export
- **Description**: Enables users to export their subscription inventories.
  - **CSV Export**: A raw data spreadsheet useful for local Excel/Google Sheets tracking.
  - **PDF Export**: A beautifully styled financial statement summarizing the active workspace's monthly/yearly spend, category distributions, and upcoming renewal schedule.
- **Logical Flow**: Click "Export" $\rightarrow$ Client or server compiles active workspace data $\rightarrow$ Generates CSV string or PDF stream $\rightarrow$ Triggers browser download.
