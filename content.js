// Dibuja la etiqueta y el cuadro de información sobre el precio
function inyectarUI(datosPlanilla, precioActualWeb, elementoDestino) {
  if (elementoDestino.querySelector('.control-badge-inyectado')) return;

  const ultimoCosto = parseFloat(datosPlanilla.ultimoPrecioCompra);
  const stock = datosPlanilla.stockDisponible;
  
  const contenedor = document.createElement('span');
  contenedor.className = 'control-badge-inyectado';
  contenedor.style.cssText = 'position:relative; display:inline-block; margin-left:8px; vertical-align:middle; font-family:sans-serif; z-index: 100;';

  const badge = document.createElement('span');
  badge.style.cssText = 'padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; color:#fff; cursor:help;';

  // Lógica de colores del Semáforo
  if (precioActualWeb <= ultimoCosto) {
    badge.style.backgroundColor = '#2ecc71';
    badge.innerText = `🟢 (¥${ultimoCosto})`;
  } else if (precioActualWeb <= (ultimoCosto * 1.15)) {
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