# Solution Documentation

## Technical Decisions

### Stack Selection Rationale

**Backend: Express + Sequelize + MariaDB**
- Express for lightweight, flexible API development
- Sequelize ORM for SQL injection prevention and type-safe queries
- MariaDB for ACID compliance and relational data integrity

**Frontend: Next.js + TypeScript + Tailwind CSS**
- Next.js for SSR capabilities and built-in routing
- TypeScript for type safety and better IDE support
- Tailwind CSS for rapid, consistent UI development

**Data Processing**
- fast-xml-parser for efficient IRS Form 990 parsing
- adm-zip for ZIP extraction
- Recharts for data visualization

### Core Features Implemented

**Authentication & Authorization**
- JWT tokens in httpOnly cookies (XSS protection)
- bcrypt password hashing (10 salt rounds)
- Role-based access control (admin/user)
- Session management with secure cookies

**Security Layers**
- Helmet: HTTP security headers
- express-rate-limit: DDoS protection
- xss-clean: XSS prevention
- express-mongo-sanitize: Injection prevention
- express-validator: Input validation
- CORS: Domain whitelisting

**Data Processing Pipeline**
- XML parsing for Form 990 variants (990, 990-EZ, 990-PF)
- ZIP download and extraction
- Batch processing with error handling
- Database upsert (update if EIN exists)
- Automatic temp file cleanup

**Analytics Engine**
- Year-over-year delta calculations (absolute and percentage)
- Organization classification (Profitable/Scaling/Restructuring)
- Staffing growth badges (Rapid/Steady/Modest/Downsizing)
- Financial health metrics (net income, profit margin)

**Frontend Experience**
- Debounced search (500ms)
- Sortable table columns
- Pagination with metadata
- Interactive charts
- Responsive design
- Protected routes with middleware

### Key Trade-offs

**JWT Without Refresh Tokens**
- Decision: httpOnly cookies with 24-hour expiration
- Reasoning: Simpler MVP implementation
- Trade-off: No token rotation, requires re-login
- Future: Implement refresh token strategy for production

**Client-Side Rendering**
- Decision: CSR for interactive features
- Reasoning: Better UX for authenticated flows
- Trade-off: Slower initial load
- Future: Add SSR for public pages if needed

**SQL Over NoSQL**
- Decision: MariaDB relational database
- Reasoning: Structured data with complex relationships
- Trade-off: Less flexible schema
- Future: Consider Redis caching layer

**Batch Processing**
- Decision: Synchronous dataset import
- Reasoning: Large files, infrequent updates
- Trade-off: No real-time progress
- Future: WebSocket progress updates

### Implementation Highlights

**Error Handling**
- Try-catch in all async functions
- Winston centralized logging
- User-friendly error messages
- HTTP status codes (400, 401, 403, 404, 500)

**Code Organization**
- Layered architecture (controller, service, helper, router)
- Reusable UI components
- Centralized API client
- Shared utilities

**Performance**
- Database connection pooling
- Efficient SQL with Sequelize
- Debounced search
- Pagination
- Bulk inserts

### What Was Built

**Backend Infrastructure**
- Complete authentication system
- RBAC with admin/user roles
- XML parser for IRS Form 990
- Dataset import service (download, extract, parse, save)
- Companies API with search, sort, pagination
- Analytics calculations
- Comprehensive logging

**Frontend Application**
- Authentication pages (login, register)
- Protected dashboard
- Companies table with search/sort
- Company detail page with analytics
- Interactive expense charts
- Reusable UI components

**Database Schema**
- Users (authentication)
- Companies (organization data)
- Personnel (key staff)
- ExpenseCategories (breakdown)

### Testing Strategy

**Manual Testing Completed**
- Authentication flow
- Protected routes
- Rate limiting
- Input validation
- Error handling

**Recommended Automated Testing**
- Unit tests for controllers
- Integration tests for APIs
- E2E tests for critical flows
- Load testing for imports

### Deployment Considerations

**Production Requirements**
- Environment variable management
- Database migrations
- CI/CD pipeline
- Monitoring and logging
- Horizontal scaling strategy
- CDN for frontend assets

### Future Enhancements

1. Refresh token implementation
2. Real-time import progress (WebSocket)
3. Advanced filters (revenue range, location)
4. Export functionality (CSV, PDF)
5. Multi-year trend analysis
6. Email notifications
7. Audit logs
8. Two-factor authentication

### Lessons Learned

- Sequelize upsert simplifies data updates
- XML parsing requires handling multiple formats
- Delta calculations need null checks
- Debouncing improves search UX
- Rate limiting essential for import endpoints
- httpOnly cookies prevent XSS
- TypeScript interfaces improve development
- Reusable components save time
- Winston logging aids debugging
- Input validation prevents security issues
   - Validated against environment variable
   - Supports dataset import endpoint

4. **Input Validation**:
   - express-validator for all user inputs
   - Strong password requirements (8+ chars, mixed case, numbers)
   - Email validation and normalization
   - XSS and injection prevention

5. **Rate Limiting**:
   - General API: 100 req/15min
   - Auth endpoints: 5 attempts/15min (brute force protection)
   - Dataset import: 3 req/hour
   - IP-based tracking

**Why this approach:**
- Defense in depth with multiple security layers
- Flexible authentication (JWT for users, API key for systems)
- Prevents common attacks (brute force, XSS, injection)
- Adequate for production use with monitoring

**Current limitations:**
- No refresh token mechanism (single 7-day token)
- No CSRF tokens (relying on SameSite cookies)
- No account lockout on failed attempts
- No email verification
- No two-factor authentication

**Future improvements:**
- Implement refresh token rotation
- Add CSRF protection for state-changing operations
- Implement account lockout after N failed attempts
- Add email verification on registration
- Support 2FA/MFA
- Add session management (logout all devices)
- Implement API key rotation mechanism
- Use secrets management service (AWS Secrets Manager, Vault)
- Add IP whitelisting for API keys
- Implement OAuth2 for third-party access

## Data Processing Strategy

### ZIP File Processing

**Approach:**
1. Download ZIP file to temporary directory using axios with streaming
2. Extract all XML files using adm-zip
3. Parse each XML file individually
4. Transform data into database-ready format
5. Insert/update records in database
6. Clean up temporary files

**Error Handling:**
- Log all parsing errors without stopping the entire operation
- Track success/failure counts for each file
- Store metadata about import jobs (when, how many succeeded/failed)
- Continue processing remaining files even if some fail

**Debuggability:**
- Winston logger for structured logging
- Log levels (info, warn, error) for different scenarios
- Count of files processed, succeeded, failed
- Sample of errors for quick diagnosis
- Import job metadata stored in database

## Database Schema Design

### Companies Table
Main entity storing both current and previous year data for delta calculations.

**Design decisions:**
- Store both current and previous year data in same table to avoid joins
- Decimal type for financial data to avoid floating-point precision issues
- EIN as unique identifier (required by IRS)
- Indexes on EIN and name for fast searching

**What could be improved:**
- Separate historical data into a time-series table for better scalability
- Add audit fields (created_by, updated_by)
- Add soft delete capability
- Store raw XML for reprocessing if needed

### Personnel Table
One-to-many relationship with companies.

**Design decisions:**
- Simple structure with essential fields only
- Foreign key with CASCADE delete for data integrity

**What could be improved:**
- Add more personnel details (board members, volunteers)
- Track compensation history over time
- Add personnel roles/categories

### Expense Categories Table
Stores breakdown of expenses by category.

**Design decisions:**
- Flexible category field to accommodate various IRS categories
- Tax year field to track historical data

**What could be improved:**
- Normalize categories into a separate reference table
- Add percentage calculations
- Store month-by-month breakdown if available

### Users Table
Simple RBAC with JWT authentication support.

**Design decisions:**
- Two roles only (admin, user) for simplicity
- isActive flag for soft account disabling
- Standard fields for username/email/password

**What could be improved:**
- Add more granular permissions
- Add password reset tokens
- Add last login tracking
- Add account lockout after failed attempts
- Store JWT refresh tokens

## Assumptions Made

### Data Format
- IRS XML files follow consistent schema across all filings
- EIN is always present and unique
- Financial data is in USD
- All amounts are non-negative (or properly signed)

### Business Logic
- "Current year" means most recent filing on record
- "Previous year" means the year immediately before current
- Delta calculations are simple percentage and absolute differences
- "Profitable" means Revenue > Expenses
- "Scaling" means Expense growth rate > Revenue growth rate
- "Growth signal" triggered when employee count increases year-over-year

### System Requirements
- Single server deployment (no distributed system initially)
- Moderate data volume (thousands to tens of thousands of organizations)
- Import operations run infrequently (weekly or monthly)
- Read-heavy workload (many queries, few writes)

### User Experience
- Search should feel instantaneous (under 200ms)
- Sorting should maintain search state
- Table view shows summary, detail view shows full information

## Known Limitations and Future Improvements

### Current Limitations

**Performance:**
- No pagination implemented yet (will be slow with large datasets)
- No caching layer (Redis) for frequently accessed data
- Database queries not optimized (no query analysis done yet)
- File processing is synchronous (blocks server during large imports)

**Features:**
- No user authentication UI yet
- No data export functionality
- No historical trend analysis beyond single year comparison
- No data visualization beyond basic charts
- Search is basic text matching (no fuzzy search or typos handling)

**Scalability:**
- Single server architecture
- No horizontal scaling capability
- File processing not distributed
- Database not replicated

### Planned Improvements

**Short-term:**
- Add pagination to /companies endpoint
- Implement proper search with debouncing on frontend
- Add loading states and error boundaries
- Implement JWT authentication flow
- Add data validation on all endpoints
- Write unit and integration tests

**Medium-term:**
- Add Redis caching layer
- Implement background job processing (Bull or Bee-Queue)
- Add more sophisticated analytics (multi-year trends, peer comparisons)
- Implement data export (CSV, Excel)
- Add audit logging for all data changes
- Optimize database queries with proper indexing

**Long-term:**
- Implement full-text search (Elasticsearch)
- Add real-time updates (WebSockets)
- Implement microservices architecture if scale demands
- Add machine learning for lead scoring
- Create mobile application
- Add third-party integrations (CRM, email, etc.)

## Interesting Findings During Development

### IRS Data Complexity
Form 990 XML schema is extensive with hundreds of possible fields. Decided to focus on core metrics to keep scope manageable while providing useful insights.

### Delta Ctable view and company detail pages
- Advanced analytics and visualizations
- Data export functionality
- Comprehensive testing suite
- Production deployment configuration
- Email notification system
- Actuthentication Strategy
Chose JWT with httpOnly cookies over session-based auth for:
- Stateless authentication (easier to scale)
- Works well with separate frontend/backend
- Mobile app support in future
- No server-side session storage needed

However, this requires careful token management and refresh token strategy for production.

### RBAC Implementation
Two-tier role system (admin/user) is sufficient for MVP. More granular permissions can be added later using:
- Permission tables
- Resource-based access control
- Dynamic permission assignment
- Team-based access

### Frontend Architecture
AuthContext pattern provides clean separation:
- Global auth state management
- Automatic token refresh on mount
- Consistent auth checks across components
- Easy to add new protected features

### Security Trade-offs
Implemented strong foundational security but deferred:
- Refresh tokens (adds complexity)
- CSRF tokens (relying on SameSite cookies for now)
- Email verification (requires email service setup)

These can be added incrementally without major refactoring.

### API Design
RESTful endpoints with clear responsibilities:
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/companies/*` - Company data
- `/api/dataset/*` - Data import

This makes it easy to:
- Add new resources
- Apply different rate limits
- Monitor usage per resource type
- Document API clearly

### Validation Strategy
Using express-validator provides:
- Declarative validation rules
- Automatic sanitization
- Detailed error messages
- Reusable validation chains

However, validation rules are in middleware files rather than centralized. Could be improved with a validation schema library like Joi or Yup.

### Logging Approach
Winston provides structured logging but:
- Console logs still used in some places (inconsistent)
- No log aggregation setup yet
- File rotation configured but not monitored
- Security events logged but no alerting

Production would need centralized log management
- Development workflow
- Comprehensive logging

**Why prioritize auth/security:**
- Required for any multi-user system
- Most time-consuming to retrofit later
- Security vulnerabilities are critical
- RBAC enables feature gating
- Foundation for all future features

**User Experience (Completed)**:
- Clean, responsive UI components
- Form validation with error messages
- Loading states and error handling
- Protected routes with automatic redirects
- Intuitive navigation flow

**What this enables:**
- Multiple users can register and use the system
- Admins can manage users and data
- Secure data import from IRS
- Foundation for company management features
- Type-safe development with TypeScript
- Easy to add new protected routes

The actual data processing and company views can be built incrementally on this secure, well-structured
### API Design
Keeping search and sort as query parameters rather than POST body makes the API more RESTful and easier to use with simple curl commands.

### Sequelize Auto-Sync
Very convenient for development but must be disabled in production and replaced with proper migrations to avoid accidental data loss.

### Frontend State Management
For MVP, using React's built-in state management is sufficient. Would consider Zustand or Redux Toolkit if state complexity grows.

## Scope Management

### Implemented Core Features
- Database setup with auto-syncing tables
- Complete authentication system (register, login, logout)
- JWT token-based authentication with httpOnly cookies
- Role-based access control (RBAC) with admin and user roles
- Protected API routes with middleware
- Frontend authentication pages (login, register)
- Protected dashboard with Next.js middleware
- Input validation and sanitization
- Comprehensive security measures (Helmet, XSS, rate limiting)
- Request logging with Winston
- API client with error handling
- Reusable UI components (Button, Input, Card, Alert)
- TypeScript types for type safety
- Project structure with separated concerns (controllers, helpers, middleware)
- Environment-based configuration

### Deferred for Later Implementation
- Actual XML parsing logic (complex, requires IRS schema study)
- Frontend pages and components (time-intensive)
- Full authentication system with login/logout UI
- Advanced analytics and visualizations
- Testing suite
- Deployment configuration

### Rationale for Scope Decisions
The focus was on establishing solid foundations: database schema, project structure, development workflow, and clear documentation. These are critical for team collaboration and future development. The actual data processing and UI can be built incrementally on this foundation.

## Testing Recommendations

### Unit Tests
- Model validation logic
- Utility functions for data transformation
- Delta calculation functions

### Integration Tests
- API endpoints with mock data
- Database operations
- File upload and processing

### End-to-End Tests
- Full user workflows (search, sort, view details)
- Data import process
- Authentication flows

### Load Tests
- Import large ZIP files
- Concurrent API requests
- Database query performance under load

## Deployment Considerations

### Environment Variables
All secrets must be properly configured in production environment (never commit .env files).

### Database Migrations
Replace Sequelize auto-sync with proper migration files for production deployments.

### Process Management
Use PM2 or similar for Node.js process management and auto-restart on failures.

### Reverse Proxy
Use Nginx or similar to handle SSL/TLS, static file serving, and load balancing.

### Monitoring
Implement application monitoring (New Relic, DataDog) and error tracking (Sentry).

### Backup Strategy
Regular automated database backups with point-in-time recovery capability.

### CI/CD Pipeline
Automated testing and deployment pipeline (GitHub Actions, GitLab CI, Jenkins).
