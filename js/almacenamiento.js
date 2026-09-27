/**
 * almacenamiento.js — Fachada única sobre localStorage.
 *
 * Es el ÚNICO módulo del proyecto que toca localStorage. Agrupa dos usos que
 * comparten una sola responsabilidad (persistir el estado del usuario en el
 * navegador): la lista de favoritos y la capa de altas/bajas del mini CRUD.
 *
 * Todas las lecturas y escrituras están protegidas: localStorage lanza
 * excepciones en modo privado de Safari, con la cuota agotada o con los datos
 * de sitio deshabilitados, y su contenido es una cadena que pudo escribir otra
 * pestaña o una versión anterior del código.
 */
window.ITN = window.ITN || {};

window.ITN.almacenamiento = (function () {
    'use strict';

    const CLAVE_FAVORITOS = 'itn.favoritos';
    const CLAVE_CREADAS = 'itn.noticias.creadas';
    const CLAVE_ELIMINADAS = 'itn.noticias.eliminadas';

    /**
     * Lee una clave y devuelve siempre un arreglo utilizable.
     * @param {string} clave - Nombre completo de la clave en localStorage.
     * @returns {Array} El arreglo almacenado, o uno vacío ante cualquier anomalía.
     */
    function leerArreglo(clave) {
        try {
            const crudo = window.localStorage.getItem(clave);
            if (!crudo) {
                return [];
            }
            const valor = JSON.parse(crudo);
            // Se valida la forma y no sólo el parseo: la clave pudo quedar con
            // "null", "{}" o un objeto de una versión anterior del código.
            return Array.isArray(valor) ? valor : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Escribe un arreglo en una clave.
     * @param {string} clave - Nombre completo de la clave en localStorage.
     * @param {Array} valor - Arreglo a serializar.
     * @returns {boolean} true si se guardó, false si el navegador lo impidió.
     */
    function escribirArreglo(clave, valor) {
        try {
            window.localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (error) {
            // Se devuelve false en lugar de propagar: quien llama decide si avisa al
            // usuario, y un fallo de almacenamiento no debe tumbar la interfaz.
            return false;
        }
    }

    /**
     * Devuelve los identificadores marcados como favoritos.
     * @returns {number[]} Arreglo de ids; vacío si no hay ninguno.
     */
    function leerFavoritos() {
        return leerArreglo(CLAVE_FAVORITOS).filter(function (id) {
            return typeof id === 'number';
        });
    }

    /**
     * Indica si una noticia está marcada como favorita.
     * @param {number} id - Identificador de la noticia.
     * @returns {boolean} true si está en la lista de favoritos.
     */
    function esFavorito(id) {
        return leerFavoritos().includes(Number(id));
    }

    /**
     * Alterna una noticia en la lista de favoritos.
     * @param {number} id - Identificador de la noticia.
     * @returns {boolean} true si quedó marcada como favorita, false si se quitó.
     */
    function alternarFavorito(id) {
        const numero = Number(id);
        const favoritos = leerFavoritos();
        const posicion = favoritos.indexOf(numero);

        if (posicion === -1) {
            favoritos.push(numero);
            escribirArreglo(CLAVE_FAVORITOS, favoritos);
            return true;
        }

        favoritos.splice(posicion, 1);
        escribirArreglo(CLAVE_FAVORITOS, favoritos);
        return false;
    }

    /**
     * Devuelve las noticias creadas por el usuario.
     * @returns {Object[]} Registros completos guardados en el navegador.
     */
    function leerCreadas() {
        return leerArreglo(CLAVE_CREADAS).filter(function (noticia) {
            return noticia && typeof noticia === 'object' && 'id' in noticia;
        });
    }

    /**
     * Añade una noticia creada por el usuario.
     * @param {Object} noticia - Registro completo ya normalizado.
     * @returns {boolean} true si se guardó correctamente.
     */
    function agregarCreada(noticia) {
        const creadas = leerCreadas();
        creadas.push(noticia);
        return escribirArreglo(CLAVE_CREADAS, creadas);
    }

    /**
     * Devuelve los identificadores de noticias eliminadas.
     * @returns {number[]} Arreglo de ids eliminados.
     */
    function leerEliminadas() {
        return leerArreglo(CLAVE_ELIMINADAS).filter(function (id) {
            return typeof id === 'number';
        });
    }

    /**
     * Marca una noticia como eliminada.
     *
     * Una noticia creada por el usuario se borra de su propia lista; una de la
     * semilla sólo puede ocultarse, porque el archivo JSON es de sólo lectura.
     * @param {number} id - Identificador de la noticia a eliminar.
     * @returns {boolean} true si la operación se persistió.
     */
    function eliminarNoticia(id) {
        const numero = Number(id);
        const creadas = leerCreadas();
        const restantes = creadas.filter(function (noticia) {
            return Number(noticia.id) !== numero;
        });

        if (restantes.length !== creadas.length) {
            return escribirArreglo(CLAVE_CREADAS, restantes);
        }

        const eliminadas = leerEliminadas();
        if (!eliminadas.includes(numero)) {
            eliminadas.push(numero);
        }
        return escribirArreglo(CLAVE_ELIMINADAS, eliminadas);
    }

    /**
     * Borra todo el estado del usuario y devuelve la aplicación a la semilla.
     * @returns {boolean} true si las tres claves se eliminaron.
     */
    function restaurar() {
        try {
            window.localStorage.removeItem(CLAVE_FAVORITOS);
            window.localStorage.removeItem(CLAVE_CREADAS);
            window.localStorage.removeItem(CLAVE_ELIMINADAS);
            return true;
        } catch (error) {
            return false;
        }
    }

    return {
        leerFavoritos: leerFavoritos,
        esFavorito: esFavorito,
        alternarFavorito: alternarFavorito,
        leerCreadas: leerCreadas,
        agregarCreada: agregarCreada,
        leerEliminadas: leerEliminadas,
        eliminarNoticia: eliminarNoticia,
        restaurar: restaurar
    };
}());
