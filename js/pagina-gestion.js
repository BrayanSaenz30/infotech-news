/**
 * pagina-gestion.js — Controlador del mini CRUD de noticias.
 *
 * Orquesta el alta, la baja y la restauración: lee el formulario, pide la
 * evaluación a ITN.validacion, el registro normalizado a ITN.repositorio, la
 * persistencia a ITN.almacenamiento y el marcado a ITN.tarjetas. Aquí no vive
 * ninguna regla de validación ni ninguna decisión de almacenamiento.
 *
 * Depende de: ITN.repositorio, ITN.almacenamiento, ITN.tarjetas,
 * ITN.validacion (4 de 4 permitidas).
 */
window.ITN = window.ITN || {};

(function () {
  'use strict';

  const CAMPOS = ['titulo', 'categoria', 'resumen', 'contenido', 'imagen'];
  const PREFIJO_CAMPO = 'campo-';
  const PREFIJO_ERROR = 'error-';
  const ID_LISTADO = 'contenedor-gestion';
  const PALABRAS_POR_MINUTO = 200;

  // Un párrafo termina donde el usuario dejó una línea en blanco: es la única
  // convención que puede aplicar desde un <textarea> sin editor enriquecido.
  const SEPARADOR_PARRAFOS = /\n\s*\n/;

  const CONFIRMAR_ELIMINAR =
    '¿Seguro que desea eliminar esta noticia? Esta acción se puede revertir ' +
    'con "Restaurar datos".';
  const CONFIRMAR_RESTAURAR =
    '¿Seguro que desea restaurar los datos originales? Se perderán las ' +
    'noticias que haya creado y su lista de favoritos.';
  const FALLO_GUARDADO =
    'No se pudo guardar la noticia en este navegador. Compruebe que el ' +
    'almacenamiento local esté habilitado y vuelva a intentarlo.';

  /**
   * Devuelve el control de formulario de un campo.
   * @param {string} nombre - Nombre lógico del campo.
   * @returns {HTMLElement} Control asociado al campo.
   */
  function campo(nombre) {
    return document.getElementById(PREFIJO_CAMPO + nombre);
  }

  /**
   * Devuelve el contenedor del mensaje de error de un campo.
   * @param {string} nombre - Nombre lógico del campo.
   * @returns {HTMLElement} Párrafo con role="alert" del campo.
   */
  function contenedorError(nombre) {
    return document.getElementById(PREFIJO_ERROR + nombre);
  }

  /**
   * Devuelve el contenedor de las tarjetas del listado.
   * @returns {HTMLElement} Rejilla de tarjetas.
   */
  function contenedorListado() {
    return document.getElementById(ID_LISTADO);
  }

  /**
   * Construye el mapa de reglas del formulario.
   *
   * Las reglas son datos y viven en validacion.js; aquí sólo se declara qué
   * regla se aplica a qué campo.
   * @returns {Object.<string, Function[]>} Reglas por nombre de campo.
   */
  function construirReglas() {
    const v = window.ITN.validacion;

    return {
      titulo: [v.obligatorio, v.longitudMinima(10), v.longitudMaxima(120)],
      categoria: [v.obligatorio],
      resumen: [v.obligatorio, v.longitudMinima(20), v.longitudMaxima(300)],
      contenido: [v.obligatorio, v.longitudMinima(50)],
      imagen: [v.url]
    };
  }

  /**
   * Lee los valores actuales del formulario.
   * @returns {Object.<string, string>} Valor por nombre de campo.
   */
  function leerValores() {
    const valores = {};
    CAMPOS.forEach(function (nombre) {
      valores[nombre] = campo(nombre).value;
    });
    return valores;
  }

  /**
   * Borra el error mostrado en un campo.
   * @param {string} nombre - Nombre lógico del campo.
   * @returns {void}
   */
  function limpiarError(nombre) {
    campo(nombre).removeAttribute('aria-invalid');
    contenedorError(nombre).textContent = '';
  }

  /**
   * Muestra el error de un campo y lo marca como inválido.
   * @param {string} nombre - Nombre lógico del campo.
   * @param {string} mensaje - Texto que se anuncia al usuario.
   * @returns {void}
   */
  function mostrarError(nombre, mensaje) {
    campo(nombre).setAttribute('aria-invalid', 'true');
    contenedorError(nombre).textContent = mensaje;
  }

  /**
   * Refleja en la interfaz el resultado completo de la evaluación.
   * @param {Object.<string, string>} errores - Errores por campo.
   * @returns {void}
   */
  function pintarErrores(errores) {
    CAMPOS.forEach(function (nombre) {
      if (errores[nombre]) {
        mostrarError(nombre, errores[nombre]);
        return;
      }
      limpiarError(nombre);
    });
  }

  /**
   * Lleva el foco al primer campo inválido.
   *
   * Sin esto, en un formulario largo el usuario de teclado no sabe dónde se
   * produjo el fallo que acaba de anunciarse.
   * @param {Object.<string, string>} errores - Errores por campo.
   * @returns {void}
   */
  function enfocarPrimerError(errores) {
    const primero = CAMPOS.find(function (nombre) {
      return Boolean(errores[nombre]);
    });

    if (primero) {
      campo(primero).focus();
    }
  }

  /**
   * Oculta los dos avisos del formulario.
   * @returns {void}
   */
  function ocultarAvisos() {
    document.getElementById('aviso-creacion').hidden = true;
    document.getElementById('aviso-error-formulario').hidden = true;
  }

  /**
   * Muestra la confirmación de alta con el enlace al detalle de la noticia.
   * @param {Object} noticia - Noticia recién guardada.
   * @returns {void}
   */
  function mostrarExito(noticia) {
    const aviso = document.getElementById('aviso-creacion');

    aviso.innerHTML =
      '<p class="font-semibold">Noticia creada correctamente</p>' +
      '<p class="text-sm mt-1">«' + window.ITN.tarjetas.escapar(noticia.titulo) +
      '» ya aparece en el listado. ' +
      '<a class="underline font-semibold" href="detalle.html?id=' + noticia.id +
      '">Ver el detalle</a></p>';
    aviso.hidden = false;
  }

  /**
   * Muestra en la página el aviso de que no se pudo guardar.
   * @returns {void}
   */
  function mostrarFalloGuardado() {
    const aviso = document.getElementById('aviso-error-formulario');

    aviso.innerHTML =
      '<p class="font-semibold">No se pudo guardar la noticia</p>' +
      '<p class="text-sm mt-1">' + FALLO_GUARDADO + '</p>';
    aviso.hidden = false;
  }

  /**
   * Separa el texto del formulario en párrafos.
   * @param {string} texto - Contenido tal como lo escribió el usuario.
   * @returns {string[]} Párrafos sin líneas vacías.
   */
  function dividirEnParrafos(texto) {
    return String(texto)
      .split(SEPARADOR_PARRAFOS)
      .map(function (parrafo) {
        return parrafo.trim();
      })
      .filter(function (parrafo) {
        return parrafo !== '';
      });
  }

  /**
   * Estima los minutos de lectura de un conjunto de párrafos.
   * @param {string[]} parrafos - Párrafos del artículo.
   * @returns {number} Minutos de lectura, nunca menos de uno.
   */
  function minutosDeLectura(parrafos) {
    const palabras = parrafos.join(' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO));
  }

  /**
   * Construye el registro de la noticia a partir de los valores del formulario.
   *
   * La imagen vacía y los valores por defecto los resuelve el normalizador del
   * repositorio: es el módulo que decide cómo es un registro completo.
   * @param {Object.<string, string>} valores - Valores validados del formulario.
   * @param {number} id - Identificador libre calculado por el repositorio.
   * @returns {Object} Modelo de vista listo para guardar.
   */
  function construirNoticia(valores, id) {
    const parrafos = dividirEnParrafos(valores.contenido);

    return window.ITN.repositorio.normalizar({
      id: id,
      titulo: valores.titulo.trim(),
      categoria: valores.categoria,
      resumen: valores.resumen.trim(),
      contenido: parrafos,
      tiempo: 'Publicada por usted · ' + minutosDeLectura(parrafos) + ' min de lectura',
      destacado: false,
      imagen: valores.imagen.trim(),
      creditoImagen: 'Imagen aportada por el autor de la publicación',
      creada: true
    });
  }

  /**
   * Pinta el listado de noticias con el botón de eliminar en cada tarjeta.
   * @param {Object[]} noticias - Noticias vigentes.
   * @returns {void}
   */
  function pintarListado(noticias) {
    const contenedor = contenedorListado();

    if (!noticias.length) {
      window.ITN.tarjetas.renderizarVacio(
        contenedor,
        'No queda ninguna noticia',
        'Cree una con el formulario o pulse «Restaurar datos originales».'
      );
      return;
    }

    window.ITN.tarjetas.renderizar(contenedor, noticias, { conEliminar: true });
  }

  /**
   * Vuelve a pedir las noticias al repositorio y repinta el listado.
   * @returns {Promise<void>} Promesa resuelta cuando el listado está pintado.
   */
  function refrescarListado() {
    return window.ITN.repositorio
      .cargar()
      .then(pintarListado)
      .catch(function () {
        window.ITN.repositorio.mostrarError(contenedorListado());
      });
  }

  /**
   * Guarda la noticia y deja el formulario listo para la siguiente.
   * @param {Object} noticia - Registro normalizado.
   * @returns {void}
   */
  function guardar(noticia) {
    if (!window.ITN.almacenamiento.agregarCreada(noticia)) {
      mostrarFalloGuardado();
      return;
    }

    document.getElementById('formulario-noticia').reset();
    CAMPOS.forEach(limpiarError);
    mostrarExito(noticia);
    refrescarListado();
  }

  /**
   * Atiende el envío del formulario de alta.
   * @param {Event} evento - Evento submit del formulario.
   * @returns {void}
   */
  function alEnviar(evento) {
    evento.preventDefault();
    ocultarAvisos();

    const valores = leerValores();
    const errores = window.ITN.validacion.evaluar(valores, construirReglas());

    pintarErrores(errores);

    if (!window.ITN.validacion.esValido(errores)) {
      enfocarPrimerError(errores);
      return;
    }

    window.ITN.repositorio
      .siguienteId()
      .then(function (id) {
        guardar(construirNoticia(valores, id));
      })
      .catch(function () {
        mostrarFalloGuardado();
      });
  }

  /**
   * Borra el error de un campo en cuanto el usuario lo edita.
   * @param {Event} evento - Evento input o change del formulario.
   * @returns {void}
   */
  function alEditarCampo(evento) {
    const nombre = evento.target.dataset.campo;
    if (nombre) {
      limpiarError(nombre);
    }
  }

  /**
   * Atiende la pulsación de un botón de eliminar del listado.
   *
   * Se delega en el contenedor porque las tarjetas se vuelven a renderizar tras
   * cada cambio y los oyentes enlazados a los botones antiguos se perderían.
   * @param {Event} evento - Evento click del contenedor.
   * @returns {void}
   */
  function alPulsarListado(evento) {
    const boton = evento.target.closest('.itn-eliminar');
    if (!boton) {
      return;
    }

    if (!window.confirm(CONFIRMAR_ELIMINAR)) {
      return;
    }

    window.ITN.almacenamiento.eliminarNoticia(Number(boton.dataset.id));
    refrescarListado();
  }

  /**
   * Restaura la semilla original tras confirmarlo con el usuario.
   * @returns {void}
   */
  function alRestaurar() {
    if (!window.confirm(CONFIRMAR_RESTAURAR)) {
      return;
    }

    window.ITN.almacenamiento.restaurar();
    // Se recarga la página en lugar de repintar: el repositorio conserva la
    // semilla en memoria y sólo un arranque limpio la vuelve a componer.
    window.location.reload();
  }

  /**
   * Rellena el desplegable con las categorías presentes en los datos.
   * @param {string[]} categorias - Categorías con su grafía original.
   * @returns {void}
   */
  function construirOpciones(categorias) {
    const opciones = categorias.map(function (categoria) {
      const texto = window.ITN.tarjetas.escapar(categoria);
      return '<option value="' + texto + '">' + texto + '</option>';
    });

    campo('categoria').innerHTML =
      '<option value="">Seleccione una categoría</option>' + opciones.join('');
  }

  /**
   * Conecta el formulario, el listado y el botón de restauración.
   * @returns {void}
   */
  function conectarControles() {
    const formulario = document.getElementById('formulario-noticia');
    const contenedor = contenedorListado();

    formulario.addEventListener('submit', alEnviar);
    // Se escuchan los dos eventos porque el <select> notifica el cambio con
    // change en los navegadores que no emiten input sobre él.
    formulario.addEventListener('input', alEditarCampo);
    formulario.addEventListener('change', alEditarCampo);

    contenedor.addEventListener('click', alPulsarListado);
    window.ITN.tarjetas.conectarFavoritos(contenedor);

    document.getElementById('boton-restaurar').addEventListener('click', alRestaurar);
  }

  /**
   * Inicializa la página de gestión.
   * @returns {void}
   */
  function iniciar() {
    conectarControles();

    window.ITN.repositorio
      .obtenerCategorias()
      .then(function (categorias) {
        construirOpciones(categorias);
        return window.ITN.repositorio.cargar();
      })
      .then(pintarListado)
      .catch(function () {
        window.ITN.repositorio.mostrarError(contenedorListado());
      });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
}());
