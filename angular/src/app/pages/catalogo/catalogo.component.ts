import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoticiaCardComponent } from '../../components/noticia-card/noticia-card.component';
import { NoticiasService, normalizarCategoria } from '../../services/noticias.service';
import { FavoritosService } from '../../services/favoritos.service';
import { Noticia } from '../../models/noticia.model';

/**
 * CatalogoComponent — Vista principal de catálogo de noticias en Angular.
 *
 * Presenta:
 * - Píldoras de filtro generadas dinámicamente según las noticias vigentes.
 * - Buscador en tiempo real con Two-way data binding [(ngModel)].
 * - Conteo dinámico de resultados e interpolación {{ }}.
 * - Renderizado de tarjetas con control de flujo @for y @if.
 */
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, NoticiaCardComponent],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent implements OnInit {
  /** Todas las noticias cargadas del servicio. */
  noticias: Noticia[] = [];

  /** Lista de categorías únicas extraídas de los datos. */
  categorias: string[] = [];

  /** Clave de la categoría seleccionada ('todas' por defecto). */
  categoriaSeleccionada: string = 'todas';

  /** Término de búsqueda enlazado bidireccionalmente con [(ngModel)]. */
  terminoBusqueda: string = '';

  /** Estado de carga de datos. */
  cargando: boolean = true;

  /** Mensaje de error si falla la carga. */
  mensajeError: string | null = null;

  constructor(
    private noticiasService: NoticiasService,
    private favoritosService: FavoritosService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga las noticias y las categorías a través del servicio de noticias.
   */
  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = null;

    this.noticiasService.obtenerNoticias().subscribe({
      next: (datos) => {
        this.noticias = datos;
        const setCategorias = new Set<string>();
        for (const n of datos) {
          if (n.categoria) setCategorias.add(n.categoria);
        }
        this.categorias = Array.from(setCategorias);
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar las noticias. Verifique que el archivo ../data/news.json esté accesible.';
        this.cargando = false;
      }
    });
  }

  /**
   * Cambia la categoría activa para el filtrado.
   * @param cat Nombre de la categoría o 'todas'.
   */
  seleccionarCategoria(cat: string): void {
    this.categoriaSeleccionada = cat === 'todas' ? 'todas' : normalizarCategoria(cat);
  }

  /**
   * Determina si una noticia está marcada como favorita.
   * @param id ID de la noticia.
   * @returns true si está guardada.
   */
  esFavorito(id: number): boolean {
    return this.favoritosService.esFavorito(id);
  }

  /**
   * Alterna el estado de favorito desde el evento emitido por NoticiaCardComponent.
   * @param id ID de la noticia.
   */
  onToggleFavorito(id: number): void {
    this.favoritosService.alternarFavorito(id);
  }

  /**
   * Noticias resultantes tras aplicar filtro de categoría y término de búsqueda.
   */
  get noticiasFiltradas(): Noticia[] {
    const termino = (this.terminoBusqueda || '').trim().toLowerCase();

    return this.noticias.filter(noticia => {
      const coincideCat = this.categoriaSeleccionada === 'todas' ||
        noticia.claveCategoria === this.categoriaSeleccionada;

      const coincideTexto = termino === '' ||
        noticia.titulo.toLowerCase().includes(termino) ||
        noticia.resumen.toLowerCase().includes(termino);

      return coincideCat && coincideTexto;
    });
  }
}
