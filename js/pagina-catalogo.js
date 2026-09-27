/**
 * pagina-catalogo.js — Controlador del catálogo de noticias.
 *
 * Orquesta el filtrado por categoría y la búsqueda por texto. Las píldoras se
 * construyen a partir de las categorías que devuelve el repositorio, nunca de
 * una lista escrita a mano.
 *
 * Depende de: ITN.repositorio, ITN.tarjetas (2 de 4 permitidas).
 */
window.ITN = window.ITN || {};

(function () {
  'use strict';

  const TODAS = 'todas';

  let noticias = [];
  let categoriaActiva = TODAS;

  /**
   * Lee un parámetro de la cadena de consulta de la URL.
   * @param {string} nombre - Nombre del parámetro.
   * @returns {string} Valor del parámetro, o cadena vacía si no está.
   */
  function parametro(nombre) {
    return new URLSearchParams(window.location.search).get(nombre) || '';
  }

  /**
   * Devuelve las noticias que cumplen el filtro y la búsqueda actuales.
   * @returns {Object[]} Noticias visibles.
   */
  function filtrar() {
    const buscador = document.getElementById('buscador');
    const termino = (buscador ? buscador.value : '')
      .trim()
      .toLowerCase();

    return noticias.filter(function (noticia) {
      const coincideCategoria =
        categoriaActiva === TODAS || noticia.claveCategoria === categoriaActiva;
      const coincideTexto =
        termino === '' ||
          noticia.titulo.toLowerCase().includes(termino) ||
          noticia.resumen.toLowerCase().includes(termino);

      return coincideCategoria && coincideTexto;
    });
  }

  /**
   * Renderiza el resultado del filtro y actualiza el contador accesible.
   * @returns {void}
   */
  function pintar() {
    const contenedor = document.getElementById('contenedor-catalogo');
    const aviso = document.getElementById('itn-resultado');
    const visibles = filtrar();

    aviso.textContent =
      visibles.length === 1
        ? 'Se encontró 1 noticia.'
        : 'Se encontraron ' + visibles.length + ' noticias.';

    if (!visibles.length) {
      window.ITN.tarjetas.renderizarVacio(
        contenedor,
        'No hay noticias que coincidan',
        'Pruebe con otra categoría o borre el texto del buscador.'
      );
      return;
    }

    window.ITN.tarjetas.renderizar(contenedor, visibles);
  }

  /**
   * Marca visualmente la píldora activa.
   * @returns {void}
   */
  function marcarPildoraActiva() {
    const pildoras = document.querySelectorAll('.itn-pildora');
    Array.prototype.forEach.call(pildoras, function (pildora) {
      if (!(pildora instanceof HTMLElement)) {
        return;
      }
      const clave = pildora.dataset.clave || '';
      const activa = clave === categoriaActiva;
      pildora.setAttribute('aria-pressed', String(activa));
      pildora.classList.toggle('bg-gray-200', !activa);
      pildora.classList.toggle('text-gray-700', !activa);
    });
  }

  /**
   * Construye las píldoras de filtro a partir de las categorías de los datos.
   * @param {string[]} categorias - Categorías con su grafía original.
   * @returns {void}
   */
  function construirPildoras(categorias) {
    const contenedor = document.getElementById('filtros');
    const clave = window.ITN.repositorio.obtenerCategoriasClave;

    const html = ['Todas'].concat(categorias).map(function (etiqueta, indice) {
      const valor = indice === 0 ? TODAS : clave(etiqueta);
      return (
        '<button type="button" class="itn-pildora bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"' +
        ' data-clave="' + valor + '" aria-pressed="false">' +
        window.ITN.tarjetas.escapar(etiqueta) +
        '</button>'
      );
    });

    contenedor.innerHTML = html.join('');
  }

  /**
   * Conecta las píldoras y el buscador mediante delegación de eventos.
   * @returns {void}
   */
  function conectarControles() {
    document.getElementById('filtros').addEventListener('click', function (evento) {
      if (!(evento.target instanceof HTMLElement)) {
        return;
      }
      const pildora = evento.target.closest('.itn-pildora');
      if (!(pildora instanceof HTMLElement)) {
        return;
      }
      categoriaActiva = pildora.dataset.clave || TODAS;
      marcarPildoraActiva();
      pintar();
    });

    document.getElementById('buscador').addEventListener('input', pintar);

    window.ITN.tarjetas.conectarFavoritos(
      document.getElementById('contenedor-catalogo')
    );
  }

  /**
   * Aplica el filtro y la búsqueda que lleguen en la URL.
   *
   * La categoría se compara normalizada, así que ?cat=TECNOLOGÍA, ?cat=tecnologia
   * y la forma percent-encoded seleccionan la misma píldora.
   * @returns {void}
   */
  function aplicarEstadoDeUrl() {
    const categoria = parametro('cat');
    if (categoria) {
      categoriaActiva = window.ITN.repositorio.obtenerCategoriasClave(categoria);
    }

    const busqueda = parametro('q');
    if (busqueda) {
      document.getElementById('buscador').value = busqueda;
    }
  }

  /**
   * Inicializa el catálogo.
   * @returns {void}
   */
  function iniciar() {
    const contenedor = document.getElementById('contenedor-catalogo');

    window.ITN.repositorio
      .cargar()
      .then(function (todas) {
        noticias = todas;
        return window.ITN.repositorio.obtenerCategorias();
      })
      .then(function (categorias) {
        construirPildoras(categorias);
        aplicarEstadoDeUrl();
        marcarPildoraActiva();
        conectarControles();
        pintar();
      })
      .catch(function () {
        window.ITN.repositorio.mostrarError(contenedor);
      });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
}());
