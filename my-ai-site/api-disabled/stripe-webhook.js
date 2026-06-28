const { createClient } = require('@supabase/supabase-js');
const { createHmac } = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function detectPlan(lineItems) {
  for (const item of lineItems) {
    const name = (item.description || (item.price && item.price.product && item.price.product.name) || '').toLowerCase();
    if (name.includes('corporate'))                          return { plan: 'Corporate Team',  period: 'yearly'  };
    if (name.includes('unlimited') && name.includes('year')) return { plan: 'Unlimited Text', period: 'yearly'  };
    if (name.includes('unlimited'))                          return { plan: 'Unlimited Text', period: 'monthly' };
    if (name.includes('power')   && name.includes('year'))   return { plan: 'Power',          period: 'yearly'  };
    if (name.includes('power'))                              return { plan: 'Power',          period: 'monthly' };
    if (name.includes('starter') && name.includes('year'))   return { plan: 'Starter',        period: 'yearly'  };
    if (name.includes('starter'))                            return { plan: 'Starter',        period: 'monthly' };
  }
  return null;
}

function verifyStripeSignature(rawBody, sig, secret) {
  const parts = sig.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const payload = `${parts.t}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  return expected === parts.v1;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', c => chunks.push(c));
    req.on('end', resolve);
    req.on('error', reject);
  });
  const rawBody = Buffer.concat(chunks).toString();

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret && sig) {
    if (!verifyStripeSignature(rawBody, sig, secret)) {
      return res.status(400).json({ error: 'Signature mismatch' });
    }
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  // Try to get plan from metadata first (set on payment link in Stripe dashboard)
  let planInfo = null;
  if (session.metadata && session.metadata.plan) {
    planInfo = { plan: session.metadata.plan, period: session.metadata.period || 'monthly' };
  }

  // Fallback: fetch line items via Stripe REST API
  if (!planInfo) {
    try {
      const stripeRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items?expand[]=data.price.product&limit=5`,
        { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
      );
      const lineData = await stripeRes.json();
      if (lineData.data) planInfo = detectPlan(lineData.data);
    } catch (e) {
      console.error('Line items fetch failed:', e.message);
    }
  }

  if (!planInfo) {
    console.warn('Could not determine plan for session', session.id);
    return res.status(200).json({ received: true });
  }

  const username = session.client_reference_id || 'unknown';

  try {
    await supabase.from('purchase_notifications').insert({
      stripe_session_id: session.id,
      username,
      plan: planInfo.plan,
      period: planInfo.period,
      amount_cents: session.amount_total,
      notified: false,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Supabase insert failed:', e.message);
  }

  return res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
