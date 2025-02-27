import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const subscriptionKey = process.env.SUBSCRIPTION_KEY;
const targetEnvironment = process.env.TARGET_ENVIRONMENT;
const callbackUrl = process.env.CALLBACK_URL;

if (!subscriptionKey || !targetEnvironment || !callbackUrl) {
    console.error('Missing required environment variables');
}

let accessToken = null;
let apiUser = null;
let apiKeySecret = null;

const generateApiUser = async () => {
    const requestId = uuidv4(); // Generate a UUID for X-Reference-Id
    const config = {
        method: 'post',
        url: 'https://sandbox.momodeveloper.mtn.com/v1_0/apiuser',
        headers: {
            'X-Reference-Id': requestId,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/json'
        },
        data: {
            providerCallbackHost: callbackUrl
        }
    };

    try {
        await axios(config);
        apiUser = requestId;
        console.log('API User generated:', apiUser);
    } catch (error) {
        console.error('Error generating API User:', error.response ? error.response.data : error.message);
    }
};

const generateApiKeySecret = async () => {
    const config = {
        method: 'post',
        url: `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${apiUser}/apikey`,
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    };

    try {
        const response = await axios(config);
        apiKeySecret = response.data.apiKey;
        console.log('API Key Secret generated:', apiKeySecret);
    } catch (error) {
        console.error('Error generating API Key Secret:', error.response ? error.response.data : error.message);
    }
};

const generateAccessToken = async () => {
    if (!apiUser || !apiKeySecret) {
        await generateApiUser();
        await generateApiKeySecret();
    }

    const auth = Buffer.from(`${apiUser}:${apiKeySecret}`).toString('base64');
    const config = {
        method: 'post',
        url: 'https://sandbox.momodeveloper.mtn.com/collection/token/',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(config);
        accessToken = response.data.access_token;
        console.log('Access token generated:', accessToken);
    } catch (error) {
        console.error('Error generating access token:', error.response ? error.response.data : error.message);
    }
};

export const initiatePayment = async (req, res) => {
    const { msisdn, movieTitle } = req.body;
    const requestId = uuidv4(); // Generate a UUID

    if (!accessToken) {
        await generateAccessToken();
    }

    if (!accessToken) {
        return res.status(500).json({ error: 'Failed to generate access token' });
    }

    const data = {
        amount: '100',
        currency: 'EUR',
        externalId: requestId,
        payer: { partyIdType: 'MSISDN', partyId: msisdn },
        payerMessage: `Payment for ${movieTitle}`,
        payeeNote: `Movie Booking`
    };

    const config = {
        method: 'post',
        url: 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'X-Reference-Id': requestId,
            'X-Target-Environment': targetEnvironment,
            'Authorization': `Bearer ${accessToken}`
        },
        data: data
    };

    try {
        const response = await axios(config);
        res.json(response.data);
    } catch (error) {
        console.error('Error processing payment:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error processing payment' });
    }
};

export const checkPaymentStatus = async (req, res) => {
    const { requestId } = req.params;

    if (!accessToken) {
        await generateAccessToken();
    }

    if (!accessToken) {
        return res.status(500).json({ error: 'Failed to generate access token' });
    }

    const config = {
        method: 'get',
        url: `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${requestId}`,
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'X-Target-Environment': targetEnvironment,
            'Authorization': `Bearer ${accessToken}`
        }
    };

    try {
        const response = await axios(config);
        res.json(response.data);
    } catch (error) {
        console.error('Error checking payment status:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error checking payment status' });
    }
};