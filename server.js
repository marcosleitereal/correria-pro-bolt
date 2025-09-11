import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function validatePhoneNumber(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  return /^\d{10,15}$/.test(cleaned);
}

async function sendTemplateMessage(destination, code, templateId = process.env.GUPSHUP_DEFAULT_TEMPLATE) {
  const url = 'https://api.gupshup.io/wa/api/v1/template/msg';
  
  const formData = new URLSearchParams();
  formData.append('channel', 'whatsapp');
  formData.append('source', process.env.GUPSHUP_SOURCE_NUMBER);
  formData.append('destination', destination);
  formData.append('src.name', process.env.GUPSHUP_APP_NAME);
  formData.append('template', JSON.stringify({
    id: templateId,
    params: [code]
  }));

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': process.env.GUPSHUP_API_KEY
    },
    body: formData
  };

  console.log(`📤 Chamando: ${url}`);
  console.log(`🔑 API Key: ${process.env.GUPSHUP_API_KEY ? process.env.GUPSHUP_API_KEY.substring(0, 8) + '...' : 'N/A'}`);
  console.log(`📱 Destino: ${destination}`);
  console.log(`🎯 Template: ${templateId}`);
  console.log(`🔢 Código: ${code}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, options);
      
      console.log(`📊 HTTP Status: ${response.status}`);
      
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⚠️ Status ${response.status} - Tentativa ${attempt}/3. Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      const responseData = await response.json();
      
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          status: response.status,
          error: responseData,
          attempt,
          destination,
          template: templateId
        };
      }
      
      return {
        success: response.ok,
        status: response.status === 202 ? "submitted" : response.status,
        messageId: responseData.messageId || responseData.id,
        destination,
        template: templateId,
        attempt,
        gupshupResponse: responseData
      };
      
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`❌ Tentativa ${attempt} falhou: ${error.message}. Tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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
    
    if (!validatePhoneNumber(destinationE164)) {
      return res.status(400).json({
        success: false,
        error: 'destination must be E.164 digits only (10-15 digits) and include DDI'
      });
    }

    const result = await sendTemplateMessage(destinationE164, String(code), templateId);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
        destination: result.destination,
        template: result.template,
        attempt: result.attempt
      });
    }

    return res.status(202).json({
      success: true,
      status: result.status,
      messageId: result.messageId,
      destination: result.destination,
      template: result.template,
      attempt: result.attempt,
      gupshupResponse: result.gupshupResponse
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
  const maskedApiKey = process.env.GUPSHUP_API_KEY?.slice(0, 8) + '...' || 'sk_****...';
  console.log(`[Server] WA server ready on port ${PORT} | key: ${maskedApiKey}`);
});
