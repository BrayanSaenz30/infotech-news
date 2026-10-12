import { TestBed } from '@angular/core/testing';
import { FavoritosService } from './favoritos.service';

describe('FavoritosService', () => {
  let service: FavoritosService;
  const CLAVE_FAVORITOS = 'itn.favoritos';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritosService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe alternar y persistir favoritos en la clave compartida itn.favoritos', () => {
    expect(service.obtenerFavoritos()).toEqual([]);
    
    // Agregar favorito 1
    const agregado = service.alternarFavorito(1);
    expect(agregado).toBeTrue();
    expect(service.esFavorito(1)).toBeTrue();
    expect(JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)!)).toEqual([1]);

    // Agregar favorito 2
    service.alternarFavorito(2);
    expect(service.obtenerFavoritos()).toEqual([1, 2]);

    // Quitar favorito 1
    const removido = service.alternarFavorito(1);
    expect(removido).toBeFalse();
    expect(service.esFavorito(1)).toBeFalse();
    expect(service.obtenerFavoritos()).toEqual([2]);
  });

  it('debe manejar contenido corrupto o inválido en localStorage sin lanzar error', () => {
    localStorage.setItem(CLAVE_FAVORITOS, '{invalid_json');
    expect(service.obtenerFavoritos()).toEqual([]);
    expect(service.esFavorito(1)).toBeFalse();

    localStorage.setItem(CLAVE_FAVORITOS, '{"noEsArreglo": true}');
    expect(service.obtenerFavoritos()).toEqual([]);
  });
});
