/**
 * pagina-inicio.js — Controlador de la página de inicio.
 *
 * Sólo orquesta: pide las destacadas al repositorio y las entrega al módulo de
 * tarjetas. No contiene reglas de negocio.
 *
 * Depende de: ITN.repositorio, ITN.tarjetas (2 de 4 permitidas).
 */
window.ITN = window.ITN || {};

(function () {
  'use strict';

  /**
   * Carga y muestra las noticias destacadas.
   * @returns {void}
   */
  function mostrarDestacadas() {
    const contenedor = document.getElementById('contenedor-destacados');
    if (!contenedor) {
      return;
    }

    window.ITN.repositorio
      .obtenerDestacadas()
      .then(function (destacadas) {
        if (!destacadas.length) {
          window.ITN.tarjetas.renderizarVacio(
            contenedor,
            'Todavía no hay noticias destacadas',
            'Cree una noticia desde la página de Gestión o restaure los datos originales.'
          );
          return;
        }
        window.ITN.tarjetas.renderizar(contenedor, destacadas);
        window.ITN.tarjetas.conectarFavoritos(contenedor);
      })
      .catch(function () {
        window.ITN.repositorio.mostrarError(contenedor);
      });
  }

  document.addEventListener('DOMContentLoaded', mostrarDestacadas);
}());
