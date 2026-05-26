// Pegá tu URL de Google Apps Script acá adentro:
const API_URL = "https://script.google.com/macros/s/AKfycbxPGjhQFBNm3qD30gnxEUv2Kzc12v46qbXdiZIzG31LL8BcEHxKKxHYFSQvnCwSOS1_AQ/exec";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkPrice") {
    
    // Armar la ruta de consulta
    let fetchUrl = `${API_URL}?producto=${encodeURIComponent(request.product)}`;
    if (request.id) {
      fetchUrl += `&id=${encodeURIComponent(request.id)}`;
    }

    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => {
        console.error("Error consultando la API:", err);
        sendResponse({ error: true });
      });

    return true; // Obligatorio para respuestas asíncronas
  }
});