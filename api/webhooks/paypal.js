export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const payload = req.body;
        console.log("PAYPAL WEBHOOK RECEIVED:", JSON.stringify(payload));

        // Logic here to automatically verify payload.resource
        // and update the user's plan in Supabase if implemented.

        res.status(200).json({ status: 'success', message: 'Webhook received successfully' });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
