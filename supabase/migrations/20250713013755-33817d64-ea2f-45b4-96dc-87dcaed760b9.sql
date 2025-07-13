
-- Create referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral history table
CREATE TABLE public.referral_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add referral_code column to profiles table
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT;

-- Enable Row Level Security
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_history ENABLE ROW LEVEL SECURITY;

-- Create policies for referral_codes
CREATE POLICY "Users can view their own referral codes" 
  ON public.referral_codes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" 
  ON public.referral_codes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" 
  ON public.referral_codes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for referral_history
CREATE POLICY "Users can view their referral history" 
  ON public.referral_history 
  FOR SELECT 
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can create referral history" 
  ON public.referral_history 
  FOR INSERT 
  WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8 character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to handle new user signup with referral
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_user_id UUID;
  ref_code TEXT;
BEGIN
  -- Get referral code from user metadata
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF ref_code IS NOT NULL THEN
    -- Find the referrer
    SELECT user_id INTO referrer_user_id
    FROM referral_codes 
    WHERE code = ref_code AND is_active = true;
    
    IF referrer_user_id IS NOT NULL THEN
      -- Create referral history record
      INSERT INTO referral_history (referrer_id, referred_user_id, referral_code, points_awarded)
      VALUES (referrer_user_id, NEW.id, ref_code, 10);
      
      -- Update referrer's stats
      UPDATE referral_codes 
      SET points_earned = points_earned + 10,
          total_referrals = total_referrals + 1,
          updated_at = now()
      WHERE user_id = referrer_user_id AND code = ref_code;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_referral_signup();

-- Create indexes for performance
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_history_referrer_id ON referral_history(referrer_id);
CREATE INDEX idx_referral_history_referred_user_id ON referral_history(referred_user_id);
