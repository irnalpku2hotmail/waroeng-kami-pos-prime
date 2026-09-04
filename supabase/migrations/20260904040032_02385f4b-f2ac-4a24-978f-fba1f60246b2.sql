DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

CREATE POLICY "Users can insert their own buyer profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id AND role = 'buyer'::public.user_role);

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin'::public.user_role);