import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const payload = req.body;
        console.log("PAYPAL WEBHOOK RECEIVED:", JSON.stringify(payload));

        // Extract required variables. Ensure these are set in Vercel.
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Missing Supabase admin keys.");
            return res.status(500).json({ error: "Missing configuration" });
        }

        // We use the service_role key to bypass Row Level Security to update records via backend securely.
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Typical PayPal IPN / Webhook payload format verification
        // Item Name usually contains the plan identifier (e.g. "Starter", "Power")
        // Custom usually contains the passing user ID from the frontend.
        const planName = payload.item_name || payload?.resource?.plan_id || 'Unknown';
        const userId = payload.custom || payload?.resource?.custom_id;

        if (userId) {
            console.log(`Attempting to automatically update user ${userId} to plan ${planName}...`);
            const { data, error } = await supabase
                .from('users')
                .update({
                    plan: planName,
                    status: 'active',
                    updated_at: new Date()
                })
                .eq('id', userId);

            if (error) {
                console.error("Failed to automatically grant plan:", error.message);
            } else {
                console.log(`Successfully upgraded user ${userId} to ${planName}.`);
            }
        } else {
            console.warn("No custom User ID was provided in the PayPal payload.");
        }

        res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
