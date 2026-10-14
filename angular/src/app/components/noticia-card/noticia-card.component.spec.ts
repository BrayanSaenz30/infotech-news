import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoticiaCardComponent } from './noticia-card.component';
import { Noticia } from '../../models/noticia.model';

describe('NoticiaCardComponent', () => {
  let component: NoticiaCardComponent;
  let fixture: ComponentFixture<NoticiaCardComponent>;

  const noticiaPrueba: Noticia = {
    id: 10,
    titulo: 'Título de Prueba',
    categoria: 'TECNOLOGÍA',
    resumen: 'Resumen descriptivo',
    contenido: ['Párrafo 1'],
    tiempo: '3 min',
    destacado: false,
    imagen: 'img/noticia-01.jpg',
    creditoImagen: 'Fotógrafo'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoticiaCardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(NoticiaCardComponent);
    component = fixture.componentInstance;
    component.noticia = noticiaPrueba;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe emitir el ID de la noticia a través del @Output toggleFavorito al hacer clic', () => {
    spyOn(component.toggleFavorito, 'emit');

    const boton = fixture.nativeElement.querySelector('button');
    expect(boton).toBeTruthy();

    boton.click();
    expect(component.toggleFavorito.emit).toHaveBeenCalledWith(10);
  });
});
