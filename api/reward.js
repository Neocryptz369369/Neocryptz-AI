import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// In-memory cooldown (resets on cold start — DB column is preferred when available)
const cooldowns = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];

  // Local-admin tokens: grant virtually (client applies the credit locally)
  if (token && token.startsWith('local-token-')) {
    const now = Date.now();
    const last = cooldowns.get(token) || 0;
    if (now - last < 60000) {
      return res.status(429).json({ error: 'Cooldown active', remaining: Math.ceil((60000 - (now - last)) / 1000) });
    }
    cooldowns.set(token, now);
    return res.status(200).json({ success: true, message: '+5 Questions granted!', newCredits: null, local: true, cooldown: 60 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = user.id;

  try {
    // Try full profile first; fall back to minimal if columns are missing
    let profile = null;
    let hasCreditsCol = false;
    let hasQuestionsCol = false;
    let hasLastAdCol = false;

    const { data: full, error: fullErr } = await supabase
      .from('profiles')
      .select('id, credits, questions, last_ad_reward_at')
      .eq('id', userId)
      .single();

    if (!fullErr && full) {
      profile = full;
      hasCreditsCol = 'credits' in full && full.credits !== undefined;
      hasQuestionsCol = 'questions' in full && full.questions !== undefined;
      hasLastAdCol = 'last_ad_reward_at' in full;
    } else {
      const { data: min, error: minErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      if (minErr || !min) return res.status(404).json({ error: 'User not found' });
      profile = min;
    }

    // Cooldown check
    const now = new Date();
    if (hasLastAdCol && profile.last_ad_reward_at) {
      const diffSec = (now - new Date(profile.last_ad_reward_at)) / 1000;
      if (diffSec < 60) {
        return res.status(429).json({ error: 'Cooldown active', remaining: Math.ceil(60 - diffSec) });
      }
    } else {
      const last = cooldowns.get(userId) || 0;
      if (Date.now() - last < 60000) {
        return res.status(429).json({ error: 'Cooldown active', remaining: Math.ceil((60000 - (Date.now() - last)) / 1000) });
      }
    }
    cooldowns.set(userId, Date.now());

    // Only update columns that actually exist
    const updateObj = {};
    if (hasCreditsCol)   updateObj.credits  = (profile.credits || 0) + 25;
    if (hasQuestionsCol) updateObj.questions = (profile.questions || 0) + 5;
    if (hasLastAdCol)    updateObj.last_ad_reward_at = now.toISOString();

    if (Object.keys(updateObj).length > 0) {
      const { error: upErr } = await supabase.from('profiles').update(updateObj).eq('id', userId);
      if (upErr) throw upErr;
    }

    return res.status(200).json({
      success: true,
      message: '+5 Questions granted!',
      newCredits: hasCreditsCol ? (profile.credits || 0) + 25 : null,
      cooldown: 60
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}