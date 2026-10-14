/**
 * noticia.model.ts — Definición del modelo de datos de Noticias.
 *
 * Mapea exactamente los campos del archivo data/news.json y las extensiones
 * en tiempo de ejecución generadas por el repositorio.
 */
export interface Noticia {
  /** Identificador numérico único de la noticia. */
  id: number;
  /** Titular principal del artículo. */
  titulo: string;
  /** Categoría temática (ej. 'TECNOLOGÍA', 'CIENCIA'). */
  categoria: string;
  /** Categoría normalizada en minúsculas y sin acentos para filtrado. */
  claveCategoria?: string;
  /** Resumen o entradilla informativa. */
  resumen: string;
  /** Párrafos completos del cuerpo del artículo. */
  contenido: string[];
  /** Tiempo estimado de lectura (ej. '4 min'). */
  tiempo: string;
  /** Indica si la noticia es destacada para la portada. */
  destacado: boolean;
  /** Ruta relativa a la imagen ilustrativa. */
  imagen: string;
  /** Autor o fuente de la fotografía. */
  creditoImagen: string;
  /** Indica si el registro fue creado por el usuario en el CRUD. */
  creada?: boolean;
}
