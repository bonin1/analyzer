# RBAC (Role-Based Access Control) Implementation

## Overview
The application uses a two-tier role system: `admin` and `user`.

## Roles and Permissions

### Admin Role
**Full system access:**
- View all companies (read)
- Create, update, delete companies (write)
- Import datasets from IRS
- View all users
- Update any user (including role changes)
- Delete users (except self)
- Access all protected endpoints

### User Role
**Limited access:**
- View all companies (read-only)
- View company details (read-only)
- View own profile
- Update own profile (username, email only - cannot change role)
- Cannot import datasets
- Cannot manage other users
- Cannot create/update/delete companies

### Public Access
**No authentication required:**
- Register new account
- Login
- View companies (optional - can be restricted later)

## Endpoint Protection

### Authentication Endpoints (`/api/auth`)
- `POST /register` - Public
- `POST /login` - Public
- `POST /logout` - Authenticated users only
- `GET /profile` - Authenticated users only

### Companies Endpoints (`/api/companies`)
- `GET /companies` - Public (can be restricted to authenticated users)
- `GET /companies/:id` - Public (can be restricted to authenticated users)
- `POST /companies` - Admin only
- `PUT /companies/:id` - Admin only
- `DELETE /companies/:id` - Admin only

### Dataset Endpoints (`/api/dataset`)
- `POST /dataset` - Admin only OR valid API key

### Users Endpoints (`/api/users`)
- `GET /users` - Admin only
- `GET /users/:id` - Admin OR own profile
- `PUT /users/:id` - Admin (full access) OR own profile (limited fields)
- `DELETE /users/:id` - Admin only (cannot delete self)

## Middleware Chain

### Example: Admin-only endpoint
```javascript
router.post('/companies',
  authenticate,        // Verify JWT token
  authorize('admin'),  // Check user role
  controller.create    // Execute business logic
);
```

### Example: Self or Admin access
```javascript
router.get('/users/:id',
  authenticate,        // Verify JWT token
  (req, res, next) => {
    // Custom logic to check if admin or own profile
    if (req.user.role === 'admin' || req.user.id === parseInt(req.params.id)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  controller.getUser
);
```

## Implementation Details

### Authentication Middleware
Located: `backend/middleware/auth.js`

```javascript
const authenticate = (req, res, next) => {
  // Extracts JWT from cookie
  // Verifies token validity
  // Attaches user data to req.user
  // Continues if valid, returns 401 if not
};
```

### Authorization Middleware
Located: `backend/middleware/auth.js`

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    // Checks if req.user.role is in allowed roles
    // Continues if authorized, returns 403 if not
  };
};
```

## Security Logging

All RBAC violations are logged:
- Who attempted access (user ID)
- What resource they tried to access
- When the attempt occurred
- IP address of requester

Example log entry:
```json
{
  "level": "warn",
  "message": "Authorization failed: User role user not authorized",
  "timestamp": "2025-12-29 10:30:45",
  "userId": 123,
  "role": "user",
  "endpoint": "/api/dataset",
  "ip": "192.168.1.1"
}
```

## Creating Admin Users

### Method 1: First User (Registration)
Register the first user and manually update in database:
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

### Method 2: Admin Creation via Existing Admin
Once you have one admin, they can:
1. Create new users via `/api/auth/register`
2. Update role via `PUT /api/users/:id` with `role: 'admin'`

### Method 3: Direct Database Insert
```sql
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@example.com', 'hashed_password_here', 'admin');
```

## Testing RBAC

### Test as Regular User
```bash
# Register as user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"user@test.com","password":"Test1234"}'

# Try to access admin endpoint (should fail)
curl -X POST http://localhost:3001/api/dataset \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=USER_TOKEN" \
  -d '{"irsZipUrl":"..."}'

# Expected: 403 Forbidden
```

### Test as Admin
```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin1234"}'

# Access admin endpoint (should succeed)
curl -X POST http://localhost:3001/api/dataset \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=ADMIN_TOKEN" \
  -d '{"irsZipUrl":"..."}'

# Expected: 200 OK
```

## Best Practices

1. **Principle of Least Privilege**: Users start with minimal permissions
2. **Explicit Permissions**: All protected routes explicitly check roles
3. **Fail Secure**: Default behavior denies access if auth fails
4. **Audit Logging**: All permission checks are logged
5. **Immutable Role on Self**: Users cannot elevate their own privileges
6. **Admin Cannot Delete Self**: Prevents accidental lockout

## Future Enhancements

1. **Granular Permissions**: Beyond just admin/user roles
   - viewer, editor, manager, super_admin
   
2. **Resource-Based Access Control**: 
   - Users can only see companies they created
   - Team-based access
   
3. **Dynamic Permissions**:
   - Permission sets stored in database
   - Assignable per user or role
   
4. **Temporary Elevated Access**:
   - Time-limited admin access
   - Sudo-style elevation with re-authentication
   
5. **API Scopes**:
   - OAuth-style scopes for third-party integrations
   - Fine-grained API permissions
