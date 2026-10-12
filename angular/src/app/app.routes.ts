import { Routes } from '@angular/router';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';
import { DetalleComponent } from './pages/detalle/detalle.component';
import { FavoritosComponent } from './pages/favoritos/favoritos.component';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'detalle/:id', component: DetalleComponent },
  { path: 'favoritos', component: FavoritosComponent },
  { path: '**', redirectTo: 'catalogo' }
];
