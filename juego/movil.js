/* Ajustes del juego en celular (menos de 600 px de ancho), para Aurora y Arcade. En computador no hace nada.
 * Lo carga cada versión al final de la página (lo agrega npm run conectar-juego). */
(() => {
  const movil = window.matchMedia('(max-width: 599px)');
  const suave = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  // Aurora: al responder, la pantalla baja sola hasta la explicación y el botón para seguir queda a la vista,
  // justo debajo de la explicación y por encima de la barra de Menú y Ayuda
  const controls = document.getElementById('controls');
  const stage = document.getElementById('stage');
  const dockAurora = document.querySelector('.dock');
  if (controls && stage && dockAurora) {
    new MutationObserver(() => {
      if (!movil.matches) return;
      const fb = stage.querySelector('.feedback');
      const seguir = controls.querySelector('button:not([disabled])');
      if (!fb || !seguir || !controls.classList.contains('single')) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const barra = dockAurora.getBoundingClientRect().top;
        const arriba = fb.getBoundingClientRect().top - 10;
        const abajo = seguir.getBoundingClientRect().bottom + 12;
        // La explicación arriba; si con el botón no cabe, se baja solo lo necesario para que el botón se vea
        const cuanto = abajo - arriba <= barra ? arriba : abajo - barra;
        if (Math.abs(cuanto) > 4) window.scrollBy({ top: cuanto, behavior: suave });
      }));
    }).observe(controls, { childList: true });
  }

  // Arcade: Efectos y Récords (o Pausa) en la barra de abajo, junto a la música; repiten los botones de la consola
  const efectos = document.getElementById('btn-select');
  const inicio = document.getElementById('btn-start');
  const lblEfectos = document.getElementById('lbl-select');
  const lblInicio = document.getElementById('lbl-start');
  const musica = document.getElementById('btn-qmusic');
  if (efectos && inicio && lblEfectos && lblInicio && musica) {
    const svg = (cuerpo) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + cuerpo + '</svg>';
    const PARLANTE = svg('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line class="slash" x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>');
    const TROFEO = svg('<path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 13h4v3h-4zM8 18h8v2H8z" fill="currentColor"/>');
    const PAUSA = svg('<rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/>');
    const boton = (id, alClic) => {
      const b = document.createElement('button');
      b.type = 'button'; b.id = id; b.className = 'quick-btn solo-movil';
      b.addEventListener('click', alClic);
      return b;
    };
    const fx = boton('btn-qfx', () => efectos.click());
    const rec = boton('btn-qstart', () => inicio.click());
    fx.innerHTML = PARLANTE;
    musica.after(fx, rec);
    const pinta = () => {
      const on = !/NO\s*$/i.test(lblEfectos.textContent.trim());
      fx.setAttribute('aria-pressed', on ? 'true' : 'false');
      fx.setAttribute('aria-label', 'Efectos de sonido: ' + (on ? 'sí' : 'no'));
      fx.title = fx.getAttribute('aria-label');
      const t = lblInicio.textContent.trim();
      rec.hidden = !t;
      const pausa = /PAUSA/i.test(t);
      rec.innerHTML = pausa ? PAUSA : TROFEO;
      rec.setAttribute('aria-label', pausa ? 'Pausa' : 'Récords');
      rec.title = rec.getAttribute('aria-label');
    };
    pinta();
    // En celular el botón de ayuda dice solo «Ayuda» con un ícono, para caber en una línea; su nombre para
    // lectores de pantalla sigue siendo el completo («¿Necesitas ayuda ahora?»)
    const ayuda = document.getElementById('btn-help');
    if (ayuda && !ayuda.querySelector('.ayuda-corta')) {
      const largo = ayuda.textContent.trim();
      ayuda.setAttribute('aria-label', largo);
      ayuda.textContent = '';
      const l = document.createElement('span'); l.className = 'ayuda-larga'; l.textContent = largo;
      const c = document.createElement('span'); c.className = 'ayuda-corta'; c.setAttribute('aria-hidden', 'true');
      c.innerHTML = svg('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.3" fill="currentColor"/>') + 'Ayuda';
      ayuda.append(l, c);
    }
    const obs = new MutationObserver(pinta);
    [lblEfectos, lblInicio].forEach((n) => obs.observe(n, { childList: true, characterData: true, subtree: true }));
  }
})();
