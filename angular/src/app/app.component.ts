import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * AppComponent — Componente raíz de la aplicación híbrida Angular.
 *
 * Contiene el encabezado de navegación con RouterLink, RouterLinkActive
 * y el enlace de retorno hacia el sitio principal Vanilla HTML/JS ('../index.html').
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /** Título de la aplicación. */
  title = 'InfoTech News — Angular';

  /** Año actual para el pie de página. */
  anioActual = new Date().getFullYear();
}
