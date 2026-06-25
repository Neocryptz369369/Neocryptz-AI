import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map Stripe product/price names → internal plan keys
function detectPlan(lineItems) {
  for (const item of lineItems) {
    const name = (item.description || item.price?.product?.name || '').toLowerCase();
    if (name.includes('corporate')) return { plan: 'Corporate Team', period: 'yearly' };
    if (name.includes('unlimited') && name.includes('year')) return { plan: 'Unlimited Text', period: 'yearly' };
    if (name.includes('unlimited')) return { plan: 'Unlimited Text', period: 'monthly' };
    if (name.includes('power') && name.includes('year')) return { plan: 'Power', period: 'yearly' };
    if (name.includes('power')) return { plan: 'Power', period: 'monthly' };
    if (name.includes('starter') && name.includes('year')) return { plan: 'Starter', period: 'yearly' };
    if (name.includes('starter')) return { plan: 'Starter', period: 'monthly' };
  }
  return null;
}

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (secret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } else {
      event = JSON.parse(rawBody.toString());
      console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    }
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  // Retrieve line items with expanded product info
  let planInfo = null;
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
      limit: 5
    });
    planInfo = detectPlan(items.data);

    // Fallback: try metadata set on the payment link
    if (!planInfo && session.metadata) {
      const p = session.metadata.plan;
      const period = session.metadata.period || 'monthly';
      if (p) planInfo = { plan: p, period };
    }
  } catch (e) {
    console.error('Failed to fetch line items:', e.message);
  }

  if (!planInfo) {
    console.warn('Could not determine plan from session', session.id);
    return res.status(200).json({ received: true });
  }

  const username = session.client_reference_id || 'unknown';
  const amount = session.amount_total;

  try {
    await supabase.from('purchase_notifications').insert({
      stripe_session_id: session.id,
      username,
      plan: planInfo.plan,
      period: planInfo.period,
      amount_cents: amount,
      notified: false,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Supabase insert failed:', e.message);
  }

  return res.status(200).json({ received: true });
}
