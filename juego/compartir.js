/* «Compartir por WhatsApp» en Aurora y Arcade. Lo carga cada versión al final de la página (lo agrega
 * npm run conectar-juego), sin tocar el juego: el juego arma el mensaje y un enlace wa.me/?text=…, y este
 * archivo toma el clic antes de que se abra.
 * Por qué: wa.me reenvía a api.whatsapp.com y en ese paso los emojis (🌱 🔥 👉) llegan como «�», y desde
 * iPhone y desde Chrome en Windows el mensaje se perdía al elegir el chat (2026-11-12).
 * - En celular con menú «Compartir» (navigator.share): se abre ese menú con el mensaje y ahí se elige WhatsApp.
 *   Solo se manda el texto (con el enlace adentro): en iPhone, si van texto y enlace por separado, WhatsApp
 *   se queda con uno solo.
 * - En computador (o sin ese menú): se copia el mensaje y se abre api.whatsapp.com/send?text=…, que conserva los
 *   emojis, con un aviso para pegarlo si WhatsApp no lo muestra.
 * No guarda nada. */
(function () {
  var UA = navigator.userAgent;
  var movil = /Android|iPhone|iPad|iPod/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
  var WEB = 'https://api.whatsapp.com/send?text=';

  // Aviso pequeño abajo (se va solo; tocarlo lo cierra). Puede traer un enlace para abrir WhatsApp
  var caja = null, reloj = 0;
  function aviso(texto, enlace) {
    if (!caja) {
      caja = document.createElement('div');
      caja.setAttribute('role', 'status');
      caja.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;' +
        'width:max-content;max-width:min(92vw,460px);padding:14px 18px;border-radius:16px;background:#0F1C16;color:#F4F7F1;' +
        'border:2px solid #D7F65A;box-shadow:0 12px 32px rgba(0,0,0,.45);font:600 15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center';
      caja.addEventListener('click', function (e) { if (!e.target.closest('a')) caja.hidden = true; });
      document.body.appendChild(caja);
    }
    caja.textContent = texto;
    if (enlace) {
      var a = document.createElement('a');
      a.href = enlace; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = 'Abrir WhatsApp';
      a.style.cssText = 'display:block;margin-top:10px;padding:10px 16px;border-radius:999px;background:#D7F65A;color:#0F1C16;text-decoration:none;font-weight:800';
      caja.appendChild(a);
    }
    caja.hidden = false;
    clearTimeout(reloj);
    reloj = setTimeout(function () { caja.hidden = true; }, enlace ? 15000 : 9000);
  }

  function copiar(texto) {
    try {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return false; });
    } catch (e) {}
    return Promise.resolve(false);
  }

  var PEGAR = movil ? 'mantén presionado el campo del mensaje y elige Pegar' : 'pégalo en el chat con Ctrl+V';

  // Computador o sin menú «Compartir»: copia el mensaje y abre WhatsApp con el texto (conserva los emojis)
  function porEnlace(texto, puedeAbrir) {
    var url = WEB + encodeURIComponent(texto);
    var abierta = puedeAbrir ? window.open(url, '_blank', 'noopener') : null;
    copiar(texto).then(function (ok) {
      var base = ok ? 'Copiamos el mensaje: si WhatsApp no lo muestra, ' + PEGAR : 'Si WhatsApp no muestra el mensaje, usa «Copiar mensaje» y pégalo en el chat';
      // window.open con noopener devuelve null aunque abra: si no se pudo abrir con el clic, queda el botón
      aviso(base, puedeAbrir ? null : url);
    });
    return abierta;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me/?text="]') : null;
    if (!a) return;
    var texto;
    try { texto = new URL(a.href).searchParams.get('text'); } catch (x) { return; }
    if (!texto) return;
    e.preventDefault(); // el juego sigue con lo suyo (el sonido del toque); solo no se abre wa.me
    if (movil && navigator.share) {
      navigator.share({ text: texto }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // la persona cerró el menú
        porEnlace(texto, false);
      });
      return;
    }
    porEnlace(texto, true);
  }, true);
})();
