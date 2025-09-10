import express from 'express';
import { sendTemplateMessage } from '../lib/gupshup';

const router = express.Router();

router.post('/send-otp', async (req, res) => {
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
    const codeParam = String(code);

    const result = await sendTemplateMessage({
      destinationE164,
      templateId,
      params: [codeParam]
    });

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error('[WA Route] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
