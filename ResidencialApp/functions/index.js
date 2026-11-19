/**
 * CEREZAL DE SAN LUIS - NÚCLEO DE LLAMADAS SEGURAS (MODO UBER)
 * REVISIÓN: v2.1 - COLOMBIA PREFIX FIX
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const twilio = require("twilio");

initializeApp();

// Función auxiliar para normalizar números a formato Colombia (+57)
const formatNumber = (num) => {
  let clean = num.replace(/\D/g, '');
  if (clean.length === 10) return `+57${clean}`; // Celular estándar COL
  if (clean.startsWith('57') && clean.length === 12) return `+${clean}`;
  return clean.startsWith('+') ? clean : `+${clean}`;
};

exports.makeSecureCall = onCall({ 
  cors: true,
  region: "us-central1"
}, async (request) => {
  
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "No tiene permisos para iniciar llamadas.");
  }

  let { targetPhone, porterPhone } = request.data;
  
  if (!targetPhone || !porterPhone) {
    throw new HttpsError("invalid-argument", "Faltan números para establecer el puente.");
  }

  // Normalizamos a formato internacional Colombia
  targetPhone = formatNumber(targetPhone);
  porterPhone = formatNumber(porterPhone);

  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;

  if (!sid || !token || !twilioNumber) {
    throw new HttpsError("failed-precondition", "Configuración de Twilio incompleta en el servidor.");
  }

  const client = twilio(sid, token);

  try {
    const callFlow = await client.calls.create({
      from: twilioNumber,
      to: porterPhone,
      twiml: `
        <Response>
          <Say language="es-MX">Conectando llamada segura de Cerezal de San Luis...</Say>
          <Dial callerId="${twilioNumber}">${targetPhone}</Dial>
        </Response>
      `,
    });

    return { 
      success: true, 
      sid: callFlow.sid
    };

  } catch (err) {
    console.error("ERROR TWILIO:", err);
    throw new HttpsError("internal", "Falla en enlace: " + err.message);
  }
});
