interface SendTemplateMessageParams {
  destinationE164: string;
  templateId?: string;
  params?: string[];
}

interface SendTemplateMessageResult {
  ok: boolean;
  data?: any;
  error?: string;
}

function tryParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendTemplateMessage({
  destinationE164,
  templateId,
  params
}: SendTemplateMessageParams): Promise<SendTemplateMessageResult> {
  if (!process.env.GUPSHUP_API_KEY) {
    throw new Error("Missing GUPSHUP_API_KEY");
  }
  
  if (!process.env.GUPSHUP_SOURCE_NUMBER) {
    throw new Error("Missing GUPSHUP_SOURCE_NUMBER");
  }

  if (!/^\d{10,15}$/.test(destinationE164)) {
    return { 
      ok: false, 
      error: "destination must be E.164 digits only (10-15 digits)" 
    };
  }

  const id = templateId || process.env.GUPSHUP_DEFAULT_TEMPLATE || "verificacao";
  
  if (!params || !Array.isArray(params) || params.length === 0) {
    return { 
      ok: false, 
      error: "params required (array with at least 1 element)" 
    };
  }

  const body = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SOURCE_NUMBER,
    destination: destinationE164,
    "src.name": process.env.GUPSHUP_APP_NAME || "APP",
    template: JSON.stringify({ id, params }),
  });

  const maskedApiKey = process.env.GUPSHUP_API_KEY.slice(0, 6) + "...";
  console.log(`[Gupshup] Sending template message | key: ${maskedApiKey} | template: ${id} | destination: ${destinationE164}`);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "apikey": process.env.GUPSHUP_API_KEY
        },
        body
      });

      const text = await response.text();
      
      if (response.ok) {
        const data = tryParse(text);
        console.log(`[Gupshup] Success | status: ${data.status} | messageId: ${data.messageId}`);
        
        if (data.status === "submitted" || data.status === "queued") {
          return { ok: true, data };
        } else {
          return { 
            ok: false, 
            error: `Message not submitted/queued: ${data.status} - ${data.message || 'Unknown error'}` 
          };
        }
      }

      if ([429, 500, 502, 503, 504].includes(response.status)) {
        const waitTime = 300 * (attempt + 1);
        console.log(`[Gupshup] Retry ${attempt + 1}/3 after ${waitTime}ms | HTTP ${response.status}`);
        await wait(waitTime);
        continue;
      }

      return { 
        ok: false, 
        error: `HTTP ${response.status}: ${text}` 
      };

    } catch (error: any) {
      if (attempt === 2) {
        return { 
          ok: false, 
          error: `Network error after 3 attempts: ${error.message}` 
        };
      }
      
      const waitTime = 300 * (attempt + 1);
      console.log(`[Gupshup] Network error, retry ${attempt + 1}/3 after ${waitTime}ms`);
      await wait(waitTime);
    }
  }

  return { ok: false, error: "Max retries exceeded" };
}
