const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Variables de entorno (las configurarás en Render)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

console.log('🚀 Bot WhatsApp Ultimate Sports iniciando...');

// Ruta principal para verificar que funciona
app.get('/', (req, res) => {
  res.send(`
    <h1>🏃‍♂️ Bot WhatsApp Ultimate Sports</h1>
    <p>✅ Bot funcionando correctamente</p>
    <p>📱 Listo para recibir mensajes de WhatsApp</p>
    <p>🤖 Powered by Claude AI</p>
  `);
});

// Webhook para recibir mensajes de WhatsApp
app.post('/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body || '';
    const from = req.body.From || '';
    const profileName = req.body.ProfileName || 'Cliente';
    
    console.log(`📨 Mensaje de ${profileName} (${from}): ${incomingMessage}`);
    
    if (incomingMessage.trim() === '') {
      return res.status(200).send('OK');
    }
    
    // Obtener respuesta de Claude
    const claudeResponse = await getClaudeResponse(incomingMessage, profileName);
    
    // Enviar respuesta por WhatsApp
    await sendWhatsAppMessage(from, claudeResponse);
    
    console.log(`✅ Respuesta enviada a ${profileName}`);
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).send('Error procesando mensaje');
  }
});

// Función para obtener respuesta de Claude
async function getClaudeResponse(message, customerName) {
  try {
    console.log('🧠 Consultando a Claude...');
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Eres un asistente de ventas para "Ultimate Sports Perú", una tienda especializada en equipamiento deportivo.

INFORMACIÓN DE LA TIENDA:
- Vendemos: Ropa deportiva, calzado, equipos de gym, suplementos, accesorios
- Horario: Lunes a Sábado 9am-8pm, Domingos 10am-6pm
- Delivery: Disponible en Lima
- Formas de pago: Efectivo, tarjetas, Yape, Plin

INSTRUCCIONES:
- Saluda por su nombre si es posible: ${customerName}
- Sé amigable, profesional y entusiasta
- Si preguntan por productos específicos, describe brevemente y sugiere visitarnos
- Si preguntan precios, di que varían según modelo y sugiere contacto directo
- Siempre ofrece ayuda adicional al final

Cliente ${customerName} dice: "${message}"

Responde como el asistente de Ultimate Sports:`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    
    const claudeReply = response.data.content[0].text;
    console.log('✅ Claude respondió correctamente');
    return claudeReply;
    
  } catch (error) {
    console.error('❌ Error con Claude:', error.message);
    return `¡Hola ${customerName}! 👋 

Soy el asistente de *Ultimate Sports Perú* 🏃‍♂️

Tenemos todo el equipamiento deportivo que necesitas:
• Ropa deportiva 👕
• Calzado especializado 👟  
• Equipos de gimnasio 🏋️‍♂️
• Suplementos deportivos 💪
• Accesorios fitness ⚽

¿En qué deporte o actividad te puedo ayudar hoy?`;
  }
}

// Función para enviar mensaje por WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Credenciales de Twilio no configuradas');
    }
    
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: 'whatsapp:+14155238886', // Número sandbox de Twilio
      to: to
    });
    
    console.log('📤 Mensaje enviado correctamente');
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.message);
  }
}

// Verificación del webhook (requerido por Twilio)
app.get('/webhook', (req, res) => {
  console.log('✅ Webhook verificado por Twilio');
  res.send('Webhook OK - Ultimate Sports Bot');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌟 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 URL del webhook: https://tu-app.onrender.com/webhook`);
});