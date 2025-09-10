import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

app.post('/api/wa/send-otp', async (req, res) => {
  try {
    const { destination, code, templateId } = req.body || {};

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: 'destination is required'
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'code is required'
      });
    }

    const destinationE164 = String(destination).replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(destinationE164)) {
      return res.status(400).json({
        success: false,
        error: 'destination must be E.164 digits only (10-15 digits) and include DDI'
      });
    }

    const template_id = templateId || process.env.GUPSHUP_DEFAULT_TEMPLATE || 'verificacao';
    const codeParam = String(code);

    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: process.env.GUPSHUP_SOURCE_NUMBER,
      destination: destinationE164,
      'src.name': process.env.GUPSHUP_APP_NAME || 'APP',
      template: JSON.stringify({ id: template_id, params: [codeParam] })
    });

    const apiUrl = 'https://api.gupshup.io/wa/api/v1/template/msg';
    const maskedApiKey = process.env.GUPSHUP_API_KEY?.slice(0, 4) + '...' || 'sk_****...';
    
    console.log(`[Gupshup] Sending template message | URL: ${apiUrl} | key: ${maskedApiKey} | template: ${template_id} | destination: ${destinationE164}`);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apikey': process.env.GUPSHUP_API_KEY
          },
          body
        });

        const text = await response.text();
        
        if (response.ok) {
          const data = tryParse(text);
          console.log(`[Gupshup] Success | status: ${data.status} | messageId: ${data.messageId}`);
          
          if (data.status === 'submitted' || data.status === 'queued') {
            return res.json({
              success: true,
              data
            });
          } else {
            return res.status(400).json({
              success: false,
              error: `Message not submitted/queued: ${data.status} - ${data.message || 'Unknown error'}`
            });
          }
        }

        if ([429, 500, 502, 503, 504].includes(response.status)) {
          const waitTime = 300 * (attempt + 1);
          console.log(`[Gupshup] Retry ${attempt + 1}/3 after ${waitTime}ms | HTTP ${response.status}`);
          await wait(waitTime);
          continue;
        }

        return res.status(400).json({
          success: false,
          error: `HTTP ${response.status}: ${text}`
        });

      } catch (error) {
        if (attempt === 2) {
          return res.status(500).json({
            success: false,
            error: `Network error after 3 attempts: ${error.message}`
          });
        }
        
        const waitTime = 300 * (attempt + 1);
        console.log(`[Gupshup] Network error, retry ${attempt + 1}/3 after ${waitTime}ms`);
        await wait(waitTime);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Max retries exceeded'
    });

  } catch (error) {
    console.error('[WA Route] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  const maskedApiKey = process.env.GUPSHUP_API_KEY?.slice(0, 4) + '...' || 'sk_****...';
  console.log(`[Server] WA server ready on port ${PORT} | key: ${maskedApiKey}`);
});
