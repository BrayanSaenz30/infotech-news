/**
 * pagina-favoritos.js — Controlador de la página "Mis favoritos".
 *
 * Sólo orquesta: pide los ids guardados a la fachada de almacenamiento, pide
 * las noticias al repositorio, cruza ambas listas y entrega el resultado al
 * módulo de tarjetas. No contiene reglas de negocio ni toca localStorage.
 *
 * Depende de: ITN.almacenamiento, ITN.repositorio, ITN.tarjetas (3 de 4).
 */
window.ITN = window.ITN || {};

(function () {
  'use strict';

  const ID_CONTENEDOR = 'contenedor-favoritos';
  const ID_CONTADOR = 'itn-contador-favoritos';
  const ID_EXPLORAR = 'itn-explorar-catalogo';
  const CLASE_OCULTA = 'hidden';
  const TITULO_VACIO = 'Todavía no tiene noticias en favoritos';
  const DETALLE_VACIO =
    'Explore el catálogo y pulse "Favoritos" en cualquier tarjeta para guardarla aquí.';

  let guardadas = [];

  /**
   * Cruza las noticias disponibles con los ids marcados como favoritos.
   * @param {Object[]} noticias - Modelos de vista devueltos por el repositorio.
   * @param {number[]} ids - Ids guardados en favoritos.
   * @returns {Object[]} Sólo las noticias cuyo id está en la lista.
   */
  function cruzarConFavoritos(noticias, ids) {
    return noticias.filter(function (noticia) {
      return ids.includes(noticia.id);
    });
  }

  /**
   * Compone el texto del contador accesible de noticias guardadas.
   * @param {number} total - Cantidad de noticias en la lista.
   * @returns {string} Frase en español, concordada en número.
   */
  function textoContador(total) {
    if (total === 0) {
      return 'Todavía no tiene noticias guardadas.';
    }
    return total === 1 ? 'Tiene 1 noticia guardada.' : 'Tiene ' + total + ' noticias guardadas.';
  }

  /**
   * Muestra u oculta la invitación a explorar el catálogo.
   *
   * Se alterna una clase en lugar de escribir el atributo style, que está
   * prohibido y no podría sobrescribirse desde la hoja de estilos.
   * @param {boolean} visible - true para mostrarla.
   * @returns {void}
   */
  function alternarInvitacion(visible) {
    const invitacion = document.getElementById(ID_EXPLORAR);
    if (!invitacion) {
      return;
    }
    invitacion.classList.toggle(CLASE_OCULTA, !visible);
  }

  /**
   * Actualiza el contador accesible de la parte superior de la página.
   * @param {string} texto - Texto a anunciar.
   * @returns {void}
   */
  function actualizarContador(texto) {
    const contador = document.getElementById(ID_CONTADOR);
    if (!contador) {
      return;
    }
    contador.textContent = texto;
  }

  /**
   * Pinta la lista actual: las tarjetas, o el estado vacío si no queda ninguna.
   * @param {HTMLElement} contenedor - Contenedor de la grilla.
   * @returns {void}
   */
  function pintar(contenedor) {
    actualizarContador(textoContador(guardadas.length));
    alternarInvitacion(guardadas.length === 0);

    if (!guardadas.length) {
      window.ITN.tarjetas.renderizarVacio(contenedor, TITULO_VACIO, DETALLE_VACIO);
      return;
    }

    window.ITN.tarjetas.renderizar(contenedor, guardadas);
  }

  /**
   * Reacciona a que el usuario pulse el botón de favorito de una tarjeta.
   *
   * En esta vista toda tarjeta visible es un favorito, así que desmarcarla debe
   * sacarla de la lista y repintar; volver a marcarla no es posible porque la
   * tarjeta ya no está en pantalla.
   * @param {HTMLElement} contenedor - Contenedor de la grilla.
   * @param {number} id - Id de la noticia afectada.
   * @param {boolean} activo - Estado en que quedó el favorito.
   * @returns {void}
   */
  function alCambiarFavorito(contenedor, id, activo) {
    if (activo) {
      return;
    }

    guardadas = guardadas.filter(function (noticia) {
      return noticia.id !== id;
    });
    pintar(contenedor);
  }

  /**
   * Carga las noticias guardadas y deja la página lista para interactuar.
   * @returns {void}
   */
  function iniciar() {
    const contenedor = document.getElementById(ID_CONTENEDOR);
    if (!contenedor) {
      return;
    }

    // El oyente se conecta una sola vez y antes de pintar: está delegado en el
    // contenedor, de modo que sobrevive a cada repintado de las tarjetas.
    window.ITN.tarjetas.conectarFavoritos(contenedor, function (id, activo) {
      alCambiarFavorito(contenedor, id, activo);
    });

    window.ITN.repositorio
      .cargar()
      .then(function (noticias) {
        guardadas = cruzarConFavoritos(noticias, window.ITN.almacenamiento.leerFavoritos());
        pintar(contenedor);
      })
      .catch(function () {
        actualizarContador('');
        window.ITN.repositorio.mostrarError(contenedor);
      });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
}());
