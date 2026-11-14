/* La historia de Eco en cinco capítulos, para las dos versiones del juego (Aurora y Arcade)
 *
 * El contenido vive en la hoja de Google del juego (pestaña contenido). El Action «Contenido del juego»
 * la copia una vez al día a contenido.json, que este archivo lee antes de que arranque el juego.
 * Cada versión trae su contenido escrito por dentro como respaldo: si contenido.json no llega
 * o no sirve, el juego sigue con ese.
 *
 * Qué filas se muestran: estado por validar, aprobado o con cambios; nunca en espera ni descartado;
 * y una fila sensible solo cuando está aprobada. El Action ya filtra, y aquí se vuelve a revisar.
 *
 * Los capítulos dicen su dibujo en ruta (campus, aula, chat, pueblo o plaza), y cada dibujo trae
 * su regalo para Eco: campus la mochila, aula la gorra, chat la bufanda, pueblo las gafas y plaza la corona.
 *
 * Cada vez que empieza un capítulo se sortean 4 de sus afirmaciones y hasta 2 situaciones (JUEGO.sortear), las afirmaciones ordenadas de menor
 * a mayor nivel (1 fácil, 2 con matiz, 3 trampa), sin más de 3 respuestas iguales seguidas, contando
 * también el final del capítulo anterior. Así dos partidas seguidas no traen las mismas.
 */
window.JUEGO = (() => {
  const VISIBLES = ['por validar', 'aprobado', 'con cambios'];
  const REGALO = { campus: 'mochila', aula: 'gorra', chat: 'bufanda', pueblo: 'gafas', plaza: 'corona' };
  const PERFILES = ['observa', 'acompana', 'activa', 'transforma'];
  const se = (f) => f && VISIBLES.includes(f.estado) && !(f.sensible && f.estado !== 'aprobado');
  const mayus = (s) => s.toLocaleUpperCase('es');

  let datos = null;
  try {
    const x = new XMLHttpRequest();
    x.open('GET', new URL('contenido.json', document.currentScript.src).href, false);
    x.send();
    if (x.status === 200) datos = JSON.parse(x.responseText);
  } catch (e) { datos = null; }
  if (!datos || !Array.isArray(datos.capitulos)) return null;

  const lista = (k) => (Array.isArray(datos[k]) ? datos[k].filter(se) : []);
  const capitulos = lista('capitulos').filter((c) => REGALO[c.ruta]).sort((a, b) => a.orden - b.orden);
  const mitos = lista('mitos'), dilemas = lista('dilemas').filter((d) => d.opciones && d.opciones.length === 3);
  const perfiles = lista('perfiles').filter((p) => PERFILES.includes(p.clave));
  const preguntas = lista('preguntas'), ayuda = lista('ayuda');
  const historiaLista = capitulos.length === 5 && capitulos.every((c) => mitos.some((m) => m.capitulo === c.orden));

  // Conserva el orden que ya trae el juego para lo conocido, y lo nuevo va al final en el orden de la hoja
  const ordenar = (filas, previo, clave) => filas
    .map((f, i) => ({ f, i, p: previo.indexOf(clave(f)) }))
    .sort((a, b) => (a.p < 0 ? 1e6 + a.i : a.p) - (b.p < 0 ? 1e6 + b.i : b.p))
    .map((x) => x.f);

  // Sorteo de las afirmaciones de un capítulo
  // Cuántas por capítulo: de contenido.json (reglas), 4 y 2 si no vienen
  const reglas = datos.reglas || {};
  const POR_CAPITULO = reglas.afirmaciones_por_capitulo || 4, MAX_SEGUIDAS = 3;
  const nivelDe = (m) => ([1, 2, 3].includes(m.nivel) ? m.nivel : 2);
  const mezclar = (xs) => { const a = xs.slice(); for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; } return a; };
  const racha = (respuestas) => { let max = 0, n = 0; respuestas.forEach((r, k) => { n = k && r === respuestas[k - 1] ? n + 1 : 1; max = Math.max(max, n); }); return max; };
  let cola = [];   // respuestas del final del capítulo anterior, para no pasar de 3 iguales seguidas entre capítulos
  // Las que salieron la última vez en cada capítulo se guardan en el celular, para preferir otras en la siguiente partida
  const VISTAS = 'sin-etiquetas-vistas';
  const leerVistas = () => { try { return JSON.parse(localStorage.getItem(VISTAS)) || {}; } catch (e) { return {}; } };
  const guardarVistas = (v) => { try { localStorage.setItem(VISTAS, JSON.stringify(v)); } catch (e) {} };
  function sorteo(ids, CLAIMS, clave) {
    const pool = ids.filter((id) => CLAIMS[id]);
    const vistas = leerVistas(), antes = vistas[clave] || [];
    const nuevas = pool.filter((id) => !antes.includes(id)), repetidas = pool.filter((id) => antes.includes(id));
    // Primero las que no salieron la vez pasada, luego las demás; 4, de menor a mayor nivel
    // (dentro de un mismo nivel el orden también es al azar)
    const muestra = () => [...mezclar(nuevas), ...mezclar(repetidas)].slice(0, POR_CAPITULO).sort((a, b) => CLAIMS[a].level - CLAIMS[b].level);
    let elegido = null;
    for (let intento = 0; intento < 200 && !elegido; intento++) {
      const m = muestra();
      if (racha([...cola, ...m.map((id) => CLAIMS[id].answer)]) <= MAX_SEGUIDAS) elegido = m;
    }
    // Si con las nuevas no se puede evitar la racha, se sortea entre todas
    for (let intento = 0; intento < 200 && !elegido; intento++) {
      const m = mezclar(pool).slice(0, POR_CAPITULO).sort((a, b) => CLAIMS[a].level - CLAIMS[b].level);
      if (racha([...cola, ...m.map((id) => CLAIMS[id].answer)]) <= MAX_SEGUIDAS) elegido = m;
    }
    elegido = elegido || muestra();
    cola = elegido.map((id) => CLAIMS[id].answer).slice(-MAX_SEGUIDAS);
    if (clave) { vistas[clave] = elegido; guardarVistas(vistas); }
    return elegido;
  }
  // Situaciones ¿Qué harías?: hasta 2 por capítulo, al azar, primero las que no salieron la vez pasada
  const SITUACIONES = reglas.situaciones_por_capitulo || 2;
  function sorteoSituaciones(ids, clave) {
    const vistas = leerVistas(), antes = vistas[clave] || [];
    const elegidas = [...mezclar(ids.filter((id) => !antes.includes(id))), ...mezclar(ids.filter((id) => antes.includes(id)))].slice(0, SITUACIONES);
    if (clave) { vistas[clave] = elegidas; guardarVistas(vistas); }
    return elegidas;
  }
  let CLAIMS_ACTUALES = null;

  return {
    generado: datos.generado,

    // Afirmaciones, situaciones, capítulos y regalos
    historia(CLAIMS, DILEMMAS, CHAPTERS, ACC) {
      if (!historiaLista) return false;
      const antes = { claims: CHAPTERS.flatMap((c) => c.claims), dilemmas: CHAPTERS.flatMap((c) => c.dilemmas) };
      const lugares = Object.fromEntries(Object.entries(DILEMMAS).map(([id, d]) => [id, d.place]));
      Object.keys(CLAIMS).forEach((k) => delete CLAIMS[k]);
      Object.keys(DILEMMAS).forEach((k) => delete DILEMMAS[k]);
      mitos.forEach((m) => { CLAIMS[m.id] = { claim: m.texto, answer: m.respuesta, why: m.explicacion, level: nivelDe(m) }; });
      // Las situaciones nuevas no traen lugar: se muestra el nombre de su capítulo
      const capDe = Object.fromEntries(capitulos.map((c) => [c.orden, c.nombre]));
      dilemas.forEach((d) => {
        DILEMMAS[d.id] = { place: lugares[d.id] || capDe[d.capitulo] || '', text: d.texto,
          options: d.opciones.map((o) => ({ profile: o.perfil, label: o.texto, next: o.despues })) };
      });
      CLAIMS_ACTUALES = CLAIMS;
      CHAPTERS.length = 0;
      capitulos.forEach((c) => {
        const regalo = REGALO[c.ruta];
        ACC[regalo] = { name: mayus(c.regalo.nombre), text: c.regalo.texto };
        CHAPTERS.push({
          name: mayus(c.nombre), place: c.ruta, reward: regalo, intro: c.intro,
          // pool: todas las del capítulo; claims: las 4 de esta vuelta (se vuelven a sortear al empezar el capítulo)
          pool: ordenar(mitos.filter((m) => m.capitulo === c.orden), antes.claims, (m) => m.id).map((m) => m.id),
          claims: [],
          // poolSituaciones: todas las activas del capítulo; dilemmas: las de esta vuelta (máximo 2)
          poolSituaciones: ordenar(dilemas.filter((d) => d.capitulo === c.orden), antes.dilemmas, (d) => d.id).map((d) => d.id),
          dilemmas: [],
        });
      });
      // Sorteo inicial sin anotarlo como visto: el de verdad se hace al empezar cada capítulo
      CHAPTERS.forEach((c) => { c.claims = sorteo(c.pool, CLAIMS, null); c.dilemmas = sorteoSituaciones(c.poolSituaciones, null); });
      cola = [];
      return true;
    },

    // Al empezar un capítulo: sus 4 afirmaciones de esta vuelta (los capítulos del juego sin pool quedan igual)
    sortear(capitulo) {
      if (!capitulo || !Array.isArray(capitulo.pool) || !CLAIMS_ACTUALES) return;
      capitulo.claims = sorteo(capitulo.pool, CLAIMS_ACTUALES, capitulo.place);
      if (Array.isArray(capitulo.poolSituaciones)) capitulo.dilemmas = sorteoSituaciones(capitulo.poolSituaciones, capitulo.place + '-situaciones');
    },

    // Los cuatro perfiles de aliado; el que no venga se queda como está en el juego
    perfiles(PROFILES) {
      perfiles.forEach((p) => { PROFILES[p.clave] = { name: mayus(p.nombre), phrase: p.frase, action: p.accion }; });
    },

    // Pregúntale; las palabras extra del buscador se conservan para las preguntas que ya existían
    preguntas(FAQ, FAQ_TAGS) {
      if (!preguntas.length) return;
      const previas = FAQ.map((f) => f.q), etiquetas = Object.fromEntries(FAQ.map((f, i) => [f.q, FAQ_TAGS[i] || '']));
      const nuevas = ordenar(preguntas, previas, (p) => p.pregunta);
      FAQ.length = 0; FAQ_TAGS.length = 0;
      nuevas.forEach((p) => { FAQ.push({ q: p.pregunta, a: p.respuesta }); FAQ_TAGS.push(etiquetas[p.pregunta] || ''); });
    },

    // Las líneas del botón «¿Necesitas ayuda ahora?»; si no hay filas, queda el texto actual
    ayuda(caja) {
      if (!caja || !ayuda.length) return;
      const items = caja.querySelectorAll('.help-item');
      if (!items.length) return;
      const crea = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto) e.textContent = texto; return e; };
      // Los correos largos se parten en el celular en vez de salirse de la caja
      if (!document.getElementById('ayuda-correos')) {
        const st = crea('style'); st.id = 'ayuda-correos';
        st.textContent = '.help-item span, .help-item a.correo { overflow-wrap: anywhere; } .help-item a.correo { color: inherit; text-decoration: underline; text-underline-offset: 3px; }';
        document.head.appendChild(st);
      }
      // Texto con los correos convertidos en enlaces para escribir
      const conCorreos = (texto) => {
        const span = crea('span', '');
        texto.split(/([^\s,;:()]+@[^\s,;:()]+\.[a-z]{2,})/i).forEach((parte, k) => {
          if (k % 2) { const a = crea('a', 'correo', parte); a.href = 'mailto:' + parte; span.appendChild(a); }
          else if (parte) span.appendChild(document.createTextNode(parte));
        });
        return span;
      };
      ayuda.forEach((a) => {
        const item = crea('div', 'help-item');
        if (a.numero) item.appendChild(crea('span', 'num', a.numero));
        item.appendChild(crea('span', 'name', a.nombre));
        item.appendChild(conCorreos(a.texto));
        const acciones = crea('div', 'help-actions');
        if (a.numero) {
          const tel = crea('a', '', 'Llamar'); tel.href = 'tel:' + a.numero; acciones.appendChild(tel);
          const copia = crea('button', '', 'Copiar número'); copia.type = 'button'; copia.setAttribute('data-copy', a.numero); acciones.appendChild(copia);
        }
        if (a.enlace && /^mailto:/i.test(a.enlace)) {
          const correo = crea('a', '', 'Escribir correo'); correo.href = a.enlace; acciones.appendChild(correo);
        } else if (a.enlace) {
          const ir = crea('a', '', /pluridivers/i.test(a.enlace) ? 'Conoce Pluridiversos' : 'Abrir enlace');
          ir.href = a.enlace; ir.target = '_blank'; ir.rel = 'noopener noreferrer'; acciones.appendChild(ir);
        }
        if (acciones.childNodes.length) item.appendChild(acciones);
        items[0].parentNode.insertBefore(item, items[0]);
      });
      items.forEach((i) => i.remove());
    },
  };
})();
