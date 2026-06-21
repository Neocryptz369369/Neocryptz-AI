import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = user.id;

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, credits, questions, last_ad_reward_at')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const lastReward = profile.last_ad_reward_at ? new Date(profile.last_ad_reward_at) : new Date(0);
    const diffSeconds = (now - lastReward) / 1000;

    if (diffSeconds < 60) {
      return res.status(429).json({
        error: 'Cooldown active',
        remaining: Math.ceil(60 - diffSeconds)
      });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        questions: (profile.questions || 0) + 5,
        credits: (profile.credits || 0) + 25,
        last_ad_reward_at: now.toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: '+5 Questions granted!',
      newCredits: (profile.credits || 0) + 25,
      cooldown: 60
    });

  } catch (error) {
    console.error('Reward error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
