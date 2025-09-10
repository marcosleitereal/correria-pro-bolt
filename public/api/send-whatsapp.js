export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber, code, apiKey, appId, senderPhone } = req.body;

  if (!phoneNumber || !code || !apiKey || !appId || !senderPhone) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const messageTemplate = `*${code}* é o seu código de verificação. | [Copiar código,https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp${code}]`;

    const formData = new URLSearchParams({
      channel: 'whatsapp',
      source: senderPhone,
      destination: phoneNumber.replace('+', ''),
      message: messageTemplate,
      'src.name': appId
    });

    const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': apiKey
      },
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Gupshup API error: ${responseData.message || 'Failed to send message'}` 
      });
    }

    if (responseData.status !== 'submitted') {
      return res.status(400).json({ 
        error: `Message not submitted: ${responseData.message || 'Unknown error'}` 
      });
    }

    return res.status(200).json({ 
      success: true, 
      messageId: responseData.messageId 
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
