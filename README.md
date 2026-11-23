# Loan Application Review Dashboard

A React + TypeScript dashboard for reviewing loan applications. It supports server-side pagination, searching, filtering, sorting, status updates, and simulated live updates.

## 1. Getting Started

### Prerequisites
- Node.js
- npm

### Installation

```bash
git clone https://github.com/ShihabPalekar/loan-application-reviews.git
cd loan-application-reviews
npm install
npm run dev
```

Open the local URL displayed in your terminal (usually `http://localhost:5173`).

## 2. Key Technical Decisions

- **React + TypeScript + Vite:** Chosen for a lightweight frontend setup with type safety.
- **Custom React hook (`useApplications`):** Kept API interactions, loading/error states, and application status updates separate from the page UI.
- **URL-based state:** Search, status filters, sorting, and pagination are reflected in URL query parameters so the state survives refreshes and supports browser Back/Forward navigation.
- **Server-side pagination and filtering:** Used the provided mock API instead of fetching all applications and filtering them on the client.
- **Optimistic updates:** Application status changes are reflected immediately. If the API request fails, the original status is restored and an error is displayed.
- **Subscription-based updates:** Used the provided `subscribe()` API to simulate real-time updates without implementing an actual WebSocket connection.
- **Request tracking:** Used request IDs to prevent older API responses from overwriting newer results.

## 3. AI Usage and Collaboration

I used AI as a co-engineer throughout the development process, rather than asking it to generate the entire application in one go.

My approach was:

1. Uploaded the entire problem statement intially so it has the entire context.
2. Discussed the requirements with AI.
3. Broke the assignment into smaller, actionable tasks and prioritized them based on the stated requirements.
4. Implemented the application incrementally, addressing one feature at a time.
5. Used AI to understand implementation choices, discuss trade-offs, review code, debug issues, and identify edge cases.
6. Tested the changes locally and discussed unexpected behaviour before moving to the next task.

**What I changed or rejected:**
- Did not blindly accept every suggested implementation.
- Discussed alternative approaches and their trade-offs before making decisions.
- Rejected unnecessary complexity when a simpler implementation met the requirements.


## 4. Next Steps and Known Limitations

Given more time, I would:

- Improve the overall UI and responsive styling.
- Add automated tests for pagination, filtering, status updates, and API failure scenarios.
- Test more edge cases around concurrent updates and stale API responses.
- Improve handling of live updates when an application no longer matches the active filters.
- Add better UI/UX for loading, update, error states.
- Deploy the application so it can be accessed through a live URL.

**Known limitations:**
- The application uses the provided mock API; there is no real backend.
- Live updates use the provided subscription simulator, not an actual WebSocket connection.
