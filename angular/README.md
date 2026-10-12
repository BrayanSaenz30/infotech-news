# InfoTech News — Módulo Angular (Entrega 3, Semana 7)

Este subproyecto contiene la implementación básica en **Angular 19 Standalone Components** requerida para la Entrega 3 (Semana 7) del módulo de Front-End (Politécnico Grancolombiano, Subgrupo 23).

Complementa el prototipo funcional en Vanilla JS sin reemplazarlo: el sitio principal permanece intacto y la aplicación Angular se compila directamente en la subcarpeta `app/` de la raíz del repositorio, desplegándose de manera unificada en GitHub Pages.

---

## 1. Requisitos de Entorno y Compatibilidad de Node

- **Versión de Node.js probada:** Node.js v26.10.0 (compatible con compilación directa de Angular 19).
- **Versión LTS recomendada por Angular:** Se incluye un archivo `.nvmrc` fijado a `v20.18.0` (LTS activo).
- Para alternar rápidamente a la versión LTS recomendada sin afectar configuraciones globales:
  ```bash
  # Usando nvm:
  nvm use
  # o explícitamente:
  nvm use 20

  # Usando fnm:
  fnm use
  ```

---

## 2. Comandos de Compilación y Ejecución

Dentro de la carpeta `angular/`:

### 2.1 Ejecutar Pruebas Unitarias
Ejecuta la suite completa de pruebas unitarias headless (Karma + Jasmine + ChromeHeadless):
```bash
npm test
```
*Cobertura: Pruebas unitarias de `FavoritosService` (persistencia y robustez ante JSON corrupto), `NoticiasService` (composición pura de overlay de creadas/eliminadas) y `NoticiaCardComponent` (emisión de `@Output`).*

### 2.2 Compilar para GitHub Pages
Compila el módulo Angular generando los archivos directamente en la carpeta `/app` del repositorio con base href adaptada:
```bash
npm run build:pages
```

### 2.3 Desarrollo y Prueba Local (Dev Loop)
Dado que la aplicación Angular consume el archivo de datos original (`../data/news.json`) y las imágenes del sitio (`../img/`), se debe servir desde la raíz del repositorio:
1. En una terminal, mantenga el build en modo escucha (opcional):
   ```bash
   cd angular && npm run watch
   ```
2. En otra terminal, levante el servidor HTTP nativo desde la **raíz del proyecto**:
   ```bash
   python3 -m http.server 8000
   ```
3. Abra en su navegador:
   - Sitio Vanilla principal: `http://localhost:8000/`
   - Versión Angular: `http://localhost:8000/app/`

---

## 3. Inventario de Data Binding y Componentes

En cumplimiento estricto de la rúbrica oficial (*«Implementación básica en Angular: componentes y binding»*), cada mecanismo se encuentra implementado y visible en el código fuente:

| Tipo de Binding / Directiva | Archivo | Líneas relevantes | Propósito en la Interfaz |
| :--- | :--- | :--- | :--- |
| **Interpolación (`{{ }}`)** | `src/app/components/noticia-card/noticia-card.component.html` | L.11, L.18, L.24, L.29 | Muestra categoría, tiempo de lectura, título y resumen de la tarjeta. |
| **Interpolación (`{{ }}`)** | `src/app/pages/catalogo/catalogo.component.html` | L.67 | Renderiza el conteo dinámico de noticias filtradas y totales. |
| **Interpolación (`{{ }}`)** | `src/app/pages/detalle/detalle.component.html` | L.73, L.80 | Renderiza el titular del artículo y párrafos del contenido. |
| **Property Binding (`[ ]`)** | `src/app/components/noticia-card/noticia-card.component.html` | L.5-6, L.40 | Enlaza `[src]`, `[alt]` de la imagen y accesibilidad `[attr.aria-pressed]`. |
| **Property Binding (`[ ]`)** | `src/app/pages/catalogo/catalogo.component.html` | L.42, L.53, L.107 | Enlaza clases dinámicas `[class]` en píldoras y `[noticia]`, `[esFavorito]`. |
| **Event Binding (`( )`)** | `src/app/components/noticia-card/noticia-card.component.html` | L.39 | Captura el clic `(click)="onToggleFavorito($event)"` para alternar favorito. |
| **Event Binding (`( )`)** | `src/app/pages/catalogo/catalogo.component.html` | L.41, L.52, L.109 | Captura selección de píldoras `(click)` y evento de salida `(toggleFavorito)`. |
| **Two-way Binding (`[(ngModel)]`)** | `src/app/pages/catalogo/catalogo.component.html` | L.27 | Sincroniza bidireccionalmente el término del buscador en tiempo real. |
| **Control Flow (`@for`)** | `src/app/pages/catalogo/catalogo.component.html` | L.49, L.105 | Itera dinámicamente sobre categorías únicas y sobre las tarjetas de noticias. |
| **Control Flow (`@for`)** | `src/app/pages/detalle/detalle.component.html` | L.97 | Itera sobre cada párrafo del arreglo `noticia.contenido`. |
| **Control Flow (`@if`)** | `src/app/pages/catalogo/catalogo.component.html` | L.70, L.77, L.85, L.99 | Gestiona estados condicionales de carga, error y lista vacía. |
| **Control Flow (`@if`)** | `src/app/pages/detalle/detalle.component.html` | L.10, L.18, L.57 | Discrimina entre ID inválido, noticia inexistente (404) y éxito. |
| **Entrada (`@Input()`)** | `src/app/components/noticia-card/noticia-card.component.ts` | L.22, L.25 | Recibe el objeto `noticia: Noticia` y el estado booleano `esFavorito`. |
| **Salida (`@Output()`)** | `src/app/components/noticia-card/noticia-card.component.ts` | L.28 | Emite el evento `toggleFavorito = new EventEmitter<number>()` al padre. |

---

## 4. Arquitectura y Sincronización de Datos

1. **`NoticiasService`**: Consume `../data/news.json` y aplica sobre la semilla la misma lógica que `js/repositorio.js`: `(semilla - eliminadas) + creadas`. Si el usuario agrega o borra una noticia desde la vista `gestion.html` en Vanilla JS, el cambio se ve reflejado en Angular.
2. **`FavoritosService`**: Lee y escribe bajo la clave compartida `itn.favoritos` en `localStorage`. Cualquier favorito marcado en Angular se refleja en Vanilla JS y viceversa.
3. **Enrutamiento SPA con Hash (`withHashLocation`)**: Utiliza rutas con almohadilla (`#/catalogo`, `#/detalle/:id`, `#/favoritos`) para prevenir errores 404 en GitHub Pages sin requerir scripts adicionales de redirección.
