// =====================================================================
// SCRIPT DE CONTENIDO - VALIDADOR DE STOCK (SURUGA-YA EN)
// Soporta: Buscador, Wishlist, Carrito y Vista de Producto Individual
// =====================================================================

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
  if (badgeViejo) {
    if (badgeViejo.dataset.tooltipId) {
      const tooltipViejo = document.getElementById(badgeViejo.dataset.tooltipId);
      if (tooltipViejo) tooltipViejo.remove();
    }
    badgeViejo.remove();
  }

  const descActualSitio = datosPlanilla.descuentoActualSitio || 0;

  // DETECCION DE CARRITO: Evaluamos si la URL actual corresponde al checkout
  const esCarrito = window.location.href.includes('/cart');

  // Calculamos el precio simulado SÓLO si no estamos en el carrito
  const precioConDescuentoAplicado = (descActualSitio > 0 && !esCarrito)
    ? precioActualWeb * (1 - (descActualSitio / 100))
    : precioActualWeb;

  // EFECTO DE TACHADO VISUAL (Se omite en el carrito para no deformar la tabla)
  if (descActualSitio !== 0 && !esCarrito) {
    const textoOriginal = elementoDestino.textContent.trim();
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
    // Forzamos text-decoration lineal y reseteamos cualquier desvío de herencia del sitio
    spanOriginal.style.cssText = 'display: inline-block; text-decoration: line-through #999 !important; text-decoration-style: solid !important; color: #999 !important; font-size: 0.9em;';
    spanOriginal.innerHTML = originalHtml;

    spanOriginal.querySelectorAll('*').forEach(el => {
      el.style.color = '#999';
      // Limpiamos los tachados de los elementos hijos para que no se superpongan abajo
      el.style.textDecoration = 'none';
    });

    const spanDescuento = document.createElement('span');
    spanDescuento.style.cssText = 'margin-left: 8px; color: #0010b3; font-weight: bold;';
    spanDescuento.textContent = textoDescuento;

    elementoDestino.appendChild(spanOriginal);
    elementoDestino.appendChild(spanDescuento);
  }

  // =========================================================================
  // SECCIÓN EXCLUSIVA: SEMÁFORO Y TOOLTIP (Solo si existe en Google Sheets)
  // =========================================================================
  if (datosPlanilla.encontrado) {
    const ultimoCosto = parseFloat(datosPlanilla.ultimoPrecioCompra);
    const stock = datosPlanilla.stockDisponible;

    // Conversión inteligente del descuento histórico (de 0.15 a 15%)
    let descHistoricoCompra = "0%";
    if (datosPlanilla.descuentoHistorico) {
      const valorDesc = parseFloat(datosPlanilla.descuentoHistorico);
      if (!isNaN(valorDesc) && valorDesc > 0 && valorDesc < 1) {
        descHistoricoCompra = `${(valorDesc * 100).toFixed(0)}%`;
      } else if (!isNaN(valorDesc) && valorDesc >= 1) {
        descHistoricoCompra = `${valorDesc.toFixed(0)}%`;
      } else {
        descHistoricoCompra = datosPlanilla.descuentoHistorico;
      }
    }

    // CREACIÓN DEL SEMÁFORO
    const contenedor = document.createElement('span');
    contenedor.className = 'control-badge-inyectado';
    contenedor.style.cssText = 'position:relative; display:inline-block; margin-left:8px; vertical-align:middle; font-family:sans-serif; z-index: 100;';

    const badge = document.createElement('span');
    badge.style.cssText = 'padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; color:#fff; cursor:help;';

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

    // TOOLTIP FLOTANTE (Fijado al Body para evitar recortes de tablas y menú)
    const tooltipId = 'tooltip-' + Math.random().toString(36).substring(2, 9);
    contenedor.dataset.tooltipId = tooltipId; // Lo asociamos para poder borrarlo luego

    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'origami-tooltip-inyectado';
    // Cambiamos a position:fixed para que flote sobre todo el navegador sin que ninguna tabla lo atrape
    tooltip.style.cssText = 'visibility:hidden; opacity:0; position:fixed; background:#2c3e50; color:#fff; padding:10px; border-radius:6px; width:250px; font-size:12px; line-height:1.4; box-shadow:0 4px 10px rgba(0,0,0,0.5); transition:opacity 0.15s ease-in-out; text-align:left; z-index:2147483647; pointer-events:none;';

    // Texto dinámico para no confundir la vista del carrito con la simulación manual
    const lineaPrecioContextual = esCarrito
      ? `<span style="color:#3498db;">Precio Final (Carrito):</span>
         <span style="color:#3498db; font-weight:bold;">¥${Math.round(precioActualWeb)}</span>`
      : `<span style="color:#f1c40f;">Simulado (${descActualSitio}% OFF):</span>
         <span style="color:${descActualSitio > 0 ? '#2ecc71' : 'lightgray'}">¥${Math.round(precioConDescuentoAplicado)}</span>`;

    tooltip.innerHTML = `
      <div style="color:#f39c12; font-weight:bold; border-bottom:1px solid #555; margin-bottom:5px;">Datos RESTOCK</div>
      <b>Artículo:</b> ${datosPlanilla.productoOriginal}<br>
      <b>Último Costo:</b> ¥${ultimoCosto} <span style="color:#f39c12; font-weight:bold;">(${descHistoricoCompra} OFF)</span><br>
      <b>Llegada:</b> ${datosPlanilla.fechaCompra || 'N/A'}<br>
      <hr style="border:0; border-top:1px dashed #555; margin:5px 0;">
      <div style="margin-top:5px; font-weight:bold;">
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span>Precio Web Original:</span>
          <span style="color:lightgray">¥${precioActualWeb.toFixed(0)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          ${lineaPrecioContextual}
        </div>
      </div>
      <b style="color:${stock > 0 ? '#2ecc71' : '#e74c3c'}">Stock Total:</b> ${stock} un.<br>
      <div style="font-size:10px; color:#aaa; margin-top:5px;">Match: ${datosPlanilla.matchConfianza}</div>
    `;

    // Lo inyectamos en el Body, no en el contenedor
    document.body.appendChild(tooltip);

    // Calculamos su posición en pantalla en tiempo real cuando pasás el mouse
    badge.onmouseenter = () => {
      const rect = badge.getBoundingClientRect();
      // Lo posicionamos justo debajo del círculo rojo/amarillo/verde (evita el menú superior)
      tooltip.style.top = (rect.bottom + 8) + 'px';
      // Lo centramos en base al círculo
      tooltip.style.left = (rect.left + (rect.width / 2)) + 'px';
      tooltip.style.transform = 'translateX(-50%)';

      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';
    };

    badge.onmouseleave = () => {
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
    };

    contenedor.appendChild(badge);

    if (elementoDestino.classList.contains('price-big')) {
      elementoDestino.parentNode.appendChild(contenedor);
    } else {
      elementoDestino.appendChild(contenedor);
    }
  }
}

// =====================================================================
// MOTOR DE EXTRACCIÓN MODULAR (Detecta automáticamente la pantalla)
// =====================================================================
function procesarProductosSurugaya() {
  // Atrapamos: Búsqueda (.product_wrap), Wishlist (tr[role="row"]), Carrito (tr.table-active), Producto (.product_detail)
  const items = document.querySelectorAll('.product_wrap, tr[role="row"], tr.table-active, .product_detail');
  items.forEach(item => {
    if (item.dataset.procesado) return;

    let titulo = null;
    let idProducto = null;
    let precioNum = null;
    let priceEl = null;

    // ESCENARIO A: Búsqueda, Wishlist y Carrito (Usan el atributo data-info)
    const linkDataInfo = item.querySelector('a[data-info]');

    if (linkDataInfo) {
      try {
        const dataInfo = JSON.parse(linkDataInfo.getAttribute('data-info'));
        titulo = dataInfo.name;
        idProducto = dataInfo.id;
      } catch (e) { }

      // Respaldo por si el JSON falla
      if (!titulo) titulo = linkDataInfo.innerText.trim();

      // Buscamos el contenedor del precio activo
      priceEl = item.querySelector('.price-new') || item.querySelector('.price_product div');
      if (priceEl) {
        precioNum = parseFloat(priceEl.innerText.replace(/[^0-9.-]+/g, "").replace(/^-/, ""));
      }
    }

    // ESCENARIO B: Vista de Producto Individual (.product_detail)
    else if (item.classList.contains('product_detail')) {
      const titleEl = item.querySelector('h1.title_product');
      // Extraemos el ID del input oculto "shinaban"
      const inputId = item.querySelector('input[name="shinaban"]');
      priceEl = item.querySelector('.price-new.price-big');

      if (titleEl && priceEl) {
        titulo = titleEl.innerText.trim(); // Nota: Va a incluir prefijos como "Anime Mook...", la Sheets deberá hacer match parcial
        if (inputId) idProducto = inputId.value;
        precioNum = parseFloat(priceEl.innerText.replace(/[^0-9.-]+/g, "").replace(/^-/, ""));
      }
    }

    // Si recolectamos con éxito los 3 datos vitales, enviamos la solicitud al servidor
    if (titulo && precioNum > 0 && priceEl) {
      item.dataset.procesado = "true";
      console.log(`📦 [Detección] "${titulo}" | ID: ${idProducto || 'N/A'} | Precio: ¥${precioNum}`);

      chrome.runtime.sendMessage({
        action: "checkPrice",
        product: titulo,
        id: idProducto,
        price: precioNum
      }, (response) => {

        //DEBUG
        //console.log(`🔍 [Debug API] Datos recibidos para "${titulo}":`, response);

        if (response) {
          inyectarUI(response, precioNum, priceEl);
        }
      });
    }
  });
}

// =====================================================================
// EVENT LISTENERS
// =====================================================================

// Mantener la extensión alerta mientras scrolleas (para cargas asíncronas)
const observador = new MutationObserver(() => procesarProductosSurugaya());
observador.observe(document.body, { childList: true, subtree: true });

// Activar primera carga
setTimeout(procesarProductosSurugaya, 1500);

// Escuchar mensajes desde el background.js cuando cambiás el descuento por Clic Derecho
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refreshCalculos") {
    console.log("🔄 Descuento alterado. Recalculando precios en pantalla...");

    // FIX PRECIO: Restaurar el HTML original ANTES de volver a escanear los números
    document.querySelectorAll('[data-original-html]').forEach(el => {
      el.innerHTML = el.dataset.originalHtml;
    });

    // Limpieza de Tooltips huérfanos por seguridad
    document.querySelectorAll('.origami-tooltip-inyectado').forEach(t => t.remove());

    // Limpiamos los flags de las 4 vistas para forzar la re-evaluación
    const items = document.querySelectorAll('.product_wrap, tr[role="row"], tr.table-active, .product_detail');
    items.forEach(item => {
      item.removeAttribute('data-procesado');
    });

    procesarProductosSurugaya();
  }
});