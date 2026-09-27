/**
 * layout.js — Estado compartido del encabezado y el pie.
 *
 * El <header> y el <footer> se duplican a propósito en las seis páginas: no hay
 * build step, e inyectarlos con JavaScript dejaría el código fuente de cada
 * página con un contenedor vacío y haría que el menú desapareciera si un script
 * fallara. Este módulo se limita a lo que sí conviene resolver en tiempo de
 * ejecución: marcar el enlace activo y actualizar el año del pie.
 *
 * No depende de ningún otro módulo ITN (0 de 4).
 */
window.ITN = window.ITN || {};

window.ITN.layout = (function () {
  'use strict';

  const CLASES_INACTIVO = ['text-gray-300', 'hover:text-white', 'transition'];
  const ID_MENU = 'itn-menu';
  const ID_BOTON_MENU = 'itn-boton-menu';

  /**
   * Devuelve el nombre del archivo de la página actual.
   * @returns {string} Nombre del archivo, por ejemplo "noticias.html".
   */
  function paginaActual() {
    const partes = window.location.pathname.split('/');
    const ultimo = partes.at(-1);
    return ultimo === '' ? 'index.html' : ultimo;
  }

  /**
   * Marca en el menú el enlace correspondiente a la página actual.
   *
   * Se hace aquí para que la única diferencia legítima entre los encabezados de
   * las seis páginas no haya que mantenerla a mano en cada archivo.
   * @returns {void}
   */
  function marcarEnlaceActivo() {
    const actual = paginaActual();
    const enlaces = document.querySelectorAll('[data-nav]');

    Array.prototype.forEach.call(enlaces, function (enlace) {
      const destino = enlace.dataset.nav;
      if (destino !== actual) {
        return;
      }
      // La píldora "Tecnología" apunta a noticias.html con filtro; sólo se
      // marca cuando la URL no lleva categoría, para no resaltar dos enlaces.
      if (destino === 'noticias.html' && enlace.getAttribute('href').includes('cat=')) {
        return;
      }
      CLASES_INACTIVO.forEach(function (clase) {
        enlace.classList.remove(clase);
      });
      enlace.classList.add('itn-nav-activo');
      enlace.setAttribute('aria-current', 'page');
    });
  }

  /**
   * Escribe el año actual en el pie de página.
   * @returns {void}
   */
  function actualizarAnio() {
    const destino = document.getElementById('itn-anio');
    if (destino) {
      destino.textContent = String(new Date().getFullYear());
    }
  }

  /**
   * Conecta el buscador del encabezado, que antes no hacía nada.
   *
   * Lleva al catálogo con el término en la URL, en lugar de buscar en la página
   * actual: es la única vista que sabe listar resultados.
   * @returns {void}
   */
  function conectarBuscadorCabecera() {
    const boton = document.getElementById('itn-boton-buscar');
    if (!boton) {
      return;
    }
    boton.addEventListener('click', function () {
      const termino = window.prompt('¿Qué noticia desea buscar?');
      if (termino) {
        window.location.href = 'noticias.html?q=' + encodeURIComponent(termino);
      }
    });
  }

  /**
   * Abre o cierra el menú de navegación en anchuras de móvil.
   *
   * Se alternan las clases `hidden` y `flex` en lugar de tocar el atributo
   * style: en escritorio la clase `md:flex` gana sobre `hidden` por el orden de
   * los media queries, así que el menú vuelve a verse solo al ensanchar la
   * ventana y no hace falta escuchar el evento resize.
   * @param {boolean} abierto - true para abrir el menú, false para cerrarlo.
   * @returns {void}
   */
  function alternarMenu(abierto) {
    const menu = document.getElementById(ID_MENU);
    const boton = document.getElementById(ID_BOTON_MENU);
    if (!menu || !boton) {
      return;
    }

    menu.classList.toggle('hidden', !abierto);
    menu.classList.toggle('flex', abierto);
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute(
      'aria-label',
      (abierto ? 'Cerrar' : 'Abrir') + ' el menú de navegación'
    );

    const icono = boton.querySelector('i');
    if (icono) {
      icono.className = (abierto ? 'fas fa-xmark' : 'fas fa-bars');
    }
  }

  /**
   * Indica si el menú está desplegado.
   * @returns {boolean} true si el menú está abierto.
   */
  function menuAbierto() {
    const boton = document.getElementById(ID_BOTON_MENU);
    return Boolean(boton) && boton.getAttribute('aria-expanded') === 'true';
  }

  /**
   * Conecta el botón hamburguesa, el cierre con Escape y el cierre al navegar.
   * @returns {void}
   */
  function conectarMenuMovil() {
    const menu = document.getElementById(ID_MENU);
    const boton = document.getElementById(ID_BOTON_MENU);
    if (!menu || !boton) {
      return;
    }

    boton.addEventListener('click', function () {
      alternarMenu(!menuAbierto());
    });

    // Al pulsar un enlace se cierra: en móvil el panel tapa el contenido, y al
    // navegar a un ancla de la misma página quedaría abierto sobre el texto.
    menu.addEventListener('click', function (evento) {
      if (evento.target instanceof Element && evento.target.closest('a')) {
        alternarMenu(false);
      }
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && menuAbierto()) {
        alternarMenu(false);
        boton.focus();
      }
    });
  }

  /**
   * Inicializa el comportamiento común a todas las páginas.
   * @returns {void}
   */
  function iniciar() {
    marcarEnlaceActivo();
    actualizarAnio();
    conectarBuscadorCabecera();
    conectarMenuMovil();
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  return {};
}());
