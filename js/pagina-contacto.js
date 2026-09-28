/**
 * pagina-contacto.js — Controlador de la página de contacto.
 *
 * Sólo orquesta: lee los valores del formulario, se los pasa a ITN.validacion,
 * y pinta el resultado en el DOM. Ninguna regla sobre qué hace válido a un
 * campo vive aquí; todas viven en js/validacion.js, que esta página consume
 * sin modificarlo.
 *
 * Depende de un módulo ITN: validacion (1 de 4).
 */
window.ITN = window.ITN || {};

window.ITN.paginaContacto = (function () {
  'use strict';

  const ID_FORMULARIO = 'itn-formulario-contacto';
  const ID_CONFIRMACION = 'itn-confirmacion';
  const PREFIJO_ERROR = 'error-';
  const CLASE_OCULTO = 'hidden';
  const MENSAJE_EXITO = '¡Mensaje enviado con éxito! Le responderemos en un plazo de 48 horas.';

  // Orden de arriba abajo en el formulario: es el que decide a qué campo se
  // lleva el foco cuando el envío falla.
  const CAMPOS = ['nombre', 'correo', 'asunto', 'mensaje'];

  // validacion.js se carga antes que este archivo (orden de los <script defer>
  // en contacto.html), así que la referencia ya existe al evaluar el módulo.
  const validacion = window.ITN.validacion;
  let reglas = null;

  /**
   * Comprueba que un nodo sea uno de los campos editables del formulario.
   * @param {EventTarget|null} control - Nodo recibido desde el DOM.
   * @returns {boolean} true si el nodo expone un valor de texto.
   */
  function esCampoEditable(control) {
    return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement;
  }

  /**
   * Construye el mapa de reglas del formulario de contacto.
   *
   * Las reglas son datos: añadir un campo añade una entrada, no una rama.
   * @returns {Object.<string, Function[]>} Reglas por nombre de campo.
   */
  function crearReglas() {
    return {
      nombre: [validacion.obligatorio, validacion.longitudMinima(3), validacion.longitudMaxima(80)],
      correo: [validacion.obligatorio, validacion.correo],
      asunto: [validacion.obligatorio, validacion.longitudMinima(5), validacion.longitudMaxima(120)],
      mensaje: [validacion.obligatorio, validacion.longitudMinima(20), validacion.longitudMaxima(1000)]
    };
  }

  /**
   * Recoge los valores escritos en el formulario.
   * @param {HTMLFormElement} formulario - Formulario de contacto.
   * @returns {Object.<string, string>} Valores en crudo por nombre de campo.
   */
  function leerValores(formulario) {
    const valores = {};

    CAMPOS.forEach(function (campo) {
      const control = formulario.elements.namedItem(campo);
      valores[campo] = esCampoEditable(control) ? control.value : '';
    });

    return valores;
  }

  /**
   * Refleja en un campo su estado de validez: mensaje visible y aria-invalid.
   * @param {string} campo - Nombre del campo, que coincide con su id.
   * @param {string} mensaje - Mensaje de error, o cadena vacía si es válido.
   * @returns {void}
   */
  function aplicarEstadoCampo(campo, mensaje) {
    const control = document.getElementById(campo);
    const contenedor = document.getElementById(PREFIJO_ERROR + campo);

    if (!control || !contenedor) {
      return;
    }

    // textContent y no innerHTML: el mensaje se inserta siempre como texto.
    contenedor.textContent = mensaje;

    if (mensaje) {
      control.setAttribute('aria-invalid', 'true');
      return;
    }
    control.removeAttribute('aria-invalid');
  }

  /**
   * Pinta el resultado completo de una evaluación sobre los cuatro campos.
   * @param {Object.<string, string>} errores - Errores por campo.
   * @returns {void}
   */
  function pintarErrores(errores) {
    CAMPOS.forEach(function (campo) {
      aplicarEstadoCampo(campo, errores[campo] || '');
    });
  }

  /**
   * Lleva el foco al primer campo inválido, en el orden visual del formulario.
   *
   * Sin esto, quien navega con teclado o con lector de pantalla se queda en el
   * botón de enviar y no sabe qué campo corregir.
   * @param {Object.<string, string>} errores - Errores por campo.
   * @returns {void}
   */
  function enfocarPrimerInvalido(errores) {
    const campo = CAMPOS.find(function (nombre) {
      return Boolean(errores[nombre]);
    });
    const control = campo ? document.getElementById(campo) : null;

    if (control) {
      control.focus();
    }
  }

  /**
   * Muestra el mensaje de confirmación del envío.
   *
   * El texto se escribe después de quitar la clase que lo oculta para que el
   * role="status" anuncie un cambio ya visible; un cambio hecho mientras el
   * contenedor está en display:none no siempre se anuncia.
   * @returns {void}
   */
  function mostrarConfirmacion() {
    const aviso = document.getElementById(ID_CONFIRMACION);

    if (!aviso) {
      return;
    }
    aviso.classList.remove(CLASE_OCULTO);
    aviso.textContent = MENSAJE_EXITO;
  }

  /**
   * Oculta el mensaje de confirmación y vacía su texto.
   * @returns {void}
   */
  function ocultarConfirmacion() {
    const aviso = document.getElementById(ID_CONFIRMACION);

    if (!aviso) {
      return;
    }
    aviso.classList.add(CLASE_OCULTO);
    aviso.textContent = '';
  }

  /**
   * Vuelve a evaluar un único campo y actualiza su mensaje.
   * @param {HTMLElement} control - Campo que se está editando.
   * @returns {void}
   */
  function revalidarCampo(control) {
    const valores = {};
    const reglasDelCampo = {};

    if (!reglas[control.id]) {
      return;
    }
    valores[control.id] = control.value;
    reglasDelCampo[control.id] = reglas[control.id];

    aplicarEstadoCampo(control.id, validacion.evaluar(valores, reglasDelCampo)[control.id] || '');
  }

  /**
   * Responde a la edición de cualquier campo del formulario.
   * @param {Event} evento - Evento input delegado en el formulario.
   * @returns {void}
   */
  function manejarEdicion(evento) {
    const control = evento.target;

    ocultarConfirmacion();
    if (!esCampoEditable(control)) {
      return;
    }

    // Sólo se revalida un campo que ya estaba marcado como inválido: avisar
    // antes del primer envío interrumpiría a quien todavía está escribiendo.
    if (control.getAttribute('aria-invalid') !== 'true') {
      return;
    }
    revalidarCampo(control);
  }

  /**
   * Valida el formulario y decide si se muestra la confirmación.
   * @param {Event} evento - Evento submit del formulario.
   * @returns {void}
   */
  function manejarEnvio(evento) {
    const formulario = evento.currentTarget;
    let errores;

    if (!(formulario instanceof HTMLFormElement)) {
      return;
    }

    // Se cancela el envío nativo porque no hay servidor al que enviar: la
    // página es estática y la confirmación la pinta esta misma función.
    evento.preventDefault();

    errores = validacion.evaluar(leerValores(formulario), reglas);
    pintarErrores(errores);

    if (!validacion.esValido(errores)) {
      ocultarConfirmacion();
      enfocarPrimerInvalido(errores);
      return;
    }

    formulario.reset();
    mostrarConfirmacion();
  }

  /**
   * Conecta el formulario de contacto con sus manejadores.
   * @returns {void}
   */
  function iniciar() {
    const formulario = document.getElementById(ID_FORMULARIO);

    if (!(formulario instanceof HTMLFormElement) || !validacion) {
      return;
    }
    reglas = crearReglas();

    formulario.addEventListener('submit', manejarEnvio);
    // Escucha delegada en el formulario: un solo oyente cubre los cuatro
    // campos y no hay que volver a enlazar nada tras un reset.
    formulario.addEventListener('input', manejarEdicion);
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  return {};
}());
