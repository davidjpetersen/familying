# Backend Structure Document for Familying.org

## Table of Contents
1. [Endpoints](#endpoints)
2. [Controllers and Services](#controllers-and-services)
3. [Database Schema](#database-schema)
4. [Data Flow](#data-flow)
5. [Third-party Integrations](#third-party-integrations)
6. [State Management Logic](#state-management-logic)
7. [Error Handling](#error-handling)
8. [API Documentation](#api-documentation)

---

## Endpoints

### User Management
- **POST /api/auth/register**
  - **Description:** Register a new user
  - **Request:** `{ "email": "user@example.com", "password": "securepassword" }`
  - **Response:** `{ "userId": "12345", "token": "jwt-token" }`

- **POST /api/auth/login**
  - **Description:** User login
  - **Request:** `{ "email": "user@example.com", "password": "securepassword" }`
  - **Response:** `{ "userId": "12345", "token": "jwt-token" }`

- **GET /api/auth/logout**
  - **Description:** Logout the current user
  - **Response:** `{ "message": "Logout successful" }`

- **GET /api/user/profile**
  - **Description:** Get user profile
  - **Response:** `{ "userId": "12345", "name": "John Doe", "email": "user@example.com" }`

### Content Management
- **GET /api/content/book-summaries**
  - **Description:** Fetch book summaries
  - **Response:** `[ { "id": "1", "title": "Parenting Book", "summary": "..." }, ... ]`

- **POST /api/content/meal-planner**
  - **Description:** Generate meal plan
  - **Request:** `{ "preferences": ["vegan", "gluten-free"] }`
  - **Response:** `{ "planId": "67890", "meals": [ { "day": "Monday", "recipe": "..." }, ... ] }`

### Subscription Management
- **POST /api/subscription/subscribe**
  - **Description:** Subscribe to a plan
  - **Request:** `{ "planId": "premium", "paymentMethod": "credit-card" }`
  - **Response:** `{ "subscriptionId": "sub_12345", "status": "active" }`

### Analytics and Tracking
- **GET /api/analytics/event**
  - **Description:** Track user event
  - **Request:** `{ "event": "page_view", "metadata": { "page": "home" } }`
  - **Response:** `{ "status": "tracked" }`

---

## Controllers and Services

### Controllers
- **AuthController:** Handles authentication endpoints (register, login, logout).
- **UserController:** Manages user-related endpoints (profile, settings).
- **ContentController:** Retrieves and manages content resources (books, meal plans).
- **SubscriptionController:** Manages subscription plan enrollment and status checks.
- **AnalyticsController:** Handles user event tracking and reporting.

### Services
- **AuthService:** Handles business logic for authentication and token management.
- **UserService:** Manages user data retrieval and updates.
- **ContentService:** Fetches and processes content data from the database.
- **SubscriptionService:** Handles subscription logic, integration with payment gateway.
- **AnalyticsService:** Processes and stores analytics events.

### Interactions
- Controllers interact with Services to execute business logic.
- Services access the Database and external APIs for data operations.

---

## Database Schema

### Users Table
- **Fields:**
  - `id` (UUID, Primary Key)
  - `email` (String, Unique)
  - `passwordHash` (String)
  - `name` (String)
  - `createdAt` (Timestamp)
  - `updatedAt` (Timestamp)

### Content Table
- **Fields:**
  - `id` (UUID, Primary Key)
  - `type` (String)
  - `data` (JSON)
  - `createdAt` (Timestamp)
  - `updatedAt` (Timestamp)

### Subscriptions Table
- **Fields:**
  - `id` (UUID, Primary Key)
  - `userId` (UUID, Foreign Key)
  - `planId` (String)
  - `status` (String)
  - `startedAt` (Timestamp)
  - `endedAt` (Timestamp)

### Relationships
- Users can have multiple Subscriptions.
- Content can be linked to multiple types (e.g., book summaries, meal plans).

---

## Data Flow

1. **Request Initiation:** Client sends a request to the appropriate endpoint.
2. **Controller Handling:** The request is routed to the corresponding controller.
3. **Service Execution:** Controller calls the relevant service to execute business logic.
4. **Database Interaction:** Service interacts with the database to fetch or update data.
5. **Response Generation:** Service returns data to the controller, which formats it into a response.
6. **Response Delivery:** Controller sends the response back to the client.

---

## Third-party Integrations

- **Payment Gateway:** Stripe for handling subscriptions and payments.
- **Email Services:** SendGrid for email notifications and lifecycle emails.
- **Analytics:** Google Analytics and Posthog for tracking user interactions and events.
- **Realtime Database & Auth:** Supabase for authentication and real-time data updates.

---

## State Management Logic

- **Session Management:** JWT tokens for user sessions, stored in HTTP-only cookies.
- **Caching Strategies:** Redis for caching frequently accessed data.
- **Queues:** Background job queues (e.g., BullMQ) for processing tasks like email sending.
- **Session Expiry:** Tokens have a defined expiry; refresh tokens extend session without re-login.

---

## Error Handling

- **Error Catching:** Try-catch blocks and middleware for capturing errors.
- **Error Logging:** Errors logged using a centralized logging service (e.g., Loggly).
- **Error Response:** Standardized error messages returned to clients with appropriate HTTP status codes (e.g., 400 for bad requests, 500 for server errors).

---

## API Documentation

- **Format:** OpenAPI 3.0/Swagger
- **Documentation Includes:**
  - **Endpoint List:** Comprehensive list with paths, methods, and descriptions.
  - **Request/Response Models:** Detailed schemas for request and response payloads.
  - **Auth Requirements:** Descriptions of authentication methods and token usage.
  - **Error Codes:** List of possible error codes and their meanings.
- **Hosting:** API docs hosted and dynamically updated with tools like Swagger UI.

---

This document outlines the backend structure for Familying.org, detailing the API endpoints, services, data management, and integrations that power the platform. The architecture is designed to be scalable, secure, and adaptable to the evolving needs of modern families.