/**
 * repositorio.js — Acceso a datos y modelo de vista.
 *
 * Único módulo que sabe de dónde vienen las noticias. Carga la semilla,
 * normaliza cada registro y le aplica la capa de cambios del usuario, de modo
 * que ninguna vista necesite saber que existe un overlay.
 *
 * Depende de: ITN.almacenamiento (1 de 4 permitidas).
 */
window.ITN = window.ITN || {};

window.ITN.repositorio = (function () {
  'use strict';

  const RUTA_SEMILLA = 'data/news.json';
  const MENSAJE_ERROR =
    'No se pudieron cargar las noticias. Abra el proyecto desde un servidor ' +
    'local (por ejemplo: python3 -m http.server 8000) o desde el enlace publicado.';

  let cache = null;

  /**
   * Reduce un nombre de categoría a una clave comparable.
   *
   * La misma categoría llega desde el JSON ("TECNOLOGÍA"), desde un enlace del
   * menú (?cat=TECNOLOGÍA, que el navegador puede entregar percent-encoded) y
   * desde una píldora pulsada. Se comparan claves; se muestra el original.
   * @param {string} valor - Categoría cruda.
   * @returns {string} Clave sin diacríticos, en minúsculas.
   */
  function normalizarCategoria(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Convierte un registro crudo en el modelo de vista que consume la interfaz.
   *
   * Aplica aquí los valores por defecto para que ninguna vista tenga que
   * comprobar si un campo falta.
   * @param {Object} crudo - Registro tal como viene del JSON o del navegador.
   * @returns {Object} Modelo de vista completo.
   */
  function normalizar(crudo) {
    return {
      id: Number(crudo.id),
      titulo: String(crudo.titulo || 'Sin título'),
      categoria: String(crudo.categoria || 'GENERAL'),
      claveCategoria: normalizarCategoria(crudo.categoria),
      resumen: String(crudo.resumen || ''),
      contenido: Array.isArray(crudo.contenido) ? crudo.contenido : [],
      tiempo: String(crudo.tiempo || ''),
      destacado: Boolean(crudo.destacado),
      imagen: String(crudo.imagen || 'img/noticia-01.jpg'),
      creditoImagen: String(crudo.creditoImagen || ''),
      creada: Boolean(crudo.creada)
    };
  }

  /**
   * Aplica la capa del usuario sobre la semilla.
   *
   * Lista efectiva = semilla − eliminadas + creadas.
   * @param {Object[]} semilla - Registros normalizados del archivo JSON.
   * @returns {Object[]} Lista efectiva de noticias.
   */
  function aplicarOverlay(semilla) {
    const eliminadas = window.ITN.almacenamiento.leerEliminadas();
    const creadas = window.ITN.almacenamiento.leerCreadas().map(normalizar);

    const vigentes = semilla.filter(function (noticia) {
      return eliminadas.indexOf(noticia.id) === -1;
    });

    return vigentes.concat(creadas);
  }

  /**
   * Carga las noticias, con la capa del usuario ya aplicada.
   * @returns {Promise<Object[]>} Promesa con la lista efectiva de noticias.
   */
  function cargar() {
    if (cache) {
      return Promise.resolve(aplicarOverlay(cache));
    }

    return fetch(RUTA_SEMILLA)
      .then(function (respuesta) {
        if (!respuesta.ok) {
          throw new Error('HTTP ' + respuesta.status);
        }
        return respuesta.json();
      })
      .then(function (datos) {
        cache = datos.map(normalizar);
        return aplicarOverlay(cache);
      })
      .catch(function (error) {
        // El repositorio es quien sabe por qué falla la carga, así que traduce
        // cualquier fallo al mensaje que debe verse en pantalla y lo vuelve a
        // lanzar. No lo pinta: no sabe en qué contenedor, y esa decisión es del
        // controlador de cada página.
        const fallo = new Error(MENSAJE_ERROR);
        fallo.causa = error;
        throw fallo;
      });
  }

  /**
   * Devuelve únicamente las noticias destacadas.
   * @returns {Promise<Object[]>} Promesa con las noticias marcadas como destacadas.
   */
  function obtenerDestacadas() {
    return cargar().then(function (noticias) {
      return noticias.filter(function (noticia) {
        return noticia.destacado;
      });
    });
  }

  /**
   * Busca una noticia por su identificador.
   * @param {number} id - Identificador buscado.
   * @returns {Promise<Object|null>} La noticia, o null si no existe.
   */
  function obtenerPorId(id) {
    const numero = Number(id);
    return cargar().then(function (noticias) {
      const encontrada = noticias.filter(function (noticia) {
        return noticia.id === numero;
      });
      return encontrada.length ? encontrada[0] : null;
    });
  }

  /**
   * Devuelve las categorías presentes en los datos, sin repetir.
   *
   * Se derivan de los datos y no se codifican a mano: una lista fija deja de
   * coincidir con el contenido en cuanto se añade una categoría nueva.
   * @returns {Promise<string[]>} Categorías con su grafía original.
   */
  function obtenerCategorias() {
    return cargar().then(function (noticias) {
      const vistas = {};
      const categorias = [];
      noticias.forEach(function (noticia) {
        if (!vistas[noticia.claveCategoria]) {
          vistas[noticia.claveCategoria] = true;
          categorias.push(noticia.categoria);
        }
      });
      return categorias;
    });
  }

  /**
   * Calcula el siguiente identificador libre.
   *
   * Se deriva del máximo existente y no de la longitud del arreglo: al eliminar
   * y volver a crear, la longitud reutilizaría un id ya usado.
   * @returns {Promise<number>} Identificador disponible.
   */
  function siguienteId() {
    return cargar().then(function (noticias) {
      let maximo = 0;
      noticias.concat(window.ITN.almacenamiento.leerCreadas()).forEach(function (n) {
        maximo = Math.max(maximo, Number(n.id) || 0);
      });
      return maximo + 1;
    });
  }

  /**
   * Pinta el mensaje de error de carga dentro de un contenedor.
   *
   * El error se muestra en pantalla y no sólo en consola: bajo file:// el fetch
   * se bloquea por CORS y el usuario vería una sección vacía sin explicación.
   * @param {HTMLElement} contenedor - Elemento donde mostrar el aviso.
   * @param {Error} [error] - Error capturado; si trae mensaje, se usa el suyo.
   * @returns {void}
   */
  function mostrarError(contenedor, error) {
    if (!contenedor) {
      return;
    }
    const mensaje = error && error.message ? error.message : MENSAJE_ERROR;
    contenedor.innerHTML =
      '<div class="itn-aviso itn-aviso--error" role="alert">' +
      '<p class="font-semibold">No se pudieron cargar las noticias</p>' +
      '<p>' + mensaje + '</p>' +
      '</div>';
  }

  return {
    cargar: cargar,
    obtenerDestacadas: obtenerDestacadas,
    obtenerPorId: obtenerPorId,
    obtenerCategorias: obtenerCategorias,
    obtenerCategoriasClave: normalizarCategoria,
    siguienteId: siguienteId,
    normalizar: normalizar,
    mostrarError: mostrarError
  };
}());
