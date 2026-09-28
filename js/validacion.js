/**
 * validacion.js — Mapa de validadores y evaluación de formularios.
 *
 * Las reglas de un formulario son datos, no ramas: un objeto asocia cada campo
 * con su lista de reglas, y una función lo recorre. Añadir un campo añade una
 * entrada, no un if.
 *
 * Este archivo es de SÓLO LECTURA para las páginas que lo consumen (contacto y
 * gestión). Si un formulario necesita una regla que no existe aquí, se reporta;
 * no se edita este archivo desde la unidad que lo consume.
 *
 * No depende de ningún otro módulo ITN (0 de 4).
 */
window.ITN = window.ITN || {};

window.ITN.validacion = (function () {
  'use strict';

  // Exige texto antes y después de la arroba, un punto en el dominio y al menos
  // dos letras de TLD. El type="email" del navegador acepta "a@b", que para
  // "correo válido" no basta.
  const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  const PATRON_URL = /^https?:\/\/[^\s]+\.[^\s]+$/;

  /**
   * Comprueba que un valor no esté vacío una vez recortado.
   *
   * Se recorta antes de comprobar porque el atributo required del navegador da
   * por válido un campo con sólo espacios.
   * @param {string} valor - Valor del campo.
   * @returns {string|null} Mensaje de error, o null si es válido.
   */
  function obligatorio(valor) {
    return String(valor || '').trim() === ''
      ? 'Este campo es obligatorio.'
      : null;
  }

  /**
   * Comprueba que el valor tenga forma de correo electrónico.
   * @param {string} valor - Valor del campo.
   * @returns {string|null} Mensaje de error, o null si es válido.
   */
  function correo(valor) {
    const limpio = String(valor || '').trim();
    if (limpio === '') {
      return null;
    }
    return PATRON_CORREO.test(limpio)
      ? null
      : 'Escriba un correo electrónico válido, por ejemplo nombre@dominio.com.';
  }

  /**
   * Crea una regla de longitud mínima.
   * @param {number} minimo - Número mínimo de caracteres.
   * @returns {function(string): (string|null)} Regla evaluable.
   */
  function longitudMinima(minimo) {
    return function (valor) {
      const limpio = String(valor || '').trim();
      if (limpio === '') {
        return null;
      }
      return limpio.length < minimo
        ? 'Debe tener al menos ' + minimo + ' caracteres.'
        : null;
    };
  }

  /**
   * Crea una regla de longitud máxima.
   * @param {number} maximo - Número máximo de caracteres.
   * @returns {function(string): (string|null)} Regla evaluable.
   */
  function longitudMaxima(maximo) {
    return function (valor) {
      return String(valor || '').trim().length > maximo
        ? 'No debe superar los ' + maximo + ' caracteres.'
        : null;
    };
  }

  /**
   * Comprueba que el valor sea una URL http o https.
   * @param {string} valor - Valor del campo.
   * @returns {string|null} Mensaje de error, o null si es válido.
   */
  function url(valor) {
    const limpio = String(valor || '').trim();
    if (limpio === '') {
      return null;
    }
    return PATRON_URL.test(limpio)
      ? null
      : 'Escriba una dirección web válida que empiece por http:// o https://.';
  }

  /**
   * Evalúa un conjunto de valores contra un mapa de reglas.
   * @param {Object.<string, string>} valores - Valores por nombre de campo.
   * @param {Object.<string, Function[]>} reglas - Reglas por nombre de campo.
   * @returns {Object.<string, string>} Errores por campo; vacío si todo es válido.
   */
  function evaluar(valores, reglas) {
    const errores = {};

    Object.keys(reglas).forEach(function (campo) {
      const valor = valores[campo];
      // Se detiene en la primera regla que falla: mostrar dos mensajes para un
      // mismo campo confunde más de lo que ayuda.
      for (let i = 0; i < reglas[campo].length; i += 1) {
        const mensaje = reglas[campo][i](valor);
        if (mensaje) {
          errores[campo] = mensaje;
          break;
        }
      }
    });

    return errores;
  }

  /**
   * Indica si un resultado de evaluación no contiene errores.
   * @param {Object.<string, string>} errores - Errores devueltos por evaluar.
   * @returns {boolean} true si no hay ningún error.
   */
  function esValido(errores) {
    return Object.keys(errores).length === 0;
  }

  return {
    obligatorio: obligatorio,
    correo: correo,
    longitudMinima: longitudMinima,
    longitudMaxima: longitudMaxima,
    url: url,
    evaluar: evaluar,
    esValido: esValido
  };
}());
