import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NoticiasService, aplicarOverlay, normalizarNoticia } from './noticias.service';
import { Noticia } from '../models/noticia.model';

describe('NoticiasService y lógica de Overlay', () => {
  let service: NoticiasService;
  let httpTesting: HttpTestingController;

  const noticiaBase1: Noticia = normalizarNoticia({
    id: 1,
    titulo: 'Noticia Semilla 1',
    categoria: 'TECNOLOGÍA',
    resumen: 'Resumen 1'
  });

  const noticiaBase2: Noticia = normalizarNoticia({
    id: 2,
    titulo: 'Noticia Semilla 2',
    categoria: 'CIENCIA',
    resumen: 'Resumen 2'
  });

  const noticiaCreada: Noticia = normalizarNoticia({
    id: 99,
    titulo: 'Noticia Nueva Usuario',
    categoria: 'EDUCACIÓN',
    resumen: 'Resumen Creado',
    creada: true
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        NoticiasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(NoticiasService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('Función pura aplicarOverlay', () => {
    it('debe eliminar elementos según lista de eliminadas y añadir creadas', () => {
      const semilla = [noticiaBase1, noticiaBase2];
      const eliminadas = [1];
      const creadas = [noticiaCreada];

      const resultado = aplicarOverlay(semilla, eliminadas, creadas);

      expect(resultado.length).toBe(2);
      expect(resultado.find(n => n.id === 1)).toBeUndefined();
      expect(resultado.find(n => n.id === 2)).toBeDefined();
      expect(resultado.find(n => n.id === 99)).toBeDefined();
    });
  });

  describe('NoticiasService integration con localStorage', () => {
    it('debe cargar datos del json y aplicar overlay de creadas y eliminadas', (done) => {
      // Simular elementos eliminados y creados en localStorage
      localStorage.setItem('itn.noticias.eliminadas', JSON.stringify([1]));
      localStorage.setItem('itn.noticias.creadas', JSON.stringify([{ id: 99, titulo: 'Creada' }]));

      service.obtenerNoticias().subscribe(noticias => {
        expect(noticias.length).toBe(2); // noticia 2 + noticia 99
        expect(noticias.some(n => n.id === 1)).toBeFalse();
        expect(noticias.some(n => n.id === 2)).toBeTrue();
        expect(noticias.some(n => n.id === 99)).toBeTrue();
        done();
      });

      const req = httpTesting.expectOne('../data/news.json');
      expect(req.request.method).toBe('GET');
      req.flush([noticiaBase1, noticiaBase2]);
    });

    it('debe manejar JSON corrupto en localStorage sin fallar', (done) => {
      localStorage.setItem('itn.noticias.eliminadas', 'invalido-json');
      localStorage.setItem('itn.noticias.creadas', 'invalido-json');

      service.obtenerNoticias().subscribe(noticias => {
        expect(noticias.length).toBe(2);
        done();
      });

      const req = httpTesting.expectOne('../data/news.json');
      req.flush([noticiaBase1, noticiaBase2]);
    });
  });
});
