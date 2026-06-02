// Dibuja la etiqueta y el cuadro de información sobre el precio
function inyectarUI(datosPlanilla, precioActualWeb, elementoDestino) {
  // Guardamos o restauramos el HTML original del precio antes de realizar modificaciones
  if (!elementoDestino.dataset.originalHtml) {
    elementoDestino.dataset.originalHtml = elementoDestino.innerHTML;
  } else {
    elementoDestino.innerHTML = elementoDestino.dataset.originalHtml;
  }

  // Removemos el badge anterior si existiera en el contenedor o su padre
  const badgeViejo = elementoDestino.parentNode.querySelector('.control-badge-inyectado') || elementoDestino.querySelector('.control-badge-inyectado');
  if (badgeViejo) badgeViejo.remove();

  const ultimoCosto = parseFloat(datosPlanilla.ultimoPrecioCompra);
  const stock = datosPlanilla.stockDisponible;
  const descActualSitio = datosPlanilla.descuentoActualSitio || 0;

  // Calculamos el precio simulado con descuento aplicado sobre el valor de la web
  const precioConDescuentoAplicado = descActualSitio > 0 
    ? precioActualWeb * (1 - (descActualSitio / 100)) 
    : precioActualWeb;

  // Si descActualSitio es distinto de 0 (y no estamos en la página del carrito), tachamos el original y agregamos el nuevo precio
  if (descActualSitio !== 0 && !window.location.href.includes('/cart/detail')) {
    const textoOriginal = elementoDestino.textContent.trim();
    // Buscamos cualquier número con comas/puntos opcionales
    const matchNumero = textoOriginal.match(/([0-9,.]+)/);
    let textoDescuento = '';
    if (matchNumero) {
      const numeroOriginalStr = matchNumero[1];
      const indexNumero = textoOriginal.indexOf(numeroOriginalStr);
      const prefix = textoOriginal.substring(0, indexNumero);
      const suffix = textoOriginal.substring(indexNumero + numeroOriginalStr.length);
      
      const precioConDescuentoFormateado = Math.round(precioConDescuentoAplicado).toLocaleString('ja-JP');
      textoDescuento = `${prefix}${precioConDescuentoFormateado}${suffix}`;
    } else {
      textoDescuento = `¥${Math.round(precioConDescuentoAplicado).toLocaleString('ja-JP')}`;
    }

    const originalHtml = elementoDestino.innerHTML;
    elementoDestino.innerHTML = '';

    const spanOriginal = document.createElement('span');
    spanOriginal.style.cssText = 'text-decoration: line-through; color: #999 !important;';
    spanOriginal.innerHTML = originalHtml;

    // Asegurarse de que los descendientes del original también se vean grises y tachados
    spanOriginal.querySelectorAll('*').forEach(el => {
      el.style.color = '#999';
      el.style.textDecoration = 'line-through';
    });

    const spanDescuento = document.createElement('span');
    spanDescuento.style.cssText = 'margin-left: 8px;';
    spanDescuento.textContent = textoDescuento;

    elementoDestino.appendChild(spanOriginal);
    elementoDestino.appendChild(spanDescuento);
  }
  
  const contenedor = document.createElement('span');
  contenedor.className = 'control-badge-inyectado';
  contenedor.style.cssText = 'position:relative; display:inline-block; margin-left:8px; vertical-align:middle; font-family:sans-serif; z-index: 100;';

  const badge = document.createElement('span');
  badge.style.cssText = 'padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; color:#fff; cursor:help;';

  // Lógica de colores del Semáforo
  if (precioConDescuentoAplicado <= ultimoCosto) {
    badge.style.backgroundColor = '#2ecc71';
    badge.innerText = `🟢 (¥${ultimoCosto})`;
  } else if (precioConDescuentoAplicado <= (ultimoCosto * 1.15)) {
    badge.style.backgroundColor = '#f1c40f';
    badge.style.color = '#000';
    badge.innerText = `🟡 (¥${ultimoCosto})`;
  } else {
    badge.style.backgroundColor = '#e74c3c';
    badge.innerText = `🔴 (¥${ultimoCosto})`;
  }

  // Cuadro desplegable (Tooltip)
  const tooltip = document.createElement('div');
  tooltip.style.cssText = 'visibility:hidden; opacity:0; position:absolute; bottom:120%; left:50%; transform:translateX(-50%); background:#2c3e50; color:#fff; padding:10px; border-radius:6px; width:220px; font-size:12px; line-height:1.4; box-shadow:0 4px 10px rgba(0,0,0,0.3); transition:all 0.2s;';
  
  tooltip.innerHTML = `
    <div style="color:#f39c12; font-weight:bold; border-bottom:1px solid #555; margin-bottom:5px;">Datos RESTOCK</div>
    <b>Artículo:</b> ${datosPlanilla.productoOriginal}<br>
    <b>Costo Histórico:</b> ¥${ultimoCosto}<br>
    <b>Llegada:</b> ${datosPlanilla.fechaCompra}<br>
    <div style="margin-top:5px; padding-top:5px; border-top:1px solid #444; font-weight:bold;">
      <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
        <span>Precio Web:</span>
        <span style="color:lightgray">¥${precioActualWeb.toFixed(0)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
        <span style="color:#e74c3c;">Con Descuento (${descActualSitio}%):</span>
        <span style="color:${descActualSitio > 0 ? '#2ecc71' : 'lightgray'}">¥${precioConDescuentoAplicado.toFixed(0)}</span>
      </div>
    </div>
    <b style="color:${stock > 0 ? '#2ecc71' : '#e74c3c'}">Stock Total:</b> ${stock} un.<br>
    <div style="font-size:10px; color:#aaa; margin-top:5px;">Match: ${datosPlanilla.matchConfianza}</div>
  `;

  badge.onmouseenter = () => { tooltip.style.visibility = 'visible'; tooltip.style.opacity = '1'; };
  badge.onmouseleave = () => { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; };

  contenedor.appendChild(badge);
  contenedor.appendChild(tooltip);
  elementoDestino.appendChild(contenedor);
}

// Escanea Suruga-ya para extraer los datos
function procesarProductosSurugaya() {
  const items = document.querySelectorAll('.item, .product-item'); 
  
  items.forEach(item => {
    if (item.dataset.procesado) return;
    
    // Extraer ID de la URL interna del producto
    const linkEl = item.querySelector('a[href*="/product/detail/"]');
    if (!linkEl) return;
    const idMatch = linkEl.href.match(/\/product\/detail\/(\d+)/);
    const idProducto = idMatch ? idMatch[1] : null;
    
    // Extraer Título y Precio
    const titleEl = item.querySelector('.title, .item-title, p.name');
    const priceEl = item.querySelector('.price, .item-price, .text-price-detail');
    
    if (titleEl && priceEl) {
      item.dataset.procesado = "true";
      const titulo = titleEl.innerText.trim();
      // Limpia el precio japonés para obtener un número entero
      const precioNum = parseFloat(priceEl.innerText.replace(/[^0-9.-]+/g,""));
      
      chrome.runtime.sendMessage({
        action: "checkPrice",
        product: titulo,
        id: idProducto,
        price: precioNum
      }, (response) => {
        if (response && response.encontrado) {
          inyectarUI(response, precioNum, priceEl);
        }
      });
    }
  });
}

// Mantener la extensión alerta mientras scrolleas o cambiás de página
const observador = new MutationObserver(() => procesarProductosSurugaya());
observador.observe(document.body, { childList: true, subtree: true });

// Activar primera carga
setTimeout(procesarProductosSurugaya, 1500);

// Escuchar mensajes desde el background script (por ejemplo, para actualizar cálculos)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refreshCalculos") {
    // Limpiar el estado de procesado de los productos para forzar el recalculo
    const items = document.querySelectorAll('.item, .product-item');
    items.forEach(item => {
      delete item.dataset.procesado;
    });
    procesarProductosSurugaya();
  }
});