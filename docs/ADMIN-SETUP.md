# Admin Dashboard Setup Guide

This guide explains how to set up and use the admin dashboard functionality for Familying.

## 🛠 Setup Instructions

### 1. Database Setup

#### Create the Admins Table in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `sql/create_admins_table.sql`

This will create:

- `admins` table with proper structure
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

#### Table Structure

```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('super_admin', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Add Your First Admin

#### Option 1: Direct SQL Insert

1. Get your Clerk User ID:
   - Sign in to your app
   - Check the browser console or Clerk dashboard
   - Your user ID looks like: `user_2xyz123abc`

2. Run this SQL in Supabase:

```sql
INSERT INTO admins (clerk_user_id, email, role) 
VALUES ('your_clerk_user_id_here', 'your_email@example.com', 'super_admin');
```

#### Option 2: Using Supabase Dashboard

1. Go to Table Editor in Supabase
2. Navigate to the `admins` table
3. Click "Insert row"
4. Fill in:
   - `clerk_user_id`: Your Clerk user ID
   - `email`: Your email address
   - `role`: `super_admin`

### 3. Environment Variables

Ensure these are set in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## 🎯 Admin Roles

### Role Hierarchy

1. **Super Admin** (`super_admin`)
   - Full system access
   - Can add/remove other admins
   - Can modify all settings
   - Highest level of permissions

2. **Admin** (`admin`)
   - Can manage users and families
   - Can view system metrics
   - Cannot manage other admins

3. **Moderator** (`moderator`)
   - Can moderate content
   - Limited user management
   - Read-only access to most features

## 🚀 Features

### Admin Dashboard (`/admin`)

#### Access Control

- Automatically checks if user is in `admins` table
- Redirects non-admins to regular dashboard
- Role-based UI elements

#### Dashboard Sections

1. **Statistics Overview**
   - Total admins count
   - Total users count
   - System health metrics
   - Database status

2. **Admin Management**
   - View all administrators
   - See roles and permissions
   - Add/remove admin access
   - Edit admin roles

3. **Admin Tools**
   - User Management
   - System Monitor
   - Database Tools
   - System Settings
   - Audit Logs
   - Security Center

#### Navigation Features

- Admin badge in navigation
- Quick access to admin panel
- Role indicator badges
- Security alerts

### Regular Dashboard Integration

#### Admin Detection

- Checks admin status on dashboard load
- Shows "Admin" button for admin users
- Seamless navigation between dashboards

## 🔒 Security Features

### Row Level Security (RLS)

- All admin operations protected by RLS policies
- Only authenticated users can read admin data
- Only super_admins can modify admin records
- Prevents unauthorized access

### Permission Checks

- Server-side admin verification
- Clerk user ID validation
- Role-based access control
- Secure API endpoints

### Audit Trail

- Automatic timestamp tracking
- Created/updated timestamps
- Future: Activity logging
- Future: Change history

## 📱 Usage

### For Admin Users

1. **Access Admin Dashboard**
   - Regular users: Sign in → Dashboard
   - Admin users: Dashboard → "Admin" button → Admin Dashboard

2. **Manage Admins**
   - View all administrators in the table
   - See roles and creation dates
   - Add new admins (super_admin only)
   - Remove admin access (super_admin only)

3. **System Management**
   - Monitor system health
   - Access admin tools
   - Review audit logs
   - Configure settings

### For Super Admins

1. **Add New Admin**

   ```typescript
   import { addAdmin } from '@/lib/admin';
   
   const newAdmin = await addAdmin(
     'clerk_user_id',
     'email@example.com',
     'admin' // or 'moderator'
   );
   ```

2. **Remove Admin**

   ```typescript
   import { removeAdmin } from '@/lib/admin';
   
   const success = await removeAdmin('clerk_user_id');
   ```

3. **Update Role**

   ```typescript
   import { updateAdminRole } from '@/lib/admin';
   
   const updated = await updateAdminRole('clerk_user_id', 'moderator');
   ```

## 🎨 UI Components

### Styling

- Uses shadcn/ui components
- Consistent with main application theme
- Professional admin interface
- Responsive design

### Icons

- Shield icons for admin features
- Role-specific icons (Crown, Shield, Users)
- Status indicators
- Professional iconography

### Color Coding

- Red: Super Admin (destructive variant)
- Blue: Admin (default variant)
- Gray: Moderator (secondary variant)
- Visual role hierarchy

## 🔮 Future Enhancements

### Planned Features

- [ ] Audit logging system
- [ ] Activity monitoring
- [ ] User management interface
- [ ] System metrics dashboard
- [ ] Email notifications
- [ ] Advanced permissions
- [ ] API rate limiting
- [ ] Security monitoring

### Database Extensions

- [ ] Activity logs table
- [ ] System metrics table
- [ ] User action history
- [ ] Security events log

## ⚠️ Important Notes

1. **First Admin**: You must manually add the first super_admin via SQL
2. **Security**: Keep service role key secure - never expose in client code
3. **Permissions**: Only super_admins can manage other admins
4. **Backup**: Always backup before making admin changes
5. **Testing**: Test admin functionality thoroughly before production

## 🆘 Troubleshooting

### Common Issues

1. **"Not authorized" error**
   - Check if user is in admins table
   - Verify Clerk user ID is correct
   - Ensure RLS policies are applied

2. **Database connection issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Review environment variables

3. **Permission denied**
   - Confirm user role in database
   - Check RLS policy configuration
   - Verify service role key permissions

### Debug Steps

1. Check Supabase logs
2. Verify environment variables
3. Test database connection
4. Review Clerk authentication
5. Check browser console for errors

---

**Security Warning**: Admin access provides significant system control. Only grant admin privileges to trusted users and regularly audit admin activities.
