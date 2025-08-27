# Familying.org Tech Stack Document

## Frontend Frameworks

### Next.js
- **Version**: 13.x
- **Configuration**: Utilizes Next.js for server-side rendering (SSR) and static site generation (SSG) features to optimize performance and SEO. The application's front-end architecture supports dynamic routing and API routes for seamless integration with backend services.

### React
- **Version**: 18.2
- **Configuration**: React is employed for building the UI components, leveraging hooks and context for state management and lifecycle methods for component logic.

### Tailwind CSS
- **Version**: 3.0
- **Configuration**: Tailwind CSS is used for styling, providing a utility-first approach that enables rapid design implementation and ensures a consistent look and feel across the platform.

## Backend Frameworks

### Node.js
- **Version**: 18.x
- **Configuration**: Node.js is used as the runtime environment for executing JavaScript on the server, supporting the micro-service architecture.

### Supabase
- **Components**: 
  - **Supabase Auth**: Provides authentication services.
  - **Supabase Realtime**: Supports real-time data synchronization.
- **Configuration**: Utilized for its PostgreSQL database capabilities, real-time subscriptions, and built-in authentication features.

## Database

### PostgreSQL (via Supabase)
- **Schema Considerations**:
  - **User Profiles**: Stores user-specific data, including onboarding quiz results and personalization tags.
  - **Content Management**: Manages micro-service content like book summaries and calm kits.
  - **Role-based Access**: Implements access control mechanisms for different user roles (Parent/Guardian, Child).
- **Configuration**: Structured to optimize queries for personalized content delivery and user engagement tracking.

## Authentication

### Supabase Auth
- **Implementation**: Provides secure, scalable user authentication with support for social logins and email/password authentication.
- **Features**:
  - Role-based access control.
  - Multi-factor authentication options.
  - Compliance with data protection regulations, such as COPPA for children's data.

## DevOps/Hosting

### Vercel
- **Deployment Platform**: Hosts the frontend and enables serverless functions for backend operations.
- **CI/CD Setup**: 
  - **GitHub Actions**: Automated workflows for continuous integration and deployment, including testing, building, and deploying the application.
  - Automated deployments triggered on code commits to main branches.

## APIs or SDKs

### OpenAI API
- **Usage**: Powers personalized content recommendations and interactive features like the bedtime story generator.
- **Integration**: Connected via API calls from the backend services.

### Stripe SDK
- **Usage**: Manages subscription payments and billing.
- **Integration**: Provides secure payment processing and subscription management functionality.

## Language Choices

### TypeScript
- **Reasoning**: 
  - Provides static typing to enhance code quality and reduce runtime errors.
  - Improves developer productivity with better tooling and autocomplete features compared to JavaScript.

## Other Tools

### Development Tools
- **Turbopack**: Utilized for bundling and optimizing assets during development and build processes.
- **Vite**: Employed for fast development server start-up times and optimized builds.
- **GitHub Actions**: Configured for CI/CD pipelines to ensure code quality and streamline development workflows.

### Linters and Formatters
- **ESLint**: Enforces coding standards and identifies potential errors in the codebase.
- **Prettier**: Ensures consistent code formatting across the project.

### Testing Frameworks
- **Jest**: Utilized for unit testing to ensure code correctness and reliability.
- **Playwright**: Employed for end-to-end testing to verify user interaction flows and application behavior.

### State Management
- **Zustand**: Chosen for its minimal and flexible state management capabilities, supporting simple and scalable application state handling.

By leveraging this comprehensive tech stack, Familying.org delivers a scalable, secure, and user-friendly platform that adapts to the diverse needs of modern families.