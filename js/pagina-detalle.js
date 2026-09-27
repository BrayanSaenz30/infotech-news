/**
 * pagina-detalle.js — Controlador de la vista de detalle de una noticia.
 *
 * Lee el identificador de la URL, pide la noticia al repositorio y pinta el
 * artículo completo. No decide qué es válido ni dónde se guarda un favorito:
 * eso vive en el repositorio y en el módulo de almacenamiento.
 *
 * Depende de: ITN.repositorio, ITN.almacenamiento, ITN.tarjetas (3 de 4 permitidas).
 */
window.ITN = window.ITN || {};

(function () {
  'use strict';

  const ID_CONTENEDOR = 'itn-detalle';
  const ID_ERROR_CARGA = 'itn-detalle-error';
  const PARAMETRO_ID = 'id';
  const PATRON_ID = /^\d+$/;
  const CLASE_FAVORITO = 'itn-detalle-favorito';
  const CLASE_TEXTO_FAVORITO = 'itn-detalle-favorito-texto';
  const TEXTO_AGREGAR = 'Agregar a favoritos';
  const TEXTO_QUITAR = 'Quitar de favoritos';
  const ICONO_ACTIVO = 'fas fa-bookmark mr-2';
  const ICONO_INACTIVO = 'far fa-bookmark mr-2';

  /**
   * Lee el identificador de la noticia desde la cadena de consulta.
   *
   * Se exige un entero: el repositorio compara ids numéricos, de modo que
   * "?id=abc" o "?id=" no deben acabar en una búsqueda que nunca encuentra
   * nada, sino en el mensaje de "no encontrada".
   * @returns {{estado: string, valor: (number|string|null)}} estado es
   *   'ausente' (sin parámetro), 'invalido' (no numérico) o 'valido'.
   */
  function leerIdDeUrl() {
    const crudo = new URLSearchParams(window.location.search).get(PARAMETRO_ID);
    if (crudo === null || crudo.trim() === '') {
      return { estado: 'ausente', valor: null };
    }
    const limpio = crudo.trim();
    if (!PATRON_ID.test(limpio)) {
      return { estado: 'invalido', valor: limpio };
    }
    return { estado: 'valido', valor: Number(limpio) };
  }

  /**
   * Compone los párrafos del cuerpo del artículo.
   *
   * Si una noticia creada desde Gestión llega sin cuerpo, se muestra su resumen
   * antes que dejar el artículo en blanco.
   * @param {Object} noticia - Modelo de vista de la noticia.
   * @returns {string} HTML con un párrafo por entrada de contenido.
   */
  function plantillaCuerpo(noticia) {
    const escapar = window.ITN.tarjetas.escapar;
    const parrafos = noticia.contenido.length ? noticia.contenido : [noticia.resumen];
    return parrafos
      .map(function (parrafo) {
        return '<p>' + escapar(parrafo) + '</p>';
      })
      .join('');
  }

  /**
   * Compone el botón de favoritos con su estado inicial.
   * @param {Object} noticia - Modelo de vista de la noticia.
   * @param {boolean} activo - true si la noticia ya está en favoritos.
   * @returns {string} HTML del botón.
   */
  function plantillaBotonFavorito(noticia, activo) {
    if (!noticia?.id) {
      return '';
    }

    const id = String(noticia.id);
    const estado = activo ? 'true' : 'false';
    const texto = activo ? TEXTO_QUITAR : TEXTO_AGREGAR;
    const icono = activo ? ICONO_ACTIVO : ICONO_INACTIVO;
    const escapar = window.ITN.tarjetas.escapar;

    return (
      `<button type="button" class="${CLASE_FAVORITO} ` +
      'bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg ' +
      `hover:bg-blue-700 transition" data-id="${escapar(id)}" ` +
      `aria-pressed="${estado}" aria-label="${escapar(texto)}">` +
      `<i class="${icono}" aria-hidden="true"></i>` +
      `<span class="${CLASE_TEXTO_FAVORITO}">${escapar(texto)}</span>` +
      '</button>'
    );
  }

  /**
   * Compone el artículo completo de la noticia.
   * @param {Object} noticia - Modelo de vista de la noticia.
   * @param {boolean} activo - true si la noticia ya está en favoritos.
   * @returns {string} HTML del artículo, con el h1 de la página.
   */
  function plantillaArticulo(noticia, activo) {
    const escapar = window.ITN.tarjetas.escapar;
    return (
      '<article class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">' +
      '<img src="' + escapar(noticia.imagen) + '" alt="' + escapar(noticia.titulo) + '"' +
      ' class="w-full h-56 md:h-96 object-cover">' +
      '<div class="p-6 md:p-10">' +
      '<span class="itn-etiqueta text-xs font-bold text-blue-600 uppercase tracking-wider">' +
      escapar(noticia.categoria) + '</span>' +
      '<h1 class="itn-serif text-3xl md:text-4xl font-bold text-slate-900 mt-3 leading-tight">' +
      escapar(noticia.titulo) + '</h1>' +
      '<p class="text-gray-400 text-xs mt-3">' + escapar(noticia.tiempo) + '</p>' +
      '<div class="itn-articulo text-gray-700 mt-6">' + plantillaCuerpo(noticia) + '</div>' +
      '<p class="text-gray-400 text-xs mt-2">' + escapar(noticia.creditoImagen) + '</p>' +
      '<div class="mt-8 pt-6 border-t border-gray-100">' +
      plantillaBotonFavorito(noticia, activo) +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  /**
   * Refleja en el botón el estado real del favorito.
   * @param {HTMLElement} boton - Botón de favoritos ya presente en el DOM.
   * @param {boolean} activo - true si la noticia quedó en favoritos.
   * @returns {void}
   */
  const pintarEstadoFavorito = function(boton, activo) {
    const texto = boton.querySelector('.' + CLASE_TEXTO_FAVORITO);
    const icono = boton.querySelector('i');
    boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    if (texto) {
      texto.textContent = activo ? TEXTO_QUITAR : TEXTO_AGREGAR;
    }
    if (icono) {
      icono.className = activo ? ICONO_ACTIVO : ICONO_INACTIVO;
    }
  }

  /**
   * Conecta el botón de favoritos mediante un escucha delegado.
   *
   * El escucha se coloca en el contenedor y no en el botón: el artículo se
   * vuelve a pintar como una sola cadena, y un escucha atado al botón se
   * perdería con él.
   * @param {HTMLElement} contenedor - Contenedor del artículo.
   * @param {number} id - Identificador de la noticia mostrada.
   * @returns {void}
   */
  function conectarFavorito(contenedor, id) {
    contenedor.addEventListener('click', function (evento) {
      const origen = evento.target;
      const boton = origen?.closest ? origen.closest('.' + CLASE_FAVORITO) : null;
      if (!boton) {
        return;
      }
      pintarEstadoFavorito(boton, window.ITN.almacenamiento.alternarFavorito(id));
    });
  }

  /**
   * Pinta la noticia solicitada dentro del contenedor.
   * @param {HTMLElement} contenedor - Contenedor del artículo.
   * @param {Object} noticia - Modelo de vista de la noticia.
   * @returns {void}
   */
  const mostrarNoticia = function(contenedor, noticia) {
    const activo = window.ITN.almacenamiento.esFavorito(noticia.id);
    contenedor.innerHTML = plantillaArticulo(noticia, activo);
    conectarFavorito(contenedor, noticia.id);
  }

  /**
   * Pinta un aviso de noticia no disponible, con la salida hacia el catálogo.
   *
   * Lleva un h1 propio para que la página conserve su único encabezado de
   * primer nivel también cuando el artículo no puede mostrarse.
   * @param {HTMLElement} contenedor - Contenedor del artículo.
   * @param {string} titulo - Encabezado del aviso.
   * @param {string} detalle - Explicación de la causa, puede llevar marcado.
   * @returns {void}
   */
  function mostrarNoEncontrada(contenedor, titulo, detalle) {
    contenedor.innerHTML =
      '<div class="itn-aviso itn-aviso--error" role="alert" aria-live="polite">' +
      '<h1 class="itn-serif text-2xl font-bold">' + titulo + '</h1>' +
      '<p class="mt-2">' + detalle + '</p>' +
      '<p class="mt-4"><a href="noticias.html" class="font-semibold underline">Ir al catálogo de noticias</a></p>' +
      '</div>';
  }

  /**
   * Explica que la URL no trae identificador de noticia.
   *
   * Es un caso distinto de "no existe": la página se abrió directamente en
   * lugar de entrar desde una tarjeta, y decirlo evita que se confunda con una
   * noticia borrada.
   * @param {HTMLElement} contenedor - Contenedor del artículo.
   * @returns {void}
   */
  function mostrarSinIdentificador(contenedor) {
    mostrarNoEncontrada(
      contenedor,
      'Esta página necesita el identificador de una noticia',
      'La dirección abierta no incluye el parámetro <code>?id=</code>. Esta vista ' +
        'se abre pulsando &laquo;Ver m&aacute;s&raquo; en una tarjeta del cat&aacute;logo, no por s&iacute; sola.'
    );
  }

  /**
   * Explica que el identificador pedido no corresponde a ninguna noticia.
   * @param {HTMLElement} contenedor - Contenedor del artículo.
   * @param {string} id - Identificador tal como llegó en la URL.
   * @returns {void}
   */
  function mostrarIdDesconocido(contenedor, id) {
    mostrarNoEncontrada(
      contenedor,
      'No encontramos la noticia n.&ordm; ' + window.ITN.tarjetas.escapar(String(id)),
      'Puede que la haya eliminado desde la p&aacute;gina de Gesti&oacute;n. Para recuperar ' +
        'las noticias originales, use &laquo;Restaurar datos originales&raquo; en ' +
        '<a href="gestion.html" class="font-semibold underline">Gesti&oacute;n de noticias</a>.'
    );
  }

  /**
   * Pinta el aviso de fallo de carga delegando el texto en el repositorio.
   *
   * El mensaje de error de red es propiedad del repositorio y no se duplica
   * aquí; este módulo sólo añade el encabezado de la página.
   * @param {HTMLElement} contenedor - Contenedor del artículo.
   * @returns {void}
   */
  function mostrarFalloDeCarga(contenedor) {
    contenedor.innerHTML =
      '<h1 class="itn-serif text-2xl font-bold text-slate-900 mb-4">Detalle de la noticia</h1>' +
      '<div id="' + ID_ERROR_CARGA + '"></div>';
    window.ITN.repositorio.mostrarError(document.getElementById(ID_ERROR_CARGA));
  }

  /**
   * Arranca la vista: resuelve el identificador y pide la noticia.
   * @returns {void}
   */
  function iniciar() {
    const contenedor = document.getElementById(ID_CONTENEDOR);
    if (!contenedor) {
      return;
    }

    const pedido = leerIdDeUrl();
    if (pedido.estado === 'ausente') {
      mostrarSinIdentificador(contenedor);
      return;
    }
    if (pedido.estado === 'invalido') {
      mostrarIdDesconocido(contenedor, pedido.valor);
      return;
    }

    window.ITN.repositorio
      .obtenerPorId(pedido.valor)
      .then(function (noticia) {
        if (!noticia) {
          mostrarIdDesconocido(contenedor, pedido.valor);
          return;
        }
        mostrarNoticia(contenedor, noticia);
      })
      .catch(function () {
        mostrarFalloDeCarga(contenedor);
      });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
}());
