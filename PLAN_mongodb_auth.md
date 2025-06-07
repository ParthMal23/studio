
# Plan: MongoDB & Authentication Integration for FireSync

This document outlines the steps to integrate MongoDB for persistent user-specific data storage (viewing history, preferences) and implement a basic user authentication system using NextAuth.js.

## Phase 1: Setup & Configuration

1.  **MongoDB Setup:**
    *   [ ] Create a MongoDB Atlas account (or use a local MongoDB instance).
    *   [ ] Create a new cluster and database (e.g., `firesync_db`).
    *   [ ] Get the MongoDB connection string.
    *   [ ] Configure network access (allow connections from your app's IP or 0.0.0.0/0 for development - be careful with production).

2.  **Environment Variables (`.env`):**
    *   [x] Add `MONGODB_URI="your_mongodb_connection_string"`
    *   [x] Add `NEXTAUTH_URL="http://localhost:9002"` (or your development URL) - *Important for NextAuth.js*
    *   [x] Add `NEXTAUTH_SECRET="your_strong_random_secret"` - *Generate a strong secret, e.g., using `openssl rand -base64 32`*

3.  **Install Dependencies:**
    *   [x] `npm install next-auth mongodb mongoose`
        *   `next-auth`: For handling authentication.
        *   `mongodb`: The official MongoDB Node.js driver.
        *   `mongoose`: An ODM (Object Data Modeling) library for MongoDB to define schemas and models (optional but recommended for structure).

4.  **MongoDB Connection Utility (`src/lib/mongodb.ts` or `src/lib/dbConnect.ts`):**
    *   [x] Create a utility function to connect to MongoDB.
    *   [x] Implement connection caching to reuse existing connections (important for serverless environments like Next.js API routes).

## Phase 2: Database Models (Mongoose Schemas)

1.  **User Model (`src/models/User.ts`):**
    *   [ ] Define a Mongoose schema for Users:
        *   `email` (String, required, unique, indexed)
        *   `password` (String, required) - *Will store hashed passwords*
        *   `name` (String, optional)
        *   `createdAt` (Date, default: Date.now)
        *   `updatedAt` (Date, default: Date.now)
    *   [ ] Create and export the Mongoose model.

2.  **Viewing History Model (`src/models/ViewingHistory.ts`):**
    *   [ ] Define a Mongoose schema for ViewingHistory:
        *   `userId` (mongoose.Schema.Types.ObjectId, ref: 'User', required, indexed)
        *   `title` (String, required)
        *   `rating` (Number, required)
        *   `completed` (Boolean, required)
        *   `moodAtWatch` (String, optional)
        *   `timeOfDayAtWatch` (String, optional)
        *   `tmdbId` (String or Number, optional)
        *   `contentType` (String, enum: ["MOVIES", "TV_SERIES", "BOTH"], required)
        *   `watchedAt` (Date, default: Date.now)
    *   [ ] Create and export the Mongoose model.

3.  **User Preferences Model (`src/models/UserPreference.ts`):**
    *   [ ] Define a Mongoose schema for UserPreferences:
        *   `userId` (mongoose.Schema.Types.ObjectId, ref: 'User', required, unique, indexed)
        *   `weights` (Object: `{ mood: Number, time: Number, history: Number }`)
        *   `preferredContentType` (String, enum: ["MOVIES", "TV_SERIES", "BOTH"])
        *   `updatedAt` (Date, default: Date.now)
    *   [ ] Create and export the Mongoose model.

## Phase 3: Authentication Backend (NextAuth.js)

1.  **NextAuth.js API Route (`src/app/api/auth/[...nextauth]/route.ts`):**
    *   [ ] Set up NextAuth.js options:
        *   `providers`: Use `CredentialsProvider` for email/password authentication.
        *   `session`: Configure session strategy (e.g., JWT).
        *   `callbacks`:
            *   `authorize`: Implement logic to validate user credentials against the User model in MongoDB. Compare hashed passwords using a library like `bcryptjs`.
            *   `jwt`: Include user ID and email in the JWT token.
            *   `session`: Make user ID and email available in the client-side session object.
    *   [ ] Export `GET` and `POST` handlers from this route.
    *   [ ] Install `bcryptjs` (`npm install bcryptjs @types/bcryptjs`) for password hashing.

2.  **Sign-up API Route (`src/app/api/auth/signup/route.ts`):**
    *   [ ] Create a `POST` handler.
    *   [ ] Receive `email` and `password` from the request body.
    *   [ ] Validate input (e.g., ensure email is valid, password meets complexity if desired).
    *   [ ] Check if a user with the given email already exists in MongoDB.
    *   [ ] Hash the password using `bcryptjs`.
    *   [ ] Create a new User document in MongoDB.
    *   [ ] Return a success response or error.

## Phase 4: API Endpoints for User Data

1.  **Viewing History API Routes (e.g., `src/app/api/viewing-history/route.ts` and `src/app/api/viewing-history/[id]/route.ts`):**
    *   [ ] `GET /api/viewing-history`:
        *   Get the current user's ID from the NextAuth.js session.
        *   Fetch all viewing history entries for that `userId` from MongoDB.
        *   Return the history.
    *   [ ] `POST /api/viewing-history`:
        *   Get the current user's ID.
        *   Receive history item data from the request body.
        *   Create a new ViewingHistory document in MongoDB associated with the `userId`.
        *   Return the created item or success.
    *   [ ] `DELETE /api/viewing-history/[id]`:
        *   Get the current user's ID.
        *   Ensure the history item with `[id]` belongs to the current user.
        *   Delete the item from MongoDB.
        *   Return success or error.

2.  **User Preferences API Routes (e.g., `src/app/api/user-preferences/route.ts`):**
    *   [ ] `GET /api/user-preferences`:
        *   Get the current user's ID.
        *   Fetch preferences for that `userId` from MongoDB.
        *   Return preferences.
    *   [ ] `POST` (or `PUT`) `/api/user-preferences`:
        *   Get the current user's ID.
        *   Receive preference data.
        *   Create or update the UserPreference document for that `userId` in MongoDB.
        *   Return success or updated preferences.

## Phase 5: Frontend Integration - Authentication UI & State

1.  **NextAuth.js Session Provider (`src/app/layout.tsx` or a new `src/components/Providers.tsx`):**
    *   [ ] Wrap the application with `<SessionProvider>` from `next-auth/react`.

2.  **Sign-up Page/Component (`src/app/signup/page.tsx`):**
    *   [ ] Create a form for email and password.
    *   [ ] On submit, call the `/api/auth/signup` endpoint.
    *   [ ] Handle success (e.g., redirect to login) and errors (display messages).

3.  **Login Page/Component (`src/app/login/page.tsx`):**
    *   [ ] Create a form for email and password.
    *   [ ] On submit, use `signIn('credentials', { email, password, redirect: false })` from `next-auth/react`.
    *   [ ] Handle success (e.g., redirect to home page) and errors (display messages).

4.  **Navigation & UI Updates:**
    *   [ ] Use `useSession()` hook from `next-auth/react` to get session status (`data: session, status`).
    *   [ ] Conditionally show "Login", "Sign-up" links or "Logout" button and user info based on session status.
    *   [ ] Implement a "Logout" button that calls `signOut()` from `next-auth/react`.
    *   [ ] Update `AppHeader` or create a new navigation component.

## Phase 6: Frontend Integration - Data Management

1.  **Modify `src/app/page.tsx`:**
    *   [ ] On component mount (and if user is authenticated):
        *   Fetch viewing history from `/api/viewing-history` instead of `localStorage`.
        *   Fetch user preferences from `/api/user-preferences` instead of `localStorage`.
    *   [ ] When adding/removing viewing history:
        *   Call the respective API endpoints instead of updating `localStorage`.
    *   [ ] When updating preferences (mood, time, content type, weights):
        *   Call `/api/user-preferences` to save changes.

2.  **Modify `fetchContentRecommendationsAction` and `analyzeWatchPatternsAction` (`src/lib/actions.ts`):**
    *   [ ] These server actions will now need to be aware of the authenticated user.
    *   [ ] Get the user's session (e.g., using `getServerSession` from `next-auth`).
    *   [ ] Fetch `viewingHistory` and `userPreferences` from MongoDB using the `userId` from the session, instead of receiving them as parameters directly from the client.
    *   The client will only pass parameters like `currentMood` and `currentTime`.

## Phase 7: Security & Refinements

1.  **Input Validation:**
    *   [ ] Add robust server-side validation for all API inputs (e.g., using Zod).
2.  **Password Security:**
    *   [ ] Ensure `bcryptjs` is used correctly for hashing and comparison.
3.  **Error Handling:**
    *   [ ] Implement consistent error handling and user feedback for API calls and auth actions.
4.  **Protecting API Routes:**
    *   [ ] Ensure all data API routes check for an authenticated session and only allow users to access/modify their own data.
5.  **CSRF Protection:**
    *   NextAuth.js handles CSRF protection for its own routes; review if custom API routes need explicit protection.
6.  **UI/UX Refinements:**
    *   Loading states for login/signup.
    *   Clear error messages.
    *   Smooth transitions between authenticated and unauthenticated states.

This plan is quite comprehensive. We can tackle each phase and its sub-steps one by one. Let me know which part you'd like to start with!
