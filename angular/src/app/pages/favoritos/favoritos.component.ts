import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NoticiaCardComponent } from '../../components/noticia-card/noticia-card.component';
import { NoticiasService } from '../../services/noticias.service';
import { FavoritosService } from '../../services/favoritos.service';
import { Noticia } from '../../models/noticia.model';

/**
 * FavoritosComponent — Vista reactiva de noticias marcadas como favoritas.
 *
 * Características:
 * - Consulta los IDs persistidos en FavoritosService (itn.favoritos).
 * - Cruza dichos IDs con el catálogo provisto por NoticiasService.
 * - Al remover una noticia favorita, actualiza la lista local y la grilla de inmediato
 *   sin requerir recargar la página.
 */
@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterLink, NoticiaCardComponent],
  templateUrl: './favoritos.component.html',
  styleUrls: ['./favoritos.component.css']
})
export class FavoritosComponent implements OnInit {
  /** Lista de noticias favoritas actualmente cargadas. */
  noticiasFavoritas: Noticia[] = [];

  /** Estado de carga. */
  cargando: boolean = true;

  constructor(
    private noticiasService: NoticiasService,
    private favoritosService: FavoritosService
  ) {}

  ngOnInit(): void {
    this.cargarFavoritos();
  }

  /**
   * Carga las noticias y filtra exclusivamente aquellas que figuren en favoritos.
   */
  cargarFavoritos(): void {
    this.cargando = true;
    const ids = this.favoritosService.obtenerFavoritos();

    this.noticiasService.obtenerNoticias().subscribe({
      next: (todas) => {
        this.noticiasFavoritas = todas.filter(n => ids.includes(n.id));
        this.cargando = false;
      },
      error: () => {
        this.noticiasFavoritas = [];
        this.cargando = false;
      }
    });
  }

  /**
   * Manejador de alternancia de favorito emitido por NoticiaCardComponent.
   * Remueve la tarjeta del arreglo en memoria para actualización inmediata de la interfaz.
   * @param id ID de la noticia afectada.
   */
  onToggleFavorito(id: number): void {
    this.favoritosService.alternarFavorito(id);
    // Filtrar localmente para actualizar la vista de inmediato sin recargar
    this.noticiasFavoritas = this.noticiasFavoritas.filter(n => n.id !== id);
  }
}
