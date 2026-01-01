# Non-Profit Analyzer

A full-stack application for analyzing IRS Form 990 filings of non-profit organizations, providing insights and highlighting potential strong leads.

## Tech Stack

### Frontend
- Next.js 16 (React framework with App Router)
- TypeScript
- Tailwind CSS

### Backend
- Node.js with Express
- Sequelize ORM
- MariaDB (MySQL-compatible)

### Key Libraries
- axios - HTTP client for downloading IRS ZIP files
- adm-zip - ZIP file extraction
- winston - Logging framework
- express-validator - Request validation
- cors - Cross-origin resource sharing

## Prerequisites

Before running this project, ensure you have the following installed:

- Node.js (version 18 or higher)
- npm or yarn
- MariaDB or MySQL (version 10.x or higher)

## Database Setup

1. Install and start MariaDB/MySQL

2. Create the database:
```sql
CREATE DATABASE nonprofit_analyzer;
```

3. Configure database credentials in `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nonprofit_analyzer
DB_USER=root
DB_PASSWORD=your_password_here
```

The application will automatically create all required tables on first run.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd analyzer
```

2. Install dependencies for root, backend, and frontend:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Running the Application

### Run Both Frontend and Backend Together
```bash
npm run dev:all
```

This will start:
- Backend API server on http://localhost:3001
- Frontend Next.js application on http://localhost:3000

### Run Services Separately

Backend only:
```bash
npm run dev:backend
```

Frontend only:
```bash
npm run dev:frontend
```

Or navigate to individual directories:
```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

Request body:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /api/auth/login
Login with email and password. Sets httpOnly cookie with JWT token.

Request body:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /api/auth/logout
Logout current user (clears auth cookie).

Authentication: Required (JWT cookie)

#### GET /api/auth/profile
Get current user profile.

Authentication: Required (JWT cookie)

### Public Endpoints

#### GET /api/companies
Returns list of all non-profit companies with filtering and sorting capabilities.

Query parameters:
- `search` - Search by company name
- `sortBy` - Column to sort by (currentRevenue, currentExpenses, currentAssets, currentEmployeeCount)
- `sortOrder` - asc or desc

#### GET /api/companies/:id
Returns detailed information for a specific company including:
- Company information
- Key personnel
- Expense categories
- Revenue vs expense analysis
- Staffing signals

### Protected Endpoints (Admin Only)

#### POST /api/dataset
Accepts IRS filing ZIP file URL and processes the data.

Authentication: Requires admin role OR valid API key in `X-API-Key` header

Request body:
```json
{
  "irsZipUrl": "https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip"
}
```

Rate limit: 3 requests per hour

#### POST /api/companies
Create new company (manual entry).

Authentication: Admin role required

#### PUT /api/companies/:id
Update company information.

Authentication: Admin role required

#### DELETE /api/companies/:id
Delete company.

Authentication: Admin role required

### User Management Endpoints

#### GET /api/users
Get all users.

Authentication: Admin role required

#### GET /api/users/:id
Get specific user details.

Authentication: Admin or own profile

#### PUT /api/users/:id
Update user information.

Authentication: Admin (full access) or own profile (limited fields)

#### DELETE /api/users/:id
Delete user.

Authentication: Admin role required

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Test Authentication

Register a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Security
API_SECRET_KEY=dev_secret_key_12345
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001pi/auth/profile \
  -b cookies.txt
```

### Test Dataset Import (Admin Only)

Using API Key:
```bash
curl -X POST http://localhost:3001/api/dataset \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_secret_key_12345" \
  -d '{"irsZipUrl": "https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip"}'
```

Using Admin JWT:
```bash
curl -X POST http://localhost:3001/api/dataset \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"irsZipUrl": "https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip"}'
```

### Access Frontend
Navigate to http://localhost:3000 in your browser:
- Register a new account at `/register`
- Login at `/login`
- Access dashboard at `/dashboard` (protected route)
- Logout from dashboard

## Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nonprofit_analyzer
DB_USER=root
DB_PASSWORD=your_database_password_here

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_min_32_characters_change_in_production
JWT_EXPIRES_IN=7d

# Security - API Key for dataset import
API_SECRET_KEY=your_secure_api_key_change_in_production
```

**Environment Variable Descriptions:**

- `DB_HOST`: Database host address (default: `localhost`)
- `DB_PORT`: Database port (default: `3306` for MariaDB/MySQL)
- `DB_NAME`: Name of the database (create this first: `CREATE DATABASE nonprofit_analyzer;`)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password (leave empty if no password set locally)

- `PORT`: Backend server port (default: `3001`)
- `NODE_ENV`: Environment mode (`development` or `production`)
- `FRONTEND_URL`: Frontend URL for CORS configuration

- `JWT_SECRET`: Secret key for JWT token signing (minimum 32 characters for security)
- `JWT_EXPIRES_IN`: JWT token expiration time (e.g., `7d` for 7 days, `24h` for 24 hours)

- `API_SECRET_KEY`: Secret key for protecting the dataset import endpoint (use strong random string)

### Frontend (.env.local)

Create a `.env.local` file in the `frontend/` directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Environment Variable Descriptions:**

- `NEXT_PUBLIC_API_URL`: Backend API base URL (must start with `NEXT_PUBLIC_` to be accessible in browser)

## Project Structure

```
analyzer/
├── backend/
│   ├── config/          # Configuration files
│   │   ├── index.js    # Centralized config
│   │   └── logger.js   # Winston logger setup
│   ├── controller/      # Route controllers
│   │   ├── authController.js
│   │   ├── companiesController.js
│   │   └── datasetController.js
│   ├── helpers/         # Helper utilities
│   │   ├── dataHelper.js
│   │   ├── datasetService.js
│   │   ├── jwtHelper.js
│   │   ├── passwordHelper.js
│   │   └── xmlParser.js
│   ├── logs/            # Log files
│   │   ├── combined.log
│   │   └── error.log
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js           # JWT authentication & RBAC
│   │   ├── apiKeyAuth.js     # API key validation
│   │   ├── rateLimiter.js    # Rate limiting
│   │   ├── requestLogger.js  # Request logging
│   │   └── validation.js     # Input validation
│   ├── models/          # Sequelize models
│   │   ├── Company.js
│   │   ├── Personnel.js
│   │   ├── ExpenseCategory.js
│   │   ├── User.js
│   │   └── index.js
│   ├── routers/         # Express routes
│   │   ├── authRoutes.js
│   │   ├── companiesRoutes.js
│   │   ├── datasetRoutes.js
│   │   └── usersRoutes.js
│   ├── temp/            # Temporary files for ZIP extraction
│   ├── app.js          # Express application
│   ├── database.js     # Database configuration
│   ├── RBAC.md         # RBAC documentation
│   └── SECURITY.md     # Security documentation
├── frontend/
│   ├── app/            # Next.js app directory
│   │   ├── companies/  # Companies pages
│   │   ├── dashboard/  # Protected dashboard page
│   │   ├── login/      # Login page
│   │   ├── register/   # Registration page
│   │   ├── layout.tsx  # Root layout with AuthProvider
│   │   └── page.tsx    # Home page (redirects)
│   ├── components/     # React components
│   │   └── ui/        # Reusable UI components
│   │       ├── Alert.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── DeltaDisplay.tsx
│   │       └── Input.tsx
│   ├── lib/            # Utility functions
│   │   ├── api/       # API client and services
│   │   │   ├── auth.ts
│   │   │   ├── client.ts
│   │   │   ├── companies.ts
│   │   │   └── dataset.ts
│   │   └── auth/      # Auth context
│   │       └── AuthContext.tsx
│   ├── types/          # TypeScript types
│   │   ├── auth.ts
│   │   └── company.ts
│   ├── middleware.ts   # Next.js middleware for route protection
│   ├── next.config.ts  # Next.js configuration
│   └── package.json
├── .github/
│   ├── instructions/   # TaskSync protocol files
│   │   ├── tasks.md
│   │   ├── log.md
│   │   └── tasksync.instructions.md
│   └── requirement.md  # Original project requirements
├── package.json        # Root package.json with dev:all script
├── README.md           # This file
└── SOLUTION.md         # Implementation documentation
```

## User Authentication

The system includes comprehensive user authentication with role-based access control (RBAC):

- **Roles**: `admin` and `user`
- **Password hashing**: bcrypt with 10 salt rounds
- **JWT token**: Stored in httpOnly cookies for security
- **Token expiration**: Configurable (default: 7 days)

For detailed authentication and RBAC information, see:
- [backend/RBAC.md](backend/RBAC.md) - Role-based access control documentation
- [backend/SECURITY.md](backend/SECURITY.md) - Security implementation details

## Security Features

### Authentication & Authorization
- JWT tokens stored in httpOnly cookies (XSS protection)
- Password hashing with bcrypt (10 salt rounds)
- Strong password requirements (8+ chars, uppercase, lowercase, number)
- Role-based access control (RBAC) with admin and user roles
- Protected routes with authentication middleware
- API key authentication for dataset import endpoint

### HTTP Security
- Helmet.js for secure HTTP headers
- CORS with origin whitelist
- Body size limits (10MB)
- Request logging with Winston

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 attempts per 15 minutes (brute force protection)
- Dataset import: 3 requests per hour

For complete security documentation, see [backend/SECURITY.md](backend/SECURITY.md)

## Database Schema

### companies
Stores main non-profit organization data including current and previous year metrics.

### personnel
Stores key personnel information linked to companies.

### expense_categories
Stores expense breakdown by category for each company.

### users
Stores user accounts for authentication and RBAC.

## Development Notes

- Tables are automatically created/synced on server start via Sequelize
- Hot reload is enabled for both frontend and backend during development
- Database logs are disabled by default (set `logging: console.log` in database.js to enable)

## Troubleshooting

### Database Connection Issues
- Verify MariaDB/MySQL is running
- Check credentials in backend/.env
- Ensure database exists: `CREATE DATABASE nonprofit_analyzer;`
- Check if port 3306 is available

### Authentication Issues
- Clear browser cookies if experiencing login issues
- Check JWT_SECRET is set in backend/.env
- Verify cookie settings in browser (allow cookies from localhost)
- Check browser console for CORS errors

### Port Already in Use
- Backend default: 3001
- Frontend default: 3000
- Change PORT in backend/.env if needed
- Stop any other processes using these ports

### Module Not Found Errors
- Run `npm install` in root, backend, and frontend directories
- Clear node_modules and reinstall if issues persist
- Check Node.js version (requires 18+)

### CORS Errors
- Verify FRONTEND_URL in backend/.env matches your frontend URL
- Check that credentials are included in API requests
- Ensure backend is running before making requests

### Rate Limiting
- If you hit rate limits during testing, wait 15 minutes
- Or temporarily increase limits in `backend/middleware/rateLimiter.js`
- Check logs for "Too many requests" messages

## Creating an Admin User

### Method 1: Manual Database Update
After registering your first user, update their role in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### Method 2: Direct Registration with Role
Temporarily modify the registration to allow role specification, or use a database client to insert:
```sql
INSERT INTO users (username, email, password, role, isActive, createdAt, updatedAt) 
VALUES ('admin', 'admin@example.com', '$2a$10$hashedpassword', 'admin', 1, NOW(), NOW());
```

Note: Hash the password first using bcrypt before inserting.s brute force)
- Dataset import: 3 requests per hour

### HTTP Security
- Helmet.js for secure HTTP headers
- CORS with origin whitelist
- Body size limits (10MB)
- Request logging with Winston

### API Security
- API key authentication for sensitive endpoints
- Multiple authentication methods (JWT or API key)
- All security events logged

For detailed security information, see `backend/SECURITY.md` and `backend/RBAC.md`
│   │   └── usersRoutes.js
│   ├── app.js          # Express application
│   ├── database.js     # Database configuration
│   ├── RBAC.md         # RBAC documentation
│   └── SECURITY.md     # Security documentation
├── frontend/
│   ├── app/            # Next.js app directory
│   │   ├── dashboard/  # Protected dashboard page
│   │   ├── login/      # Login page
│   │   ├── register/   # Registration page
│   │   ├── layout.tsx  # Root layout with AuthProvider
│   │   └── page.tsx    # Home page (redirects)
│   ├── components/     # React components
│   │   └── ui/        # Reusable UI components
│   │       ├── Alert.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── lib/            # Utility functions
│   │   ├── api/       # API client and services
│   │   │   ├── auth.ts
│   │   │   └── client.ts
│   │   └── auth/      # Auth context
│   │       └── AuthContext.tsx
│   ├── types/          # TypeScript types
│   │   └── auth.ts
│   └── middleware.ts   # Next.js middleware for route protection
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper utilities
│   ├── app.js          # Express application
│   └── database.js     # Database configuration
├── frontend/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   └── lib/            # Utility functions
└── package.json        # Root package.json with dev:all script
```

## Database Schema

### companies
Stores main non-profit organization data including current and previous year metrics.

### personnel
Stores key personnel information linked to companies.

### expense_categories
Stores expense breakdown by category for each company.

### users
Stores user accounts for authentication and RBAC.

## Development Notes

- Tables are automatically created/synced on server start via Sequelize
- Hot reload is enabled for both frontend and backend during development
- Database logs are disabled by default (set `logging: console.log` in database.js to enable)

## Troubleshooting

### Database Connection Issues
- Verify MariaDB/MySQL is running
- Check credentials in backend/.env
- Ensure database exists (CREATE DATABASE nonprofit_analyzer;)

### Port Already in Use
- Backend default: 3001
- Frontend default: 3000
- Change PORT in backend/.env or Next.js settings if needed

### Module Not Found Errors
- Run npm install in root, backend, and frontend directories
- Clear node_modules and reinstall if issues persist
