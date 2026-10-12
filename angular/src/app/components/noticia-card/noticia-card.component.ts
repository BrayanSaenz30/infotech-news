import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Noticia } from '../../models/noticia.model';

/**
 * NoticiaCardComponent — Tarjeta visual representativa de una noticia.
 *
 * Componente standalone reutilizable en catálogo y favoritos.
 * Implementa @Input() para recibir los datos de la noticia y el estado de favorito,
 * @Output() para emitir cambios al componente padre,
 * interpolación {{ }} para textos, property binding [ ] para atributos/imágenes y
 * event binding ( ) para la interacción con el botón de favoritos.
 */
@Component({
  selector: 'app-noticia-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './noticia-card.component.html',
  styleUrls: ['./noticia-card.component.css']
})
export class NoticiaCardComponent {
  /** Objeto de datos de la noticia a presentar. */
  @Input({ required: true }) noticia!: Noticia;

  /** Indica si la noticia actual se encuentra marcada como favorita. */
  @Input() esFavorito: boolean = false;

  /** Evento emitido cuando el usuario pulsa el botón de favoritos. */
  @Output() toggleFavorito = new EventEmitter<number>();

  /**
   * Resuelve la ruta relativa de la imagen anteponiendo '../' si no es una URL absoluta.
   * @param ruta Ruta de la imagen registrada en la noticia.
   * @returns Ruta adaptada para el contexto de la aplicación.
   */
  resolverImagen(ruta: string): string {
    if (!ruta) return '../img/noticia-01.jpg';
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    if (ruta.startsWith('../')) return ruta;
    return '../' + ruta;
  }

  /**
   * Manejador del evento de clic sobre el botón de favorito.
   * Detiene la propagación y emite el ID de la noticia al componente contenedor.
   */
  onToggleFavorito(evento: Event): void {
    evento.stopPropagation();
    this.toggleFavorito.emit(this.noticia.id);
  }
}
