-- Create the admins table in Supabase
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_clerk_user_id ON admins(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only authenticated users can read admin data (you can make this more restrictive)
CREATE POLICY "Authenticated users can read admins" ON admins
    FOR SELECT
    TO authenticated
    USING (true);

-- Only super_admins can insert new admins
CREATE POLICY "Super admins can insert admins" ON admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'super_admin'
        )
    );

-- Only super_admins can update admin records
CREATE POLICY "Super admins can update admins" ON admins
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'super_admin'
        )
    );

-- Only super_admins can delete admin records
CREATE POLICY "Super admins can delete admins" ON admins
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'super_admin'
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample super admin (replace with your actual Clerk user ID and email)
-- You can get your Clerk user ID from the Clerk dashboard or by logging it in your app
-- INSERT INTO admins (clerk_user_id, email, role) 
-- VALUES ('your_clerk_user_id_here', 'your_email@example.com', 'super_admin');

-- Example: Uncomment and modify the line below with your actual details
-- INSERT INTO admins (clerk_user_id, email, role) 
-- VALUES ('user_2xyz123abc', 'admin@familying.com', 'super_admin');
