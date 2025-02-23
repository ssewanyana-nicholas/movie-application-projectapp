import fetch from 'node-fetch';
import crypto from 'crypto';

const subscriptionKey = process.env.SUBSCRIPTION_KEY;
const targetEnvironment = process.env.TARGET_ENVIRONMENT;
const callbackUrl = process.env.CALLBACK_URL;
const apiUser = process.env.API_USER;
const apiKeySecret = process.env.API_KEY_SECRET;

let accessToken = null;

const generateAccessToken = async () => {
    const auth = Buffer.from(`${apiUser}:${apiKeySecret}`).toString('base64');
    try {
        const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/token/', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        accessToken = data.access_token;
        console.log('Access token generated:', accessToken);
    } catch (error) {
        console.error('Error generating access token:', error);
    }
};

export const initiatePayment = async (req, res) => {
    const { requestId, msisdn, movieTitle } = req.body;

    if (!accessToken) {
        await generateAccessToken();
    }

    try {
        const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v2_0/requesttopay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'X-Reference-Id': requestId,
                'X-Target-Environment': targetEnvironment,
                'X-Callback-Url': callbackUrl,
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                amount: '100',
                currency: 'UGX',
                externalId: requestId,
                payer: { partyIdType: 'MSISDN', partyId: msisdn },
                payerMessage: `Payment for ${movieTitle}`,
                payeeNote: `Movie Booking`
            })
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: 'Error processing payment' });
    }
};

export const checkPaymentStatus = async (req, res) => {
    const { requestId } = req.params;

    if (!accessToken) {
        await generateAccessToken();
    }

    try {
        const response = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/v2_0/requesttopay/${requestId}`, {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'X-Target-Environment': targetEnvironment,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'Error checking payment status' });
    }
};