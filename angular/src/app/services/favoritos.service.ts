import { Injectable } from '@angular/core';

/**
 * FavoritosService — Gestión y persistencia de favoritos del usuario.
 *
 * Utiliza exactamente la misma clave en localStorage ('itn.favoritos') que
 * js/almacenamiento.js, garantizando interoperabilidad bidireccional entre
 * la aplicación Angular y el sitio Vanilla JS.
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private readonly CLAVE_FAVORITOS = 'itn.favoritos';

  /**
   * Obtiene la lista de identificadores marcados como favoritos.
   * Maneja errores de parseo y cuota retornando un arreglo vacío en caso de fallo.
   * @returns Arreglo de números con los IDs de favoritos.
   */
  obtenerFavoritos(): number[] {
    try {
      const crudo = window.localStorage.getItem(this.CLAVE_FAVORITOS);
      if (!crudo) {
        return [];
      }
      const parsed = JSON.parse(crudo);
      return Array.isArray(parsed) ? parsed.map((id: any) => Number(id)).filter((id: number) => !isNaN(id)) : [];
    } catch {
      return [];
    }
  }

  /**
   * Verifica si un identificador específico está en favoritos.
   * @param id Identificador numérico de la noticia.
   * @returns true si está guardado, false en caso contrario.
   */
  esFavorito(id: number): boolean {
    return this.obtenerFavoritos().includes(id);
  }

  /**
   * Alterna el estado de favorito para un identificador dado.
   * Si ya existe, se elimina; si no existe, se agrega.
   * @param id Identificador numérico de la noticia.
   * @returns El nuevo estado de favorito (true si quedó guardado, false si se removió).
   */
  alternarFavorito(id: number): boolean {
    const actuales = this.obtenerFavoritos();
    const indice = actuales.indexOf(id);
    let nuevoEstado = false;

    if (indice >= 0) {
      actuales.splice(indice, 1);
      nuevoEstado = false;
    } else {
      actuales.push(id);
      nuevoEstado = true;
    }

    try {
      window.localStorage.setItem(this.CLAVE_FAVORITOS, JSON.stringify(actuales));
    } catch {
      // Ignorar fallo de almacenamiento (ej. modo privado restringido)
    }

    return nuevoEstado;
  }
}
