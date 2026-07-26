/* ============================================================
   SWEET EVENTS — Configuración central
   Cambia aquí el número de WhatsApp, teléfonos o el chatbot IA
   y se aplica a toda la web.
   ============================================================ */
window.SWEET_CONFIG = {
  // Número que recibe las conversiones (formato internacional, sin +)
  whatsapp: "34650968800",

  // Teléfonos de los estudios (se muestran en contacto y footer)
  phones: {
    manresa: ["938 738 476", "650 968 800"],
    vilanova: ["931 187 272", "661 978 516"],
  },

  email: "info@sweetevents.es",

  /* Chatbot IA (opcional):
     - Si chatApi está vacío, el asistente funciona con respuestas
       guiadas y deriva la conversación a WhatsApp (funciona ya).
     - Para activar la IA: sube api/chat.php al hosting, pon tu
       ANTHROPIC_API_KEY dentro de chat.php y escribe aquí la ruta,
       p. ej. "api/chat.php". */
  chatApi: "",
};
