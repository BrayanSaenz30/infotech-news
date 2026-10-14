import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NoticiasService } from '../../services/noticias.service';
import { FavoritosService } from '../../services/favoritos.service';
import { Noticia } from '../../models/noticia.model';

/**
 * DetalleComponent — Vista detallada de una noticia seleccionada.
 *
 * Características:
 * - Lee y valida el parámetro de ruta ':id'.
 * - Distingue con precisión entre "ID no numérico", "noticia no encontrada" y "fallo de carga".
 * - Incluye botón para alternar favorito sincronizado con FavoritosService.
 * - Renderizado completo del cuerpo del artículo mediante @for.
 */
@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.css']
})
export class DetalleComponent implements OnInit {
  /** Objeto de la noticia si fue localizada. */
  noticia?: Noticia;

  /** Estado de carga en curso. */
  cargando: boolean = true;

  /** Estado de error: 'invalido' (no numérico), 'no_encontrada' (404), 'fallo_carga' o null. */
  tipoError: 'invalido' | 'no_encontrada' | 'fallo_carga' | null = null;

  /** Parámetro crudo recibido en la URL. */
  parametroIdCrudo: string = '';

  constructor(
    private route: ActivatedRoute,
    private noticiasService: NoticiasService,
    private favoritosService: FavoritosService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.parametroIdCrudo = params.get('id') || '';
      this.cargarNoticia(this.parametroIdCrudo);
    });
  }

  /**
   * Carga y evalúa la noticia correspondiente al ID recibido.
   * @param idCrudo Cadena con el ID desde la ruta.
   */
  cargarNoticia(idCrudo: string): void {
    this.cargando = true;
    this.tipoError = null;

    if (!idCrudo || !/^\d+$/.test(idCrudo)) {
      this.tipoError = 'invalido';
      this.cargando = false;
      return;
    }

    const idNumerico = Number(idCrudo);

    this.noticiasService.obtenerPorId(idNumerico).subscribe({
      next: (resultado) => {
        if (!resultado) {
          this.tipoError = 'no_encontrada';
        } else {
          this.noticia = resultado;
        }
        this.cargando = false;
      },
      error: () => {
        this.tipoError = 'fallo_carga';
        this.cargando = false;
      }
    });
  }

  /**
   * Indica si la noticia actual está marcada como favorita.
   */
  get esFavorito(): boolean {
    return this.noticia ? this.favoritosService.esFavorito(this.noticia.id) : false;
  }

  /**
   * Alterna el estado de favorito de la noticia actual.
   */
  toggleFavorito(): void {
    if (this.noticia) {
      this.favoritosService.alternarFavorito(this.noticia.id);
    }
  }

  /**
   * Resuelve la ruta relativa de la imagen anteponiendo '../' si aplica.
   * @param ruta Ruta de la imagen.
   */
  resolverImagen(ruta?: string): string {
    if (!ruta) return '../img/noticia-01.jpg';
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    if (ruta.startsWith('../')) return ruta;
    return '../' + ruta;
  }
}
