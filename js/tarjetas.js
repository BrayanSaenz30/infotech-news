/**
 * tarjetas.js — Plantilla única de tarjeta de noticia.
 *
 * Una sola función construye el marcado de una tarjeta, y todas las vistas que
 * listan noticias la llaman (inicio, catálogo, favoritos y gestión). Tener la
 * misma tarjeta escrita en dos sitios fue el defecto que este módulo corrige:
 * las dos copias se separan y la diferencia la acaba viendo el usuario.
 *
 * No depende de ningún otro módulo ITN (0 de 4).
 */
window.ITN = window.ITN || {};

window.ITN.tarjetas = (function () {
  'use strict';

  /**
   * Escapa texto para poder interpolarlo en una cadena de HTML.
   *
   * Necesario porque el título y el resumen de una noticia creada por el
   * usuario llegan desde un formulario.
   * @param {string} texto - Texto sin procesar.
   * @returns {string} Texto seguro para insertar como HTML.
   */
  function escapar(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Construye el marcado del botón de favorito de una tarjeta.
   * @param {Object} noticia - Modelo de vista de la noticia.
   * @param {boolean} esFavorito - Estado actual del favorito.
   * @returns {string} Marcado del botón.
   */
  function botonFavorito(noticia, esFavorito) {
    const icono = esFavorito ? 'fas fa-bookmark' : 'far fa-bookmark';
    const etiqueta = esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos';
    const color = esFavorito ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600';

    return (
      '<button type="button" class="itn-favorito ' + color + ' text-xs transition"' +
      ' data-id="' + noticia.id + '" aria-pressed="' + esFavorito + '"' +
      ' aria-label="' + etiqueta + ': ' + escapar(noticia.titulo) + '">' +
      '<i class="' + icono + ' mr-1" aria-hidden="true"></i> Favoritos' +
      '</button>'
    );
  }

  /**
   * Construye el marcado de una tarjeta de noticia.
   * @param {Object} noticia - Modelo de vista de la noticia.
   * @param {Object} [opciones] - Ajustes opcionales de la tarjeta.
   * @param {boolean} [opciones.esFavorito] - Marca el botón como activo.
   * @param {boolean} [opciones.conEliminar] - Añade el botón de eliminar.
   * @returns {string} Marcado completo de la tarjeta.
   */
  function construir(noticia, opciones) {
    const ajustes = opciones || {};
    let acciones = botonFavorito(noticia, Boolean(ajustes.esFavorito));

    if (ajustes.conEliminar) {
      acciones +=
        '<button type="button" class="itn-eliminar text-xs text-red-600 hover:text-red-800 transition"' +
        ' data-id="' + noticia.id + '"' +
        ' aria-label="Eliminar la noticia: ' + escapar(noticia.titulo) + '">' +
        '<i class="fas fa-trash mr-1" aria-hidden="true"></i> Eliminar' +
        '</button>';
    }

    return (
      '<article class="itn-tarjeta bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">' +
      '<div>' +
      '<img src="' + escapar(noticia.imagen) + '" alt="' + escapar(noticia.titulo) + '"' +
      ' class="w-full h-48 object-cover" loading="lazy">' +
      '<div class="p-5">' +
      '<span class="itn-etiqueta text-xs font-bold text-blue-600 uppercase tracking-wider">' +
      escapar(noticia.categoria) + '</span>' +
      '<h3 class="itn-titulo-tarjeta text-base font-bold text-slate-900 mt-2 leading-snug">' +
      escapar(noticia.titulo) + '</h3>' +
      '<p class="itn-resumen text-gray-600 text-xs mt-2 leading-relaxed">' +
      escapar(noticia.resumen) + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="p-5 pt-0">' +
      '<p class="text-gray-400 text-xs mb-3">' + escapar(noticia.tiempo) + '</p>' +
      '<div class="flex justify-between items-center pt-3 border-t border-gray-100 gap-2">' +
      '<div class="flex items-center gap-3">' + acciones + '</div>' +
      '<a href="detalle.html?id=' + noticia.id + '" class="text-blue-600 font-semibold text-xs hover:underline">' +
      'Ver más &rarr;</a>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  /**
   * Renderiza una lista de noticias dentro de un contenedor.
   *
   * Se compone una sola cadena y se asigna una vez: concatenar sobre innerHTML
   * dentro del bucle obliga al navegador a reinterpretar el contenedor en cada
   * iteración.
   * @param {HTMLElement} contenedor - Elemento destino.
   * @param {Object[]} noticias - Noticias a renderizar.
   * @param {Object} [opciones] - Opciones pasadas a cada tarjeta.
   * @returns {void}
   */
  function renderizar(contenedor, noticias, opciones) {
    if (!contenedor) {
      return;
    }

    const ajustes = opciones || {};
    const favoritos = window.ITN.almacenamiento.leerFavoritos();
    const html = noticias
      .map(function (noticia) {
        return construir(noticia, {
          esFavorito: favoritos.indexOf(noticia.id) !== -1,
          conEliminar: Boolean(ajustes.conEliminar)
        });
      })
      .join('');

    contenedor.innerHTML = html;
  }

  /**
   * Muestra un mensaje de estado vacío dentro de un contenedor.
   * @param {HTMLElement} contenedor - Elemento destino.
   * @param {string} titulo - Título del mensaje.
   * @param {string} detalle - Texto explicativo.
   * @returns {void}
   */
  function renderizarVacio(contenedor, titulo, detalle) {
    if (!contenedor) {
      return;
    }
    contenedor.innerHTML =
      '<div class="itn-aviso col-span-full" role="status">' +
      '<p class="font-semibold text-slate-900">' + escapar(titulo) + '</p>' +
      '<p class="text-gray-600 text-sm mt-1">' + escapar(detalle) + '</p>' +
      '</div>';
  }

  /**
   * Conecta el botón de favorito de todas las tarjetas de un contenedor.
   *
   * Se delega en el contenedor en lugar de enlazar cada botón: las tarjetas se
   * vuelven a renderizar y los oyentes enlazados a los botones antiguos se
   * perderían. El botón vive en este módulo, así que su comportamiento también.
   * @param {HTMLElement} contenedor - Contenedor de las tarjetas.
   * @param {Function} [alCambiar] - Se invoca tras alternar, con el id afectado.
   * @returns {void}
   */
  function conectarFavoritos(contenedor, alCambiar) {
    if (!contenedor) {
      return;
    }

    contenedor.addEventListener('click', function (evento) {
      const boton = evento.target.closest('.itn-favorito');
      if (!boton) {
        return;
      }

      const id = Number(boton.getAttribute('data-id'));
      const activo = window.ITN.almacenamiento.alternarFavorito(id);
      const icono = boton.querySelector('i');

      boton.setAttribute('aria-pressed', String(activo));
      boton.setAttribute(
        'aria-label',
        (activo ? 'Quitar de favoritos' : 'Agregar a favoritos') + ' esta noticia'
      );
      if (icono) {
        icono.className = (activo ? 'fas fa-bookmark' : 'far fa-bookmark') + ' mr-1';
      }
      boton.classList.toggle('text-blue-600', activo);
      boton.classList.toggle('text-gray-400', !activo);

      if (typeof alCambiar === 'function') {
        alCambiar(id, activo);
      }
    });
  }

  return {
    construir: construir,
    renderizar: renderizar,
    renderizarVacio: renderizarVacio,
    conectarFavoritos: conectarFavoritos,
    escapar: escapar
  };
}());
