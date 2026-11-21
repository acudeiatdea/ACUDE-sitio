/* Paletas claras para Aurora y Arcade (2026-11-13): Arena (cálida, arena y terracota) y Lavanda (lila suave).
 * Lo carga cada versión al final de la página (lo agrega npm run conectar-juego), sin tocar el juego: agrega las dos
 * paletas al final del botón Colores, después de las del juego.
 * El juego es del TdeA y arranca en verde: Aurora en «Día» (verde claro, como el modo claro del sitio) y Arcade en
 * «Musgo» (la suya de siempre). Lo que alguien ya eligió se respeta; la de entrada no se guarda, solo lo que se elige.
 * Eco y las personas no cambian con Arena ni Lavanda:
 * - Aurora: sus colores de página y del escenario están en ../colores-aurora.css (npm run colores-aurora)
 * - Arcade: la pantalla (con las personas y Eco) y la mascota se quedan con los colores de Musgo; cambian la página,
 *   la consola y los botones, en ../colores-arcade.css */
(function () {
  var leer = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var agregar = function (PAL, nuevas) { Object.keys(nuevas).forEach(function (k) { if (!(k in PAL)) PAL[k] = nuevas[k]; }); };

  // ---------- Aurora ----------
  if (typeof palKey !== 'undefined' && typeof PALETTES !== 'undefined' && PALETTES.aurora) {
    var ENTRADA = 'dia';
    agregar(PALETTES, {
      arena: { name: 'Arena', hint: 'Clara y cálida, en arena y terracota', sw: ['#f3ede2', '#fbf8f2', '#a4512f', '#2e2620'] },
      lavanda: { name: 'Lavanda', hint: 'Clara y suave, en lila', sw: ['#eeebf5', '#faf9fd', '#5b4c9e', '#29243b'] }
    });
    // Aurora guarda su paleta («aurora») apenas abre, así que eso no dice si alguien la eligió, y como Arena y
    // Lavanda se agregan después, al abrir no las reconoce. Por eso la que se escoge con el botón Colores se guarda
    // también en ELEGIDA. Una distinta de «aurora» guardada de antes también cuenta como elegida
    var ELEGIDA = 'sin-etiquetas-paleta-elegida';
    var originalAurora = applyPalette;
    var elegida = leer(ELEGIDA), guardada = leer('mod-pal');
    if (elegida && PALETTES[elegida]) { if (elegida !== palKey) originalAurora(elegida); }
    else if (!(guardada && guardada !== 'aurora' && PALETTES[guardada])) {
      palKey = ENTRADA; // eslint-disable-line no-global-assign
      document.documentElement.setAttribute('data-pal', ENTRADA);
    }
    applyPalette = function (k) { // eslint-disable-line no-global-assign
      var r = originalAurora.apply(this, arguments);
      try { localStorage.setItem(ELEGIDA, k); } catch (e) {}
      return r;
    };
    return;
  }

  // ---------- Arcade ----------
  if (typeof curPal !== 'undefined' && typeof PALETTES !== 'undefined' && PALETTES.musgo) {
    var M = PALETTES.musgo;
    // La pantalla y la mascota (Eco) toman lime, lime-lo, lime-hi, bezel y lcd0 a lcd3 de la raíz: se quedan como
    // en Musgo. La página, la consola y el texto sobre ella sí cambian; los botones, en colores-arcade.css
    var base = function (o) { var p = {}; Object.keys(M).forEach(function (k) { p[k] = M[k]; }); Object.keys(o).forEach(function (k) { p[k] = o[k]; }); return p; };
    agregar(PALETTES, {
      arena: base({ name: 'ARENA', hint: 'Clara y cálida, en arena y terracota', page: '#f3ede2', shell: '#d9c6aa', 'shell-hi': '#e6d7c0', 'shell-lo': '#c4ab89', 'ink-shell': '#4f3d2f' }),
      lavanda: base({ name: 'LAVANDA', hint: 'Clara y suave, en lila', page: '#eeebf5', shell: '#cfc7e3', 'shell-hi': '#ddd7ee', 'shell-lo': '#b9aed4', 'ink-shell': '#3b3357' })
    });
    // El juego llama a applyPalette en cada cambio: además de lo suyo, se marca cuál quedó para colores-arcade.css
    var original = applyPalette;
    applyPalette = function () { // eslint-disable-line no-global-assign
      var r = original.apply(this, arguments);
      var alto = typeof a11yOn !== 'undefined' && a11yOn; // con alto contraste mandan los colores del juego
      if (!alto && (curPal === 'arena' || curPal === 'lavanda')) document.documentElement.setAttribute('data-paleta', curPal);
      else document.documentElement.removeAttribute('data-paleta');
      return r;
    };
    // Arcade arranca en Musgo por su cuenta. Si alguien eligió Arena o Lavanda, al abrir el juego no las conocía:
    // se ponen aquí
    var g = leer('moda-palette');
    if (g === 'arena' || g === 'lavanda') applyPalette(g);
  }
})();
