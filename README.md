# InfoTech News

Plataforma web de noticias de tecnología, ciencia e innovación, construida como
sitio estático con HTML, CSS y JavaScript. Las noticias se renderizan de forma
dinámica a partir de un archivo JSON local, y el navegador guarda los favoritos
y las noticias que el usuario crea o elimina. Corresponde a la Entrega 2 —
Prototipo funcional (Semana 5).

## Asignatura y equipo

- **Asignatura:** Desarrollo de Front-End
- **Institución:** Institución Universitaria Politécnico Grancolombiano
- **Subgrupo:** 23
- **Docente:** John Olarte

Integrantes:

- Juan David Osorio Zapata
- David Steven Pineda Bayona
- Brayan Steven Corredor Saenz
- Jorge Felipe Quintero Suarez
- David Mateo Parra Sanchez

## Tecnologías

- **HTML5** — marcado semántico, una página por vista.
- **CSS3** — hoja de estilos propia (`css/styles.css`) con la paleta, la
  tipografía y los estados de los componentes.
- **JavaScript vanilla** — sin framework, sin bundler y sin npm. Los scripts son
  clásicos (`<script defer src="...">`) y se cuelgan de un único espacio de
  nombres, `window.ITN`.
- **Tailwind CSS 3.4.17 por CDN** (`https://cdn.tailwindcss.com/3.4.17`) — aporta
  la maquetación y las utilidades. La versión está **fijada a propósito**: la URL
  sin versión redirige a la última publicada, de modo que el aspecto del sitio
  podría cambiar sin que nadie tocara el código.
- **Font Awesome 6.0.0 por CDN** — iconografía, con comprobación de integridad
  (`integrity` + `crossorigin`), que cdnjs permite porque envía cabeceras CORS.
  Tailwind no puede llevar `integrity`: su CDN no envía esas cabeceras y sin CORS
  el navegador no puede verificar el recurso, así que lo bloquearía por completo.
- **JSON local** — `data/news.json` es la semilla de noticias, de sólo lectura.
- **`localStorage`** — favoritos y capa de cambios del mini CRUD.

Angular llega en la **Entrega 3 (Semana 7)** y **no se usa** en este prototipo.

## Cómo ejecutar

El sitio lee `data/news.json` con `fetch`, así que necesita servirse por HTTP.
**Use exactamente este comando**, desde la raíz del proyecto:

```
python3 -m http.server 8000
```

Luego abra <http://localhost:8000> en el navegador.

### No use `npx serve` para este proyecto

`serve` trae activada por defecto la opción `cleanUrls`, que **reescribe las URL
con extensión y pierde la cadena de consulta**. Comprobado:

```
GET /detalle.html?id=4
HTTP/1.1 301 Moved Permanently
Location: /detalle          <- el ?id=4 desaparece
```

El resultado es que al pulsar «Ver más» en una tarjeta se llega a `/detalle` sin
identificador, y la vista de detalle muestra el aviso de que falta el parámetro
`?id=`. **No es un fallo del código**: los enlaces se generan correctamente como
`detalle.html?id=N` (véase `js/tarjetas.js`).

`python3 -m http.server` no reescribe nada, así que la navegación entre páginas
—y en particular el paso del catálogo al detalle— funciona tal cual.

Si necesita usar `serve` de todas formas, cree un `serve.json` en la raíz con:

```json
{
  "cleanUrls": false
}
```

Comprobado: con ese archivo, `/detalle.html?id=4` responde `200 OK` y conserva el
identificador.

**GitHub Pages no aplica esas reescrituras**, por lo que el sitio publicado
funciona sin ninguna configuración adicional.

### Advertencia: no abra el proyecto con doble clic

Si abre `index.html` directamente desde el disco (protocolo `file://`), el
navegador **bloquea el `fetch` por política CORS** (el origen es `null`) y las
noticias no se cargan. En ese caso la página no se queda vacía: muestra un
mensaje de error en español indicando que debe abrirse desde un servidor local o
desde el enlace publicado.

Es una **limitación conocida y documentada** de los sitios estáticos que leen
datos por `fetch`, no un fallo del proyecto. Con el servidor local levantado
todo funciona con normalidad.

## Estructura del proyecto

```
infotech-news/
├── index.html
├── noticias.html
├── detalle.html
├── favoritos.html
├── gestion.html
├── contacto.html
├── css/
│   └── styles.css
├── js/
│   ├── almacenamiento.js
│   ├── repositorio.js
│   ├── tarjetas.js
│   ├── layout.js
│   ├── validacion.js
│   ├── pagina-inicio.js
│   ├── pagina-catalogo.js
│   ├── pagina-detalle.js
│   ├── pagina-favoritos.js
│   ├── pagina-gestion.js
│   └── pagina-contacto.js
├── data/
│   └── news.json
├── img/
│   ├── noticia-01.jpg
│   └── ... hasta noticia-07.jpg
├── README.md
└── .gitignore
```

- **`css/`** — hoja de estilos propia. `styles.css` declara la paleta como
  variables CSS en `:root`, la tipografía, los estados de las tarjetas, los
  avisos y los estilos de foco visibles.
- **`js/`** — módulos de JavaScript, uno por responsabilidad.
- **`data/`** — `news.json`, la semilla de siete noticias. Es de sólo lectura en
  tiempo de ejecución: un cliente estático no puede escribir en el archivo que
  se le sirvió.
- **`img/`** — las siete fotografías de las noticias.

### Módulos de `js/`

| Archivo | Responsabilidad |
|---------|-----------------|
| `almacenamiento.js` | Única fachada sobre `localStorage`. Nadie más lo toca. Lee y escribe favoritos y la capa de altas/bajas, con `try`/`catch` y guardas de parseo. |
| `repositorio.js` | Único módulo que sabe de dónde vienen los datos. Hace el `fetch` de la semilla, normaliza cada registro al modelo de vista, aplica la capa del usuario y expone el mensaje de error visible. |
| `tarjetas.js` | Plantilla única de tarjeta de noticia, usada por inicio, catálogo, favoritos y gestión. |
| `layout.js` | Estado compartido del encabezado y el pie: marca el enlace activo según la página y actualiza el año del pie. |
| `validacion.js` | Mapa de validadores de formulario (obligatorio, correo, longitudes) y la función que devuelve los errores por campo. Lo consumen contacto y gestión. |
| `pagina-inicio.js` | Controlador de `index.html`: pide las destacadas y las entrega al módulo de tarjetas. |
| `pagina-catalogo.js` | Controlador de `noticias.html`: filtrado por categoría (píldoras derivadas de los datos y parámetro `?cat=`) y búsqueda por texto. |
| `pagina-detalle.js` | Controlador de `detalle.html`: lee `?id=`, pinta el artículo completo y gestiona el botón de favoritos. |
| `pagina-favoritos.js` | Controlador de `favoritos.html`: cruza los ids guardados con los datos, permite quitar y muestra el estado vacío. |
| `pagina-gestion.js` | Controlador de `gestion.html`: alta validada, baja con confirmación y restauración de los datos originales. |
| `pagina-contacto.js` | Controlador de `contacto.html`: valida el formulario y muestra los errores por campo y la confirmación. |

Los controladores sólo orquestan: no contienen reglas de negocio.

El `<header>` y el `<footer>` están duplicados **a propósito** en las seis
páginas, porque el proyecto no tiene paso de compilación. Inyectarlos con
JavaScript dejaría el código fuente con un contenedor vacío y haría que el menú
desapareciera si un script fallara. La única diferencia permitida entre páginas
es el enlace activo, que `layout.js` marca en tiempo de ejecución.

## Páginas

| Página | Qué hace |
|--------|----------|
| `index.html` | Home: bienvenida, tres noticias destacadas, llamados a la acción, sección informativa y pie con información general. |
| `noticias.html` | Catálogo completo con píldoras de filtro por categoría y buscador. Acepta `?cat=` en la URL para prefiltrar. |
| `detalle.html` | Detalle de una noticia (`?id=`): contenido completo, imagen, botón de favoritos y llamado a contacto. Si el id no existe, muestra un mensaje en español. |
| `favoritos.html` | Lista personalizada de las noticias marcadas como favoritas, con opción de quitarlas y estado vacío explícito. |
| `gestion.html` | Mini CRUD: crear noticias con el formulario validado, eliminarlas con confirmación y restaurar los datos originales. |
| `contacto.html` | Formulario de contacto con validaciones (campos obligatorios, correo válido) y mensaje de confirmación. |

El menú de navegación es el mismo en las seis páginas: Inicio · Noticias ·
Tecnología · Favoritos · Gestión · Contacto. «Tecnología» no es una página
aparte: enlaza a `noticias.html?cat=TECNOLOGÍA`.

## Almacenamiento local

Todo el estado del usuario vive en `localStorage`, bajo tres claves con el
prefijo `itn.` y ninguna más:

| Clave | Qué guarda |
|-------|------------|
| `itn.favoritos` | Arreglo con los ids de las noticias marcadas como favoritas. |
| `itn.noticias.creadas` | Arreglo con los registros de noticias creados desde la página de Gestión. |
| `itn.noticias.eliminadas` | Arreglo con los ids de la semilla que el usuario eliminó. |

La semilla nunca se modifica. La lista que se muestra es el resultado de
combinar las tres: **semilla − eliminadas + creadas**. Esa composición ocurre en
un único lugar, `js/repositorio.js`, de modo que ninguna vista necesita saber que
existe esa capa.

La página de Gestión incluye el botón **«Restaurar datos originales»**, que
limpia las tres claves y devuelve el sitio a las siete noticias de la semilla.
Es la salida prevista para quien elimine todas las noticias explorando el CRUD.

## Créditos de las imágenes

Las siete fotografías de `img/` proceden de **Unsplash** y están redimensionadas
a un ancho máximo de **1200 px** para que las páginas carguen sin conexión y sin
descargas pesadas.

El autor concreto de cada fotografía **está pendiente de verificar**. El crédito
de cada imagen se indica en el campo `creditoImagen` del registro
correspondiente en `data/news.json`, y allí es donde debe quedar el nombre del
fotógrafo una vez confirmado.

## Repositorio

<https://github.com/BrayanSaenz30/infotech-news>
