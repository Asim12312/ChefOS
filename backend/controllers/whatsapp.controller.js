// @desc    WhatsApp Webhook Verification (Meta requirement)
// @route   GET /api/whatsapp/webhook
// @access  Public
export const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'menusphere_whatsapp_token';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

// @desc    Handle incoming WhatsApp messages
// @route   POST /api/whatsapp/webhook
// @access  Public
export const handleIncomingMessage = async (req, res, next) => {
    try {
        const body = req.body;

        // Check if this is an event from a WhatsApp API
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from; // sender phone number
                const msgBody = body.entry[0].changes[0].value.messages[0].text.body; // message text

                console.log(`WhatsApp message from ${from}: ${msgBody}`);

                // AI Chatbot Integration Point
                // 1. Check user state (e.g., is ordering?)
                // 2. Send to OpenAI / Dialogflow
                // 3. Process intent (See Menu, Order Item, Status)

                // For now, simple echo via console (Mock response logic would go here)

                // Emit socket event for "Live Chat" view in dashboard
                const io = req.app.get('io');
                // Determining restaurant ID would require mapping Phone Number -> Restaurant
                // For demo, we might emit to a global or specific debug channel
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
};
