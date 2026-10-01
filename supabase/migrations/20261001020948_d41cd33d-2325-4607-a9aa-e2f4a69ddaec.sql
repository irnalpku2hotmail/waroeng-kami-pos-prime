DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;

CREATE POLICY "Only system can insert notifications"
ON public.user_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

REVOKE INSERT ON public.user_notifications FROM authenticated, anon;
GRANT ALL ON public.user_notifications TO service_role;