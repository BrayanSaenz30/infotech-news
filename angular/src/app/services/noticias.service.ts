import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import { Noticia } from '../models/noticia.model';

/**
 * Normaliza una categoría eliminando acentos y espacios, pasando a minúsculas.
 * Función pura extraída para mantener baja complejidad ciclomática.
 * @param valor Nombre de la categoría.
 * @returns Cadena normalizada para comparaciones.
 */
export function normalizarCategoria(valor: string): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Normaliza un registro crudo de noticia aplicando valores por defecto.
 * Función pura para garantizar robustez del modelo de vista.
 * @param crudo Registro proveniente del JSON o de localStorage.
 * @returns Noticia con todos sus campos completados.
 */
export function normalizarNoticia(crudo: any): Noticia {
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
 * Aplica la capa de overlay (creadas y eliminadas) sobre la semilla original de noticias.
 * Función pura idéntica a la lógica de repositorio.js: (semilla - eliminadas) + creadas.
 * @param semilla Lista de noticias base del JSON.
 * @param eliminadasIds IDs de noticias que el usuario marcó como eliminadas.
 * @param creadas Lista de noticias creadas manualmente por el usuario.
 * @returns Lista combinada final.
 */
export function aplicarOverlay(
  semilla: Noticia[],
  eliminadasIds: number[],
  creadas: Noticia[]
): Noticia[] {
  const activasSemilla = semilla.filter(n => !eliminadasIds.includes(n.id));
  return [...activasSemilla, ...creadas];
}

/**
 * NoticiasService — Servicio de datos para consulta y composición de noticias.
 *
 * Consume ../data/news.json y aplica la misma lógica de overlay de almacenamiento
 * que el prototipo original ('itn.noticias.creadas' e 'itn.noticias.eliminadas'),
 * permitiendo que las noticias creadas o eliminadas en la vista vanilla de gestión
 * se reflejen automáticamente en Angular.
 */
@Injectable({
  providedIn: 'root'
})
export class NoticiasService {
  private readonly RUTA_DATOS = '../data/news.json';
  private readonly CLAVE_CREADAS = 'itn.noticias.creadas';
  private readonly CLAVE_ELIMINADAS = 'itn.noticias.eliminadas';

  constructor(private http: HttpClient) {}

  /**
   * Lee un arreglo desde localStorage de forma segura ante excepciones de parseo.
   * @param clave Clave en localStorage.
   * @returns Arreglo almacenado o vacío si ocurre un error.
   */
  private leerArregloStorage(clave: string): any[] {
    try {
      const crudo = window.localStorage.getItem(clave);
      if (!crudo) return [];
      const valor = JSON.parse(crudo);
      return Array.isArray(valor) ? valor : [];
    } catch {
      return [];
    }
  }

  /**
   * Carga la lista completa de noticias aplicando la capa de cambios en localStorage.
   * @returns Observable con la lista normalizada de noticias.
   */
  obtenerNoticias(): Observable<Noticia[]> {
    return this.http.get<any[]>(this.RUTA_DATOS).pipe(
      map(items => {
        const semillaNormalizada = (Array.isArray(items) ? items : []).map(normalizarNoticia);
        
        const eliminadas = this.leerArregloStorage(this.CLAVE_ELIMINADAS)
          .map(id => Number(id))
          .filter(id => !isNaN(id));

        const creadas = this.leerArregloStorage(this.CLAVE_CREADAS)
          .map(normalizarNoticia)
          .map(n => ({ ...n, creada: true }));

        return aplicarOverlay(semillaNormalizada, eliminadas, creadas);
      })
    );
  }

  /**
   * Obtiene una noticia específica por su identificador numérico.
   * @param id Identificador de la noticia.
   * @returns Observable con la noticia encontrada o undefined si no existe.
   */
  obtenerPorId(id: number): Observable<Noticia | undefined> {
    return this.obtenerNoticias().pipe(
      map(noticias => noticias.find(n => n.id === id))
    );
  }

  /**
   * Obtiene la lista única de categorías disponibles a partir de las noticias vigentes.
   * @returns Observable con los nombres de categorías únicas.
   */
  obtenerCategorias(): Observable<string[]> {
    return this.obtenerNoticias().pipe(
      map(noticias => {
        const set = new Set<string>();
        for (const n of noticias) {
          if (n.categoria) {
            set.add(n.categoria);
          }
        }
        return Array.from(set);
      })
    );
  }
}
