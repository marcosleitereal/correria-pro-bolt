import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, code } = await req.json()

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone number and code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const gupshupApiKey = Deno.env.get('GUPSHUP_API_KEY')
    const gupshupAppId = Deno.env.get('GUPSHUP_APP_ID')
    const gupshupPhoneNumber = Deno.env.get('GUPSHUP_PHONE_NUMBER')

    if (!gupshupApiKey || !gupshupAppId || !gupshupPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Gupshup configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const messageTemplate = `*${code}* é o seu código de verificação. | [Copiar código,https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp${code}]`

    const formData = new URLSearchParams({
      channel: 'whatsapp',
      source: gupshupPhoneNumber,
      destination: phoneNumber.replace('+', ''),
      message: JSON.stringify({
        type: 'text',
        text: messageTemplate
      }),
      'src.name': gupshupAppId
    })

    const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': gupshupApiKey
      },
      body: formData
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Gupshup API error:', responseData)
      return new Response(
        JSON.stringify({ 
          error: `Gupshup API error: ${responseData.message || 'Failed to send message'}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (responseData.status !== 'submitted') {
      console.error('Gupshup message not submitted:', responseData)
      return new Response(
        JSON.stringify({ 
          error: `Message not submitted: ${responseData.message || 'Unknown error'}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.messageId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
