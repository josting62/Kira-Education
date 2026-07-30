# Classroom

Prototipo académico que simula las funciones principales de Google Classroom:
cursos, tablón de novedades, trabajo en clase, entregas, calificaciones,
notificaciones, calendario, perfil de usuario y administración, con módulos
visibles según el rol.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 (diseño atómico)
- **Backend:** Node + Express 5 + TypeScript (capas por responsabilidad)
- **Base de datos:** MySQL / MariaDB sobre XAMPP
- **Subida de imágenes:** multer (avatares y encabezados de clase)
- **Pruebas E2E:** Playwright
- **Tipografía:** Outfit (interfaz), Bricolage Grotesque (títulos), Google Sans Code (monoespaciada)
- **Color:** superficies neutras; el color vive en los iconos y en el acento rosa/marrón

### Documentación

| Documento | Contenido |
|---|---|
| [`docs/DOCUMENTACION.md`](docs/DOCUMENTACION.md) | Documento completo: propósito, características, análisis de requerimientos (89 RF + 25 RNF), reglas de negocio, casos de uso, alcance, objetivos, manual del sistema y manual de usuario por rol |
| `docs/Anexo-Capturas.pdf` | Anexo visual con 30 capturas del sistema, generado automáticamente con `npm run docs:capturas` |

Este README cubre la puesta en marcha y la referencia técnica rápida; el
documento de `docs/` es el que se entrega como documentación formal.

---

## 1. Puesta en marcha

### Requisitos
- Node.js 20 o superior
- XAMPP con **MySQL iniciado** (panel de XAMPP → *Start* en MySQL)

### Pasos

```bash
npm install
cp .env.example .env      # ajusta DB_PASSWORD si tu root tiene contraseña
npm run db:setup          # crea classroom_db y carga datos de prueba
npm run dev               # API en :4000 y frontend en :5173
```

Abre <http://localhost:5173>.

### Cuentas de prueba

Todas usan la contraseña `123456`:

| Correo | Rol | Qué ve |
|---|---|---|
| `admin@classroom.test` | Administrador | Todos los cursos + módulo de administración |
| `gersson@classroom.test` | Docente | Crear clases, publicar trabajo, calificar |
| `carlos@classroom.test` | Docente | Sus propias clases |
| `jostin@classroom.test` | Estudiante | Pendientes, entregar trabajo |
| `laura@classroom.test` | Estudiante | Una entrega ya calificada |
| `rosa@classroom.test` | Acudiente | Solo consulta |

---

## 2. Base de datos

Los scripts SQL están en:

| Archivo | Qué hace |
|---|---|
| `backend/src/database/migrations/001_schema.sql` | Crea `classroom_db`, 12 tablas y 2 vistas |
| `backend/src/database/seeds/002_seed.sql` | Carga usuarios, cursos, tareas y entregas de prueba |
| `backend/src/database/migrations/003_customization.sql` | Solo si **ya tienes datos**: añade personalización, perfil y ajustes sin borrar nada (idempotente) |

> `003` usa `DELIMITER`, que es una directiva del cliente MySQL. Ejecútalo en
> **MySQL Workbench** o con `mysql -u root < 003_customization.sql`, no con
> `npm run db:setup`. Si puedes reiniciar la base, `npm run db:reset` ya lo incluye todo.

Hay dos formas de ejecutarlos:

**A. Desde la terminal** (es lo que hace `npm run db:setup`):

```bash
npm run db:setup     # ejecuta schema + seed
npm run db:reset     # lo mismo; el schema hace DROP DATABASE primero
```

**B. Desde MySQL Workbench:** abre cada archivo y ejecútalo completo
(`Ctrl+Shift+Enter`), primero el schema y luego el seed.

### Modelo de datos

```
roles ──< users ──< enrollments >── courses
                                       │
                          topics ──< coursework >── attachments
                                       │
                                  submissions
```

| Tabla | Para qué |
|---|---|
| `roles` | admin, teacher, student, guardian |
| `users` | cuentas con hash bcrypt |
| `courses` | clase, con `class_code`, `theme_color` y `banner_kind`/`banner_url` (color, galería o imagen subida) |
| `enrollments` | quién pertenece a qué curso y con qué rol **dentro** del curso |
| `topics` | unidades del "Trabajo en clase" |
| `coursework` | tarea / material / pregunta / cuestionario, en borrador o publicado |
| `submissions` | entrega por alumno: estado, nota, nota en borrador, retraso |
| `announcements` | publicaciones del tablón |
| `attachments` | adjuntos polimórficos (tarea, entrega o anuncio) |
| `comments` | comentarios de clase o privados |
| `notifications` | avisos por usuario, con contador de no leídos |
| `user_settings` | preferencias por usuario: densidad, idioma, notificaciones, ver archivadas |

**Vistas de apoyo**

- `v_gradebook` — matriz alumno × tarea; alimenta la pestaña Calificaciones.
- `v_pending_work` — trabajo sin entregar por alumno; alimenta "Pronto se entregará".

---

## 3. Estructura de carpetas

```
classroom-react/
├─ frontend/                        # Diseño atómico
│  ├─ index.html
│  ├─ public/favicon.svg
│  └─ src/
│     ├─ assets/
│     │  ├─ icons/index.ts          # registro central de iconos (Lucide)
│     │  ├─ images/
│     │  └─ logos/
│     ├─ components/
│     │  ├─ atoms/                  # Button, IconButton, Input, Avatar, Badge, Card, Spinner
│     │  ├─ molecules/              # CourseCard, StreamItem, EmptyState
│     │  ├─ organisms/              # TopBar, SideNav, Dialog, *Dialog
│     │  └─ templates/              # AppShell, AuthLayout
│     ├─ pages/                     # una vista por archivo
│     │  └─ course/                 # pestañas: Stream, Classwork, People, Grades
│     ├─ context/AuthContext.tsx
│     ├─ hooks/                     # useAuth, useFetch, useCourseContext
│     ├─ services/                  # cliente HTTP + un archivo por dominio
│     ├─ router/                    # AppRouter, ProtectedRoute
│     ├─ styles/theme.css           # paleta y tokens de Tailwind
│     ├─ types/models.ts
│     └─ main.tsx
│
├─ backend/src/                     # Jerarquía por función y responsabilidad
│  ├─ config/env.ts                 # variables de entorno validadas
│  ├─ database/
│  │  ├─ connection.ts              # pool + helpers query/execute/transaction
│  │  ├─ migrations/001_schema.sql
│  │  └─ seeds/002_seed.sql
│  ├─ routes/                       # define URLs y middlewares
│  ├─ controllers/                  # leen la petición, devuelven la respuesta
│  ├─ services/                     # reglas de negocio y permisos
│  ├─ repositories/                 # los únicos que escriben SQL
│  ├─ middlewares/                  # authenticate, authorize, validate, errorHandler
│  ├─ validators/schemas.ts         # esquemas Zod
│  ├─ utils/                        # HttpError, token, asyncHandler, classCode
│  ├─ types/models.ts
│  ├─ app.ts
│  └─ server.ts
│
├─ scripts/db-setup.mjs
├─ tests/e2e/smoke.spec.ts
├─ playwright.config.ts
├─ vite.config.ts
├─ tsconfig.frontend.json  ·  tsconfig.backend.json
└─ .env  ·  .env.example
```

El flujo de una petición en el backend es siempre el mismo:

```
routes → middlewares (auth/validate) → controller → service → repository → MySQL
```

Solo los **repositories** escriben SQL, y solo los **services** deciden permisos.

---

## 4. Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | API y frontend juntos, con recarga en caliente |
| `npm run dev:api` | Solo la API (`tsx watch`) |
| `npm run dev:web` | Solo el frontend (Vite) |
| `npm run db:setup` | Crea la base de datos y carga los datos de prueba |
| `npm run db:reset` | Reinicia la base de datos desde cero |
| `npm run typecheck` | TypeScript sobre frontend y backend |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (levanta API y frontend por su cuenta) |
| `npm run test:e2e:ui` | Playwright en modo interactivo |
| `npm run build` | Compila el frontend a `dist/` |
| `npm run docs:capturas` | Fotografía el sistema rol por rol y arma `docs/Anexo-Capturas.pdf` (requiere `npm run dev` en otra terminal) |

---

## 5. API

Todas las rutas van bajo `/api`. La sesión viaja en una cookie `httpOnly`
(también se acepta `Authorization: Bearer <token>`).

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Crear cuenta (rol: student, teacher o guardian) |
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/logout` | Cerrar sesión |
| `GET` | `/auth/me` | Usuario de la sesión actual |

### Cursos
| Método | Ruta | Quién |
|---|---|---|
| `GET` | `/courses?status=active` | Cualquiera (ve solo los suyos; admin ve todos) |
| `POST` | `/courses` | Docente o admin |
| `POST` | `/courses/join` | Cualquiera, con `class_code` |
| `GET` | `/courses/:id` | Integrantes del curso |
| `PATCH` | `/courses/:id` | Docente del curso |
| `POST` | `/courses/:id/copy` | Duplica la clase con su trabajo en borrador, sin alumnos |
| `PATCH` | `/courses/:id/banner` | Color o imagen de galería del encabezado |
| `POST` | `/courses/:id/banner/upload` | Sube una imagen y la aplica como encabezado (multipart) |
| `PATCH` | `/courses/:id/status` | Archivar o restaurar |
| `DELETE` | `/courses/:id` | Propietario o admin |
| `POST` | `/courses/:id/leave` | Anular la propia inscripcion (el propietario no puede) |
| `GET` | `/courses/:id/stream` | Tablón: anuncios + trabajo publicado |
| `POST` | `/courses/:id/announcements` | Docente del curso |
| `GET` | `/courses/:id/members` | Integrantes del curso |
| `DELETE` | `/courses/:id/members/:memberId` | Docente del curso |
| `GET` | `/courses/:id/gradebook` | Docente del curso |

### Trabajo en clase
| Método | Ruta | Quién |
|---|---|---|
| `GET` | `/courses/:courseId/coursework` | Integrantes (el alumno no ve borradores) |
| `POST` | `/courses/:courseId/coursework` | Docente del curso |
| `POST` | `/courses/:courseId/topics` | Docente del curso |
| `GET` | `/coursework/pending` | Pendientes del alumno autenticado |
| `GET` | `/coursework/to-review` | Entregas sin calificar de los ultimos 7 dias (docente) |
| `GET` | `/coursework/:id` | Respuesta distinta según rol |
| `PATCH` / `DELETE` | `/coursework/:id` | Docente del curso |
| `POST` | `/coursework/:id/publish` | Publica un borrador |

### Adjuntos
| Método | Ruta | Quién |
|---|---|---|
| `GET` | `/coursework/:id/attachments` | Integrantes del curso |
| `POST` | `/coursework/:id/attachments` | Docente: adjunto por enlace (link, Drive, YouTube) |
| `POST` | `/coursework/:id/attachments/upload` | Docente: sube un documento (multipart, campo `file`) |
| `DELETE` | `/coursework/:id/attachments/:attachmentId` | Docente del curso |
| `POST` | `/coursework/:id/submission/files` | Alumno: adjunta un archivo a **su** entrega |
| `DELETE` | `/coursework/:id/submission/files/:attachmentId` | Alumno, si aún no está calificada |

### Entregas y calificación
| Método | Ruta | Quién |
|---|---|---|
| `POST` | `/coursework/:id/turn-in` | Alumno (marca el retraso solo) |
| `POST` | `/coursework/:id/reclaim` | Alumno, si aún no fue calificado |
| `POST` | `/coursework/:id/draft-grade` | Docente: nota en borrador |
| `POST` | `/coursework/:id/return-grade` | Docente: publica la nota y notifica |

### Comentarios, notificaciones y calendario
| Método | Ruta |
|---|---|
| `GET` | `/comments/:targetType/:targetId` |
| `POST` | `/comments` |
| `GET` | `/notifications` |
| `PATCH` | `/notifications/:id/read` |
| `PATCH` | `/notifications/read-all` |
| `GET` | `/calendar?year=&month=` |

### Perfil y ajustes
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/users/me` | Perfil propio |
| `PATCH` | `/users/me` | Nombre, apellido, teléfono, "sobre mí" |
| `POST` | `/users/me/password` | Cambiar contraseña (pide la actual) |
| `POST` | `/users/me/avatar` | Subir foto de perfil (multipart) |
| `DELETE` | `/users/me/avatar` | Volver a las iniciales |
| `GET` / `PATCH` | `/users/me/settings` | Densidad, idioma, notificaciones, ver archivadas |

### Administración (solo rol `admin`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/admin/overview` | Métricas del sistema y catálogo de roles |
| `GET` | `/admin/users?search=` | Lista y busca usuarios |
| `POST` | `/admin/users` | Crea usuario con cualquier rol |
| `PATCH` | `/admin/users/:id/role` | Cambia el rol (no el propio) |
| `PATCH` | `/admin/users/:id/status` | Activa o desactiva (no la propia) |
| `POST` | `/admin/users/:id/password` | Restablece la contraseña |
| `GET` | `/admin/courses?status=` | Todas las clases del sistema |

Todas las respuestas usan el mismo sobre:

```json
{ "ok": true,  "data": {} }
{ "ok": false, "message": "Datos invalidos", "details": [] }
```

---

## 6. Roles y qué ve cada uno

| Módulo | Admin | Docente | Estudiante | Acudiente |
|---|:-:|:-:|:-:|:-:|
| Inicio con sus clases | ✓ | ✓ | ✓ | ✓ |
| Calendario | ✓ | ✓ | ✓ | ✓ |
| Notificaciones | ✓ | ✓ | ✓ | ✓ |
| Mi perfil y Ajustes | ✓ | ✓ | ✓ | ✓ |
| Crear clase / Añadir clase | ✓ | ✓ | | |
| Unirse con código o enlace | ✓ | ✓ | ✓ | ✓ |
| Publicar anuncios y trabajo | ✓ | ✓ | | |
| Pestaña Calificaciones del curso | ✓ | ✓ | | |
| Personalizar / Copiar / Archivar clase | ✓ | ✓ | | |
| Anular su inscripción | | | ✓ | ✓ |
| Entregar / retirar trabajo | | | ✓ | |
| Lista de Pendientes | ✓ | | ✓ | |
| Pendientes de revisión | ✓ | ✓ | | |
| Administración | ✓ | | | |

### Menú de opciones de una clase

El menú de tres puntos de cada card (y el engranaje dentro del curso) se arma
según el rol, en [`useCourseActions`](frontend/src/hooks/useCourseActions.tsx):

| Opción | Qué hace | Quién la ve |
|---|---|---|
| Copiar enlace de invitación | Copia `/join/<codigo>` al portapapeles | Todos |
| Personalizar | Abre el diálogo de apariencia y datos de la clase | Docente / admin |
| Copiar | Duplica la clase: temas y trabajo en **borrador**, sin alumnos ni entregas | Docente / admin |
| Archivar | Mueve la clase a *Clases archivadas* | Docente / admin |
| Restaurar | Devuelve la clase a activa | Docente / admin (archivada) |
| Eliminar | Borra la clase y todo su contenido | Propietario / admin (archivada) |
| Anular inscripción | El alumno sale de la clase | Estudiante / acudiente |

El backend valida los permisos en la capa de servicios; el frontend solo
oculta lo que no aplica.

---

## 7. Personalización de la clase

Diálogo **Personalizar** ([`CustomizeCourseDialog`](frontend/src/components/organisms/CustomizeCourseDialog.tsx)),
con dos pestañas:

- **Apariencia** — 8 colores de tema, selector de color libre, galería de 6
  encabezados y subida de una imagen propia. Cada elección **se guarda en la
  base de datos al instante** y el banner de la página cambia sin recargar:
  el diálogo devuelve el curso actualizado y la página se repinta con él.
  La imagen que subes se previsualiza con `URL.createObjectURL` antes de
  terminar de subir, así no hay parpadeo.
- **Datos de la clase** — nombre, sección, materia, sala y descripción.

Todo pasa por un único componente, [`CourseBanner`](frontend/src/components/atoms/CourseBanner.tsx),
que decide cómo se pinta el encabezado (color plano, galería o imagen subida).
Lo usan la card del inicio, la página del curso y la vista previa del diálogo,
así los tres siempre coinciden.

Las imágenes subidas van a `uploads/` y se sirven en `/api/uploads/...`
(bajo `/api` para que el proxy de Vite las alcance sin configuración extra).
Límite: 4 MB, solo PNG, JPG, WEBP o SVG.

---

## 8. Documentos en las tareas

Dos flujos de adjuntos, ambos sobre la tabla `attachments`:

| Quién | Dónde | Qué puede adjuntar |
|---|---|---|
| **Docente** | Al crear la tarea y en su detalle | Documentos y enlaces (se detecta YouTube por la URL) |
| **Estudiante** | En "Tu trabajo", antes de entregar | Documentos de su entrega |

- El docente puede quitar cualquier adjunto de la tarea; el alumno solo los
  suyos, y **solo mientras la entrega no esté calificada**.
- Al crear una tarea los archivos se acumulan en el diálogo y se suben cuando
  la tarea ya tiene id, para no dejar archivos huérfanos si se cancela.
- Los formatos son PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, PNG, JPG y
  WEBP; máximo **15 MB** por archivo. La lista vive en dos sitios que deben
  coincidir: `DOCUMENT_TYPES` (backend) y `DOCUMENT_ACCEPT` (frontend).
- En disco el nombre es aleatorio y el nombre original se guarda en
  `attachments.title`, así no hay colisiones ni rutas manipulables. Al borrar
  el adjunto se borra también el archivo.
- Los archivos se sirven con `X-Content-Type-Options: nosniff` y
  `Content-Security-Policy: default-src 'none'; sandbox`, para que un SVG o
  HTML subido no pueda ejecutar scripts.

---

## 9. Estados vacíos

Las pantallas sin contenido usan las ilustraciones de
`frontend/src/assets/images`, servidas por
[`Illustration`](frontend/src/components/atoms/Illustration.tsx) y elegidas con
la prop `illustration` de `EmptyState`:

| Escena | Imagen | Dónde aparece |
|---|---|---|
| `classwork` | `wolf.jpeg` | Trabajo de clase sin tareas, inicio sin clases |
| `stream` | `squiller.jpeg` | Tablón vacío |
| `done` | `fish.jpeg` | Pendientes al día, nada que revisar |
| `notifications` | `fish.jpeg` | Sin notificaciones |
| `grades` | `cat.jpeg` | Libreta sin nada que calificar |
| `archive` | `cat.jpeg` | Sin clases archivadas |
| `notFound` | `squiller.jpeg` | Página no encontrada |

Las imágenes tienen fondo blanco, así que se pintan con `mix-blend-multiply`:
de esa forma se integran igual sobre una card blanca que sobre el fondo gris de
la aplicación, sin recuadro visible. Para cambiar una ilustración basta con
sustituir el archivo o editar el mapa `SCENES` de `Illustration.tsx`.

---

## 10. Diseño

La paleta, la tipografía y los tokens viven en un solo archivo:
`frontend/src/styles/theme.css`.

| Token | Valor | Uso |
|---|---|---|
| `canvas` | `#f6f7f8` | Fondo de la aplicación |
| `surface` | `#ffffff` | Tarjetas y barras |
| `line` | `#e4e7ea` | Bordes |
| `ink` | `#1f2328` | Texto principal |
| `ink-soft` / `ink-muted` | `#4a5159` / `#79818b` | Texto secundario |
| `accent-500` | `#8c5f6e` | Acento: botones, estado activo |
| `icon-indigo` … `icon-rose` | 6 tonos | **El color de los iconos** |

La interfaz es neutra a propósito: el color aparece en los iconos (cada tipo de
trabajo tiene el suyo), en los avatares y en el acento de marca. Los tonos
rosa/marrón siguen siendo la identidad, pero como acento y no como fondo.

| Fuente | Dónde |
|---|---|
| **Outfit** | Toda la interfaz |
| **Bricolage Grotesque** | Marca y títulos (`.font-display`) |
| **Google Sans Code** | Código de clase y datos monoespaciados |

Los iconos se importan **siempre** desde `@/assets/icons`, nunca desde
`react-icons` directamente, para poder cambiar el set completo en un solo lugar.

---

### Si ves `ERR_CONNECTION_REFUSED` en la consola

El frontend llama a `/api/...` en relativo y **Vite hace proxy** hacia el
backend (`vite.config.ts`). Ese error significa que la API no está arriba:

1. Inicia **MySQL** en el panel de XAMPP.
2. Ejecuta `npm run dev` (no solo `npm run dev:web`, que levanta únicamente el frontend).

La app muestra un aviso rojo fijo mientras la API no responde, y lo quita sola
en cuanto vuelve — sin recargar la página. Si el puerto 5173 aparece ocupado,
Vite usa el 5174: cierra el proceso anterior o abre el puerto que indique la consola.

---

## 11. Pendiente para la siguiente iteración

- Cuestionarios reales con preguntas, opciones y autocalificación.
- Rúbricas de evaluación por criterios y niveles.
- Periodos académicos y promedio ponderado.
- Invitar por correo electrónico y recuperar la contraseña (requiere SMTP).
- Buscador global desde la barra superior.
- Traducción real de la interfaz (la preferencia de idioma ya se guarda).
- Paginación de los listados, registro de auditoría y borrado lógico.
- Pruebas unitarias con Vitest, además de las 38 E2E que ya existen.

El detalle de lo que está dentro y fuera del alcance, con su justificación, está
en [`docs/DOCUMENTACION.md`](docs/DOCUMENTACION.md) §4.
