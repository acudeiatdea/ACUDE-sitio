/* Créditos del juego: botón «Integrantes del ACUDE» en la pantalla de créditos de Aurora y de la Arcade.
 * Los nombres se leen de creditos.json ([{ "grupo": "...", "nombres": ["...", ...] }, ...]): para quitar o agregar
 * a alguien se edita ese archivo, sin tocar el código. La lista se abre en una ventana con el estilo de la ayuda
 * de cada versión. Lo carga cada versión al final de la página (lo agrega npm run conectar-juego). */
(() => {
  const ARCHIVO = new URL('creditos.json', document.currentScript.src).href;
  const crea = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto) e.textContent = texto; return e; };

  // Estilos propios de la lista; el resto lo pone la ventana de ayuda de cada juego (.help y .help-card)
  const st = crea('style');
  st.textContent = [
    '#integrantes .help-card { gap: 12px; }',
    '#integrantes h3 { margin: 10px 0 2px; font-size: 1.05em; }',
    '#integrantes ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px 14px; grid-template-columns: repeat(auto-fill, minmax(min(135px, 100%), 1fr)); }',
    '#integrantes li { overflow-wrap: anywhere; line-height: 1.3; }',
    '#integrantes .integrantes-nota { margin-top: 8px; opacity: .85; }',
    // En celular, nombres un poco más pequeños para que cada uno quepa en una línea de su columna
    '@media (max-width: 599px) { #integrantes .help-card { padding-inline: 14px; } #integrantes ul { column-gap: 10px; } #integrantes li { font-size: 14px; } }',
  ].join('\n');
  document.head.appendChild(st);

  // La ventana se arma una vez; los nombres se cargan cada vez que se abre, por si cambió el archivo
  let caja = null, tarjeta = null, desde = null;
  function ventana() {
    if (caja) return;
    caja = crea('div', 'help');
    caja.id = 'integrantes';
    caja.hidden = true;
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'integrantes-titulo');
    tarjeta = crea('div', 'help-card');
    caja.appendChild(tarjeta);
    caja.addEventListener('click', (e) => { if (e.target === caja) cerrar(); });
    document.body.appendChild(caja);
    // Mientras está abierta, las teclas no mueven el juego de atrás; Escape la cierra
    document.addEventListener('keydown', (e) => {
      if (caja.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      if (e.key !== 'Tab') e.stopImmediatePropagation();
    }, true);
  }
  function cerrar() {
    caja.hidden = true;
    if (desde) desde.focus({ preventScroll: true });
  }
  async function abrir(boton) {
    ventana();
    desde = boton || null;
    tarjeta.replaceChildren(crea('h2', '', 'Integrantes del ACUDE'));
    tarjeta.querySelector('h2').id = 'integrantes-titulo';
    const cuerpo = crea('div', '');
    cuerpo.appendChild(crea('p', '', 'Cargando la lista…'));
    tarjeta.appendChild(cuerpo);
    const cierra = crea('button', 'help-close', 'Cerrar');
    cierra.type = 'button';
    cierra.addEventListener('click', cerrar);
    tarjeta.appendChild(cierra);
    caja.hidden = false;
    tarjeta.scrollTop = 0;
    cierra.focus({ preventScroll: true });
    try {
      const r = await fetch(ARCHIVO, { cache: 'no-cache' });
      const grupos = (await r.json()).filter((g) => g && g.grupo && Array.isArray(g.nombres) && g.nombres.length);
      cuerpo.replaceChildren();
      // El número de estudiantes y de grupos sale del archivo: «151 estudiantes de los seis grupos…»
      const total = grupos.reduce((t, g) => t + g.nombres.filter(Boolean).length, 0);
      const PALABRAS = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
      const cuantos = grupos.length === 1 ? 'del grupo' : `de los ${PALABRAS[grupos.length] || grupos.length} grupos`;
      cuerpo.appendChild(crea('p', '', `${total} ${total === 1 ? 'estudiante' : 'estudiantes'} ${cuantos} del ACUDE Herramientas de IA ${total === 1 ? 'construyó' : 'construyeron'} este juego`));
      grupos.forEach((g) => {
        cuerpo.appendChild(crea('h3', '', g.grupo));
        const ul = crea('ul', '');
        g.nombres.filter(Boolean).forEach((n) => ul.appendChild(crea('li', '', n)));
        cuerpo.appendChild(ul);
      });
    } catch (e) {
      cuerpo.replaceChildren(crea('p', '', 'No se pudo cargar la lista en este momento'));
    }
    cuerpo.appendChild(crea('p', 'integrantes-nota', 'Si no quieres aparecer, escríbele a la profe'));
  }

  // Aurora: botón encima de «Volver al inicio»
  if (typeof window.showCredits === 'function') {
    const original = window.showCredits;
    window.showCredits = function () {
      original.apply(this, arguments);
      const controls = document.getElementById('controls');
      if (!controls) return;
      const b = crea('button', '', 'Integrantes del ACUDE');
      b.type = 'button';
      b.id = 'btn-integrantes';
      b.addEventListener('click', () => abrir(b));
      controls.insertBefore(b, controls.firstChild);
    };
  }

  // Arcade: una opción en la pantalla de créditos; el botón A también la abre y B vuelve
  if (typeof window.credits === 'function' && document.getElementById('screen')) {
    const original = window.credits;
    window.credits = function () {
      original.apply(this, arguments);
      const screen = document.getElementById('screen');
      const box = crea('div', 'menu');
      const b = crea('button', 'menu-item sel');
      b.type = 'button';
      b.id = 'btn-integrantes';
      b.appendChild(crea('span', '', 'INTEGRANTES DEL ACUDE'));
      b.addEventListener('click', () => abrir(b));
      box.appendChild(b);
      screen.appendChild(box);
      // H es «let» en el juego: no está en window, pero se alcanza por su nombre desde este archivo
      /* global H */
      if (typeof window.setAB === 'function' && typeof H === 'object' && H) {
        const volver = H.b;
        window.setAB(['B', 'VOLVER'], ['A', 'NOMBRES']);
        H.a = () => abrir(b);
        H.b = volver;
      }
    };
  }
})();
