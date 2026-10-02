DROP POLICY IF EXISTS "System can create referral history" ON public.referral_history;
REVOKE INSERT ON public.referral_history FROM anon, authenticated;
GRANT ALL ON public.referral_history TO service_role;
CREATE POLICY "Only system can create referral history" ON public.referral_history FOR INSERT TO service_role WITH CHECK (true);