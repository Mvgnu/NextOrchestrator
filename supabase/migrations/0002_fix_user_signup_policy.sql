-- Update the insert policy to allow users to sign up
DROP POLICY IF EXISTS "Users can insert their own data during signup" ON "public"."users";

-- Create a new policy that allows all inserts
CREATE POLICY "Users can insert their own data during signup" 
ON "public"."users"
FOR INSERT
WITH CHECK (true); 