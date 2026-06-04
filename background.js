// Pegá tu URL de Google Apps Script acá adentro:
const API_URL = "https://script.google.com/macros/s/AKfycbxPGjhQFBNm3qD30gnxEUv2Kzc12v46qbXdiZIzG31LL8BcEHxKKxHYFSQvnCwSOS1_AQ/exec";

//Creo opciones de click derecho para setear descuento
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "descuento-root",
    title: "Suruga-ya: Descuento Actual",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "desc-0",
    parentId: "descuento-root",
    title: "Sin Descuento (0%)",
    type: "radio",
    checked: true,
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "desc-15",
    parentId: "descuento-root",
    title: "Aplicar 15% OFF",
    type: "radio",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "desc-20",
    parentId: "descuento-root",
    title: "Aplicar 20% OFF",
    type: "radio",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "desc-25",
    parentId: "descuento-root",
    title: "Aplicar 25% OFF",
    type: "radio",
    contexts: ["page"]
  });

  // Descuento en 0% por defecto
  chrome.storage.local.set({ descuentoActual: 0 });
});

chrome.contextMenus.onClicked.addListener((info) => {
  let porcentaje = 0;
  if (info.menuItemId === "desc-15") porcentaje = 15;
  if (info.menuItemId === "desc-20") porcentaje = 20;
  if (info.menuItemId === "desc-25") porcentaje = 25;

  chrome.storage.local.set({ descuentoActual: porcentaje }, () => {
    console.log(`🛒 Descuento del sitio cambiado a: ${porcentaje}%`);

    // Usamos Promesas para que sea compatible tanto con Chrome como con Firefox
    chrome.tabs.query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "refreshCalculos" });
        }
      })
      .catch((err) => console.error("Error al enviar mensaje a la pestaña:", err));
  });
});

// Modificación del receptor de mensajes de Suruga-ya
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkPrice") {

    let fetchUrl = `${API_URL}?producto=${encodeURIComponent(request.product)}`;
    if (request.id) {
      fetchUrl += `&id=${encodeURIComponent(request.id)}`;
    }

    // Buscamos los datos de Google Sheets y el descuento activo en paralelo
    Promise.all([
      fetch(fetchUrl)
        .then(async res => {
          if (!res.ok) {
            console.error(`❌ Error HTTP ${res.status} al consultar: "${request.product}"`);
            return { error: true, encontrado: false };
          }

          // Primero leemos la respuesta como texto plano para auditarla
          const textoRespuesta = await res.text();

          try {
            // Si es un JSON válido, lo parseamos y lo enviamos
            return JSON.parse(textoRespuesta);
          } catch (e) {
            // Si no es JSON (es un HTML de error de Google), lo atajamos acá
            console.warn(`❌ Google no devolvió datos para "${request.product}". Devolvió una página HTML (Saturación de peticiones).`);
            return { error: true, encontrado: false, razon: "GOOGLE_SATURADO" };
          }
        })
        .catch(err => {
          console.warn(`⚠️ Error de red buscando "${request.product}":`, err.message || err);
          return { error: true, encontrado: false, razon: "NET_ERROR" };
        }),

      chrome.storage.local.get("descuentoActual")
    ])
      .then(([dataSheets, storage]) => {
        // Unimos la respuesta (sea exitosa o un error controlado) con el descuento del menú
        const respuestaCombinada = {
          ...dataSheets,
          descuentoActualSitio: storage.descuentoActual || 0
        };
        sendResponse(respuestaCombinada);
      })
      .catch(err => {
        console.error("❌ Error catastrófico en el Background:", err);
        // Como último recurso, si todo falla, nos aseguramos de mandar el 0% para que no crashee
        sendResponse({ error: true, encontrado: false, descuentoActualSitio: 0 });
      });

    return true; // Mantiene el canal de comunicación abierto de forma asíncrona
  }
});