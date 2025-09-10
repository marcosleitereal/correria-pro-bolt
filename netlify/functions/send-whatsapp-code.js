const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { phoneNumber, code } = JSON.parse(event.body);

    if (!phoneNumber || !code) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Phone number and code are required' })
      };
    }

    const gupshupApiKey = process.env.GUPSHUP_API_KEY;
    const gupshupAppId = process.env.GUPSHUP_APP_ID;
    const gupshupPhoneNumber = process.env.GUPSHUP_PHONE_NUMBER;

    if (!gupshupApiKey || !gupshupAppId || !gupshupPhoneNumber) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Gupshup configuration missing' })
      };
    }

    const messageTemplate = `*${code}* é o seu código de verificação. | [Copiar código,https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp${code}]`;

    const formData = new URLSearchParams({
      channel: 'whatsapp',
      source: gupshupPhoneNumber,
      destination: phoneNumber.replace('+', ''), // Remove + for API call
      message: JSON.stringify({
        type: 'text',
        text: messageTemplate
      }),
      'src.name': gupshupAppId
    });

    console.log(`📱 Sending WhatsApp code ${code} to ${phoneNumber}`);
    console.log(`📝 Template: ${messageTemplate}`);

    const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': gupshupApiKey
      },
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Gupshup API error:', responseData);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `Gupshup API error: ${responseData.message || 'Failed to send message'}` 
        })
      };
    }

    if (responseData.status !== 'submitted') {
      console.error('Gupshup message not submitted:', responseData);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `Message not submitted: ${responseData.message || 'Unknown error'}` 
        })
      };
    }

    console.log(`✅ WhatsApp message sent successfully: ${responseData.messageId}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        messageId: responseData.messageId 
      })
    };

  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
