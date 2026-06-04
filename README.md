# IMPORTANTE
### Para usar en Chromium: 
- reemplazar '"scripts": ["background.js"]' por '"service_worker": "background.js"' en manifest.json
- añadir al final del manifest.json lo siguiente (antes del cierre de la ultima } y agregando una coma luego del ultimo ]):
  "browser_specific_settings": {
    "gecko": {
      "id": "compare-ya@origami.store"
    }
  }