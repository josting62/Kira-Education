# Kiro Education — Documentación del sistema

Prototipo académico que simula las funciones principales de Google Classroom,
con módulos visibles según el rol del usuario.

| Dato | Valor |
|---|---|
| Nombre del sistema | **Kiro Education** |
| Repositorio / carpeta | `classroom-react` |
| Versión documentada | Prototipo funcional — 29 de julio de 2026 |
| Tipo de aplicación | Web (SPA) cliente–servidor, monorepo de un solo `package.json` |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 (diseño atómico) |
| Backend | Node.js + Express 5 + TypeScript (capas por responsabilidad) |
| Base de datos | MySQL / MariaDB sobre XAMPP — `classroom_db` |
| Pruebas | Playwright (38 pruebas E2E) |
| Idioma de la interfaz | Español |

---

## Índice

1. [Propósito del sistema](#1-propósito-del-sistema)
2. [Características](#2-características)
3. [Análisis de requerimientos](#3-análisis-de-requerimientos)
4. [Alcance](#4-alcance)
5. [Objetivos](#5-objetivos)
6. [Manual del sistema](#6-manual-del-sistema)
7. [Manual de usuario](#7-manual-de-usuario)
8. [Anexos](#8-anexos)

---

# 1. Propósito del sistema

## 1.1 Planteamiento

En un aula que trabaja con material digital, la comunicación entre docente y
estudiantes suele repartirse entre varios medios: el correo para enviar la guía,
un grupo de mensajería para avisar del plazo, una carpeta compartida para
recibir los trabajos y una hoja de cálculo aparte para las notas. Al estar la
información dispersa, aparecen tres problemas concretos:

1. **No hay una única fuente de verdad.** El estudiante no puede responder con
   certeza «qué tengo pendiente y para cuándo».
2. **La entrega no queda registrada.** No existe una marca de tiempo confiable
   que distinga una entrega puntual de una tardía.
3. **La retroalimentación se pierde.** La nota y el comentario del docente
   viajan por un canal distinto al del trabajo que los originó.

## 1.2 Propósito

**Kiro Education centraliza el ciclo completo de una actividad académica
—publicación, entrega, calificación y retroalimentación— en un solo sistema
donde cada usuario ve únicamente lo que su rol le permite.**

El sistema es el registro único de la actividad de la clase: la publicación
queda fechada, la entrega queda marcada con su hora exacta y su condición de
puntual o tardía, la calificación queda ligada a la entrega que la produjo, y
el intercambio de mensajes ocurre junto al trabajo del que se habla.

## 1.3 Naturaleza del proyecto y alcance de la simulación

Este es un **prototipo académico con fines de demostración y aprendizaje**. No
es un producto en producción ni un reemplazo de Google Classroom. Su valor está
en demostrar, sobre un caso de uso realista y conocido, el dominio de:

- modelado relacional normalizado con integridad referencial,
- una API REST con autenticación y autorización por roles,
- una interfaz de componentes reutilizables,
- y una batería de pruebas automatizadas que respalda lo anterior.

La palabra «simula» debe entenderse con precisión: el sistema **reproduce el
comportamiento** de los flujos de Classroom (los estados de una entrega, la
visibilidad de una nota en borrador, el código para unirse a una clase) sobre
**su propia base de datos y su propio backend**. No se conecta con Google, no
usa sus APIs y no importa ni exporta datos de cuentas reales de Google.

## 1.4 Justificación de las decisiones técnicas

| Decisión | Justificación |
|---|---|
| MySQL sobre XAMPP | Requisito del proyecto: la base debe poder inspeccionarse y administrarse desde MySQL Workbench, herramienta habitual en el entorno académico. |
| Separación en capas estrictas | Solo los *repositories* escriben SQL y solo los *services* deciden permisos. Hace auditable dónde vive cada responsabilidad. |
| Diseño atómico en el frontend | Requisito del proyecto. Evita la duplicación de estilos: un cambio en `Button` se propaga a toda la aplicación. |
| JWT en cookie `httpOnly` | El token no es accesible desde JavaScript, lo que neutraliza el robo de sesión por XSS. |
| Playwright | Verifica el sistema completo (navegador → API → MySQL), no piezas aisladas. Es la única forma de comprobar reglas como «el alumno no ve la nota en borrador». |

---

# 2. Características

## 2.1 Cuadro general

| Módulo | Qué resuelve | Roles con acceso |
|---|---|---|
| Autenticación | Registro, inicio y cierre de sesión; sesión persistente 7 días | Todos |
| Clases | Crear, personalizar, archivar, eliminar, copiar; unirse por código o enlace | Docente / Admin (crear) · Todos (unirse) |
| Tablón de novedades | Anuncios de la clase en orden cronológico, con comentarios | Todos los de la clase |
| Trabajo en clase | Tareas, material, preguntas y cuestionarios, organizados en temas | Docente (crear) · Estudiante (consultar/entregar) |
| Entregas | Entregar, retirar, adjuntar archivos, responder por escrito | Estudiante |
| Calificaciones | Nota en borrador, devolución individual o en lote, libreta, exportar CSV | Docente (calificar) · Estudiante (consultar la propia) |
| Comentarios | De clase (visibles a todos) y privados (alumno ↔ docente) | Según visibilidad |
| Notificaciones | Aviso por trabajo nuevo, anuncio, nota y comentario; contador de no leídos | Todos |
| Calendario | Vista mensual de las fechas de entrega | Todos |
| Pendientes | «Qué debo entregar» (estudiante) / «Qué debo revisar» (docente) | Estudiante · Docente |
| Perfil | Foto, biografía, teléfono, cambio de contraseña | Todos |
| Ajustes | Tema claro/oscuro/sistema, densidad, idioma, notificaciones | Todos |
| Administración | Crear usuarios, cambiar rol, activar/desactivar, restablecer contraseña, métricas | Admin |
| Seguimiento | Consulta de solo lectura del progreso de un estudiante vinculado | Acudiente |

## 2.2 Características funcionales destacadas

**Nota en borrador.** El docente escribe la calificación y la guarda sin que el
estudiante la vea. La columna `submissions.draft_grade` es distinta de
`submissions.grade`; el backend solo expone `grade` al estudiante. Al pulsar
*Devolver*, el borrador pasa a nota definitiva, se registra `returned_at` y se
genera la notificación. Existe además la devolución **en lote** para cerrar de
una vez todas las notas pendientes de un trabajo.

**Doble visibilidad de los comentarios.** La tabla `comments` es polimórfica
(`target_type` + `target_id`) y tiene una columna `visibility`. Un comentario
`class` sobre un anuncio o una tarea lo ve toda la clase; un comentario
`private` sobre una entrega lo ven exclusivamente su autor y el docente. Un
tercer estudiante que solicite ese hilo recibe **403 Forbidden** desde el
servicio, no un filtrado en la interfaz.

**Estados de la entrega.** `assigned` → `turned_in` → `returned`, más
`reclaimed` cuando el estudiante retira el trabajo antes de la devolución. Al
entregar, el backend compara la hora con `coursework.due_at` y marca
`is_late = 1` si corresponde: la condición de tardío la decide el servidor, no
el cliente.

**Borrador y publicación del trabajo.** El trabajo tiene dos estados: `draft`
—invisible para el estudiante, sin notificación y sin aparecer en pendientes— y
`published`, con `published_at` fijado. El diálogo de creación publica de
inmediato (su botón dice *Publicar*); al estado borrador se llega con *Volver a
borrador* desde el menú del trabajo, que no pierde las entregas ya recibidas, y
también al **reutilizar una publicación**, que entra siempre como borrador para
poder ajustar fechas antes de exponerla.

**Personalización de la clase en tiempo real.** El encabezado admite tres
modos: color plano (`theme_color`), imagen de la galería incluida
(`/banners/*.svg`) o imagen subida por el docente. El cambio se refleja de
inmediato, sin recargar, y queda guardado en la base de datos.

**Tema oscuro persistente.** La preferencia (`claro` / `oscuro` / `del sistema`)
se guarda en `user_settings.theme`, por lo que acompaña al usuario entre
sesiones y entre navegadores. Está implementada como una redefinición de los
tokens de color bajo `:root[data-theme='dark']`: **ningún componente contiene
lógica de tema**. Un script en `index.html` aplica el tema antes del primer
pintado para evitar el destello blanco al recargar.

**Reutilizar publicación.** El docente copia una tarea de otra de sus clases con
sus adjuntos incluidos. La copia entra siempre como borrador, para permitir
ajustar fechas antes de publicar.

**Vista previa de archivos.** Imágenes, PDF, TXT y CSV se abren en un visor
dentro de la aplicación; el resto de formatos se descargan.

**Exportación de la libreta.** `GET /api/courses/:id/gradebook.csv` entrega la
matriz alumno × trabajo. El archivo lleva BOM UTF-8 para que Excel respete los
acentos, y separador `\r\n`.

**Rol acudiente.** Panel de solo lectura con las clases, el promedio y las notas
del estudiante vinculado. El vínculo lo crea la administración
(`guardian_students`). El acudiente no puede entrar a las clases ni al módulo de
administración.

## 2.3 Características no funcionales destacadas

| Característica | Cómo se materializa |
|---|---|
| Autorización en el servidor | Middleware `authorize(...roles)` en la ruta + verificación de pertenencia a la clase en el *service*. La interfaz oculta opciones, pero el permiso lo decide el backend. |
| Validación de entrada | Esquemas Zod (`validators/schemas.ts`) aplicados por el middleware `validate(schema, source)` antes de llegar al controlador. |
| Prevención de inyección SQL | Consultas parametrizadas en todos los repositorios y listas blancas de columnas (`COLUMN_MAP`, `PROFILE_COLUMNS`, `SETTINGS_COLUMNS`, `CW_COLUMNS`) que impiden que una clave del cliente llegue al SQL. |
| Contraseñas | Hash bcrypt con 10 rondas. La contraseña en claro nunca se almacena ni se registra. |
| Protección de fuerza bruta | Limitador de 10 **intentos fallidos** por minuto y por combinación IP + correo; un inicio de sesión correcto borra el contador. |
| Archivos subidos | Nombre aleatorio en el servidor, tipo MIME y tamaño validados (imágenes 4 MB, documentos 15 MB), y servidos con `X-Content-Type-Options: nosniff` y `Content-Security-Policy: default-src 'none'; sandbox`. |
| Integridad de datos | 13 tablas InnoDB con claves foráneas, `ON DELETE CASCADE`/`SET NULL`/`RESTRICT` según el caso, y restricciones `UNIQUE` que impiden duplicados (una entrega por alumno y tarea, un vínculo por acudiente y estudiante). |
| Rendimiento de consulta | Índices compuestos en los accesos frecuentes y dos vistas (`v_gradebook`, `v_pending_work`) que encapsulan las uniones más costosas. |
| Accesibilidad | Etiquetas ARIA en controles e iconos, nombres accesibles únicos por fila (`Guardar borrador de <alumno>`), navegación por teclado en menús y diálogos. |
| Responsividad | Diseño fluido; por debajo de 768 px el menú lateral se superpone al contenido en lugar de desplazarlo. |
| Trazabilidad | 38 pruebas E2E que recorren los flujos críticos de los cuatro roles. |

---

# 3. Análisis de requerimientos

## 3.1 Actores del sistema

| Actor | Descripción | Cómo se identifica |
|---|---|---|
| **Administrador** | Gestiona cuentas y supervisa la actividad global. No participa como docente ni alumno. | `roles.slug = 'admin'` |
| **Docente** | Crea y administra sus clases, publica trabajo y califica. | `roles.slug = 'teacher'` |
| **Estudiante** | Se inscribe en clases, entrega trabajo y consulta sus notas. | `roles.slug = 'student'` |
| **Acudiente** | Consulta el progreso del estudiante a su cargo. Sin capacidad de escritura. | `roles.slug = 'guardian'` |

> **Nota sobre el doble rol.** El rol global (`users.role_id`) es distinto del rol
> *dentro* de una clase (`enrollments.course_role`). Un docente puede estar
> inscrito como estudiante en la clase de un colega: en su propia clase ve las
> herramientas de docente y en la ajena las de alumno. El menú lateral separa
> ambos casos en «Clases impartidas» y «Clases inscritas».

## 3.2 Requerimientos funcionales

Nomenclatura: **RF-xx**. La columna *Estado* indica si está implementado (✔),
implementado parcialmente (◑) o fuera del alcance de esta versión (✖).

### Autenticación y cuenta

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-01 | Registrarse indicando nombre, correo, contraseña y rol (estudiante, docente o acudiente) | Visitante | Alta | ✔ |
| RF-02 | Iniciar sesión con correo y contraseña | Todos | Alta | ✔ |
| RF-03 | Cerrar sesión, invalidando la cookie de sesión | Todos | Alta | ✔ |
| RF-04 | Mantener la sesión activa entre recargas y cierres del navegador (7 días) | Todos | Media | ✔ |
| RF-05 | Rechazar el acceso a cuentas con estado `inactive` | Sistema | Alta | ✔ |
| RF-06 | Limitar los intentos fallidos de inicio de sesión | Sistema | Media | ✔ |
| RF-07 | Consultar y editar el propio perfil (nombre, biografía, teléfono) | Todos | Media | ✔ |
| RF-08 | Subir y eliminar la foto de perfil | Todos | Baja | ✔ |
| RF-09 | Cambiar la propia contraseña verificando la actual | Todos | Media | ✔ |
| RF-10 | Recuperar la contraseña por correo electrónico | Todos | Baja | ✖ |

### Gestión de clases

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-11 | Crear una clase con nombre, sección, materia y aula | Docente, Admin | Alta | ✔ |
| RF-12 | Generar automáticamente un código único de 8 caracteres para unirse | Sistema | Alta | ✔ |
| RF-13 | Unirse a una clase escribiendo el código | Estudiante, Docente | Alta | ✔ |
| RF-14 | Unirse a una clase mediante un enlace de invitación (`/join/:code`) | Estudiante | Media | ✔ |
| RF-15 | Editar los datos de la clase | Docente propietario | Media | ✔ |
| RF-16 | Personalizar el encabezado: color, imagen de la galería o imagen propia | Docente propietario | Media | ✔ |
| RF-17 | Reflejar la personalización de inmediato, sin recargar la página | Sistema | Media | ✔ |
| RF-18 | Archivar y restaurar una clase | Docente propietario | Media | ✔ |
| RF-19 | Eliminar una clase de forma definitiva | Docente propietario | Baja | ✔ |
| RF-20 | Copiar una clase (duplicar su estructura) | Docente | Baja | ✔ |
| RF-21 | Ver los integrantes separados por docentes y estudiantes | Todos los de la clase | Media | ✔ |
| RF-22 | Retirar a un integrante de la clase | Docente propietario | Media | ✔ |
| RF-23 | Abandonar una clase por decisión propia | Estudiante | Baja | ✔ |
| RF-24 | Invitar por correo electrónico | Docente | Baja | ✖ |

### Tablón de novedades

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-25 | Publicar un anuncio en la clase | Docente | Alta | ✔ |
| RF-26 | Ver el tablón con anuncios y trabajo publicado en orden cronológico | Todos los de la clase | Alta | ✔ |
| RF-27 | Comentar un anuncio; el comentario lo ve toda la clase | Todos los de la clase | Media | ✔ |
| RF-28 | Eliminar un comentario propio; el docente puede eliminar cualquiera de su clase | Autor, Docente | Baja | ✔ |
| RF-29 | Ver el código de la clase en el encabezado para compartirlo | Docente | Media | ✔ |

### Trabajo en clase

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-30 | Crear trabajo de tipo tarea, material, pregunta o cuestionario | Docente | Alta | ✔ |
| RF-31 | Asignar puntaje máximo y fecha de entrega, ambos opcionales | Docente | Alta | ✔ |
| RF-32 | Guardar el trabajo como borrador, invisible para el estudiante | Docente | Alta | ◑ El estado existe y la API lo acepta, pero el diálogo de creación publica de inmediato; al borrador se llega con *Volver a borrador* o al reutilizar una publicación |
| RF-33 | Publicar un borrador y notificar a los inscritos | Docente | Alta | ✔ |
| RF-34 | Devolver un trabajo publicado a borrador sin perder las entregas | Docente | Media | ✔ |
| RF-35 | Editar el título, las instrucciones, el puntaje y la fecha | Docente | Media | ✔ |
| RF-36 | Eliminar un trabajo | Docente | Media | ✔ |
| RF-37 | Crear, renombrar, reordenar y eliminar temas | Docente | Media | ✔ |
| RF-38 | Agrupar el trabajo por tema; el trabajo sin tema aparece en «Sin tema» | Sistema | Media | ✔ |
| RF-39 | Adjuntar documentos al trabajo (PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, imágenes) | Docente | Alta | ✔ |
| RF-40 | Adjuntar enlaces al trabajo, detectando los de YouTube | Docente | Baja | ✔ |
| RF-41 | Quitar un adjunto del trabajo | Docente | Media | ✔ |
| RF-42 | Reutilizar una publicación de otra clase propia, con sus adjuntos | Docente | Baja | ✔ |
| RF-43 | Previsualizar imágenes, PDF, TXT y CSV sin salir de la aplicación | Todos | Baja | ✔ |
| RF-44 | Cuestionarios con preguntas, opciones y autocalificación | Docente | Media | ✖ |
| RF-45 | Rúbricas de evaluación por criterios y niveles | Docente | Baja | ✖ |

### Entregas

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-46 | Ver el detalle del trabajo con instrucciones, adjuntos y fecha límite | Estudiante | Alta | ✔ |
| RF-47 | Adjuntar archivos a la propia entrega | Estudiante | Alta | ✔ |
| RF-48 | Responder por escrito (preguntas y respuestas cortas) | Estudiante | Media | ✔ |
| RF-49 | Marcar el trabajo como entregado | Estudiante | Alta | ✔ |
| RF-50 | Retirar la entrega para corregirla antes de la devolución | Estudiante | Media | ✔ |
| RF-51 | Marcar automáticamente la entrega como tardía comparando con la fecha límite | Sistema | Alta | ✔ |
| RF-52 | Impedir que un estudiante adjunte material a la tarea (solo a su entrega) | Sistema | Alta | ✔ |
| RF-53 | Ver el estado propio de cada trabajo: asignado, entregado, calificado | Estudiante | Alta | ✔ |
| RF-54 | Ver la lista de pendientes con las fechas más próximas | Estudiante | Media | ✔ |

### Calificación

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-55 | Ver todas las entregas de un trabajo con su estado | Docente | Alta | ✔ |
| RF-56 | Desplegar la entrega de un alumno y ver su texto y sus archivos | Docente | Alta | ✔ |
| RF-57 | Guardar una nota en borrador, invisible para el estudiante | Docente | Alta | ✔ |
| RF-58 | Devolver la nota a un estudiante y notificarlo | Docente | Alta | ✔ |
| RF-59 | Devolver en lote todas las notas pendientes de un trabajo | Docente | Media | ✔ |
| RF-60 | Intercambiar comentarios privados con un estudiante sobre su entrega | Docente, Estudiante | Media | ✔ |
| RF-61 | Impedir que un tercer estudiante acceda a un hilo privado ajeno | Sistema | Alta | ✔ |
| RF-62 | Consultar la libreta de calificaciones (alumno × trabajo) | Docente | Alta | ✔ |
| RF-63 | Exportar la libreta a CSV compatible con Excel | Docente | Media | ✔ |
| RF-64 | Consultar sus propias notas y el promedio | Estudiante | Alta | ✔ |
| RF-65 | Ver la lista de entregas pendientes de revisión | Docente | Media | ✔ |
| RF-66 | Periodos académicos y promedio ponderado | Docente | Baja | ✖ |

### Notificaciones, calendario y ajustes

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-67 | Generar notificación al publicar trabajo, anuncio o nota, y al recibir un comentario privado | Sistema | Media | ✔ |
| RF-68 | Ver el contador de no leídos en la barra superior | Todos | Media | ✔ |
| RF-69 | Marcar una notificación o todas como leídas | Todos | Media | ✔ |
| RF-70 | Ver las fechas de entrega en un calendario mensual | Todos | Media | ✔ |
| RF-71 | Elegir tema claro, oscuro o el del sistema | Todos | Media | ✔ |
| RF-72 | Conservar el tema entre sesiones y navegadores | Sistema | Media | ✔ |
| RF-73 | Elegir densidad de la interfaz (cómoda o compacta) | Todos | Baja | ✔ |
| RF-74 | Activar o desactivar cada tipo de notificación | Todos | Baja | ✔ |
| RF-75 | Mostrar u ocultar las clases archivadas en el menú | Todos | Baja | ✔ |
| RF-76 | Traducir la interfaz al idioma seleccionado | Todos | Baja | ◑ La preferencia se guarda; los textos no se traducen |

### Administración y seguimiento

| ID | Requerimiento | Actor | Prioridad | Estado |
|---|---|---|---|---|
| RF-77 | Ver métricas globales: usuarios, docentes, estudiantes, inactivos, clases, trabajos, entregas | Admin | Media | ✔ |
| RF-78 | Listar y buscar usuarios por nombre o correo | Admin | Alta | ✔ |
| RF-79 | Crear un usuario asignándole cualquier rol | Admin | Alta | ✔ |
| RF-80 | Cambiar el rol de un usuario | Admin | Media | ✔ |
| RF-81 | Activar o desactivar una cuenta | Admin | Media | ✔ |
| RF-82 | Restablecer la contraseña de un usuario | Admin | Media | ✔ |
| RF-83 | Impedir que el administrador se cambie el rol o se desactive a sí mismo | Sistema | Alta | ✔ |
| RF-84 | Listar todas las clases del sistema con su propietario y su código | Admin | Media | ✔ |
| RF-85 | Vincular y desvincular un acudiente con un estudiante | Admin | Media | ✔ |
| RF-86 | Consultar clases, notas y promedio del estudiante vinculado | Acudiente | Media | ✔ |
| RF-87 | Impedir que el acudiente entre a las clases o a administración | Sistema | Alta | ✔ |
| RF-88 | Enviar al acudiente un resumen periódico por correo | Sistema | Baja | ✖ |
| RF-89 | Registro de auditoría de las acciones administrativas | Sistema | Baja | ✖ |

**Resumen:** 89 requerimientos funcionales identificados — **80 implementados**,
1 parcial, 8 fuera del alcance de esta versión (§4.3).

## 3.3 Requerimientos no funcionales

| ID | Categoría | Requerimiento | Cómo se verifica |
|---|---|---|---|
| RNF-01 | Seguridad | Las contraseñas se almacenan con hash bcrypt, nunca en claro | Inspección de `users.password_hash` |
| RNF-02 | Seguridad | El token de sesión no es accesible desde JavaScript | Cookie `httpOnly`; verificable en las DevTools |
| RNF-03 | Seguridad | Toda ruta privada exige sesión válida; los módulos por rol la exigen además | Middlewares `authenticate` y `authorize` |
| RNF-04 | Seguridad | La autorización se decide en el servidor, no en la interfaz | Pruebas E2E que fuerzan la URL prohibida |
| RNF-05 | Seguridad | Toda entrada del cliente se valida antes de procesarse | Esquemas Zod |
| RNF-06 | Seguridad | Ninguna consulta concatena valores del cliente | Consultas parametrizadas + listas blancas de columnas |
| RNF-07 | Seguridad | Los archivos subidos se validan por tipo y tamaño y se sirven sin ejecución | `config/uploads.ts` + cabeceras CSP y `nosniff` |
| RNF-08 | Usabilidad | Interfaz en español, con estados vacíos ilustrados y explicativos | Inspección visual |
| RNF-09 | Usabilidad | Confirmación explícita en las acciones destructivas | Diálogos de confirmación |
| RNF-10 | Usabilidad | Retroalimentación inmediata de cada acción mediante avisos temporales | Componente `Toast` |
| RNF-11 | Accesibilidad | Controles e iconos con nombre accesible; iconos decorativos marcados `aria-hidden` | Selectores por rol en las pruebas E2E |
| RNF-12 | Compatibilidad | Funciona en navegadores basados en Chromium, Firefox y WebKit actuales | Estándares web sin dependencias propietarias |
| RNF-13 | Responsividad | Usable desde 320 px de ancho | Diseño fluido; menú superpuesto bajo 768 px |
| RNF-14 | Rendimiento | Las consultas frecuentes se apoyan en índices | 3 índices compuestos + 2 vistas |
| RNF-15 | Rendimiento | Conexiones a MySQL reutilizadas mediante pool | `database/connection.ts` |
| RNF-16 | Mantenibilidad | Cada capa tiene una sola responsabilidad | Estructura de carpetas del backend |
| RNF-17 | Mantenibilidad | Tipado estricto sin `any` implícito | `npm run typecheck` sin errores |
| RNF-18 | Mantenibilidad | Estilo de código uniforme | `npm run lint` sin advertencias |
| RNF-19 | Mantenibilidad | Los colores viven en un único archivo de tokens | `styles/theme.css` |
| RNF-20 | Portabilidad | Instalable en Windows, macOS o Linux con Node 20+ y MySQL 5.7+/MariaDB 10.4+ | Sin dependencias del sistema operativo |
| RNF-21 | Fiabilidad | Errores traducidos a mensajes comprensibles, sin exponer detalles internos | Middleware `errorHandler` |
| RNF-22 | Fiabilidad | Aviso visible cuando la API no responde, en lugar de fallo silencioso | Componente `ApiOfflineBanner` |
| RNF-23 | Fiabilidad | Las migraciones sobre datos existentes son idempotentes | Ejecución repetida sin efecto adicional |
| RNF-24 | Integridad | Ninguna fila huérfana; el borrado propaga o se bloquea según el caso | Claves foráneas InnoDB |
| RNF-25 | Verificabilidad | Los flujos críticos de los cuatro roles están cubiertos por pruebas automatizadas | 38 pruebas E2E en verde |

## 3.4 Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Un usuario tiene exactamente un rol global, y dentro de cada clase un rol propio (docente o estudiante). |
| RN-02 | Solo el propietario de la clase puede editarla, personalizarla, archivarla o eliminarla. |
| RN-03 | Un trabajo en borrador es invisible para los estudiantes; no genera notificación ni aparece en pendientes. |
| RN-04 | Existe como máximo una entrega por estudiante y trabajo (`UNIQUE (coursework_id, student_id)`). |
| RN-05 | La entrega es tardía si su hora de envío es posterior a `due_at`. Lo determina el servidor. |
| RN-06 | La nota en borrador es visible únicamente para el docente. El estudiante solo ve la nota devuelta. |
| RN-07 | Una entrega no puede retirarse después de haber sido devuelta. |
| RN-08 | Un comentario privado sobre una entrega solo lo ven su autor y el docente de la clase. |
| RN-09 | La libreta y el promedio consideran solo el trabajo publicado y con puntaje (`max_points IS NOT NULL`). |
| RN-10 | El código de clase es único en todo el sistema. |
| RN-11 | Un acudiente solo consulta la información de los estudiantes con los que tiene vínculo registrado. |
| RN-12 | El administrador no puede cambiarse el rol ni desactivarse a sí mismo (evita quedarse sin administradores). |
| RN-13 | Una cuenta `inactive` no puede iniciar sesión. |
| RN-14 | Al eliminar un tema, su trabajo no se borra: pasa a «Sin tema» (`ON DELETE SET NULL`). |
| RN-15 | Al eliminar una clase se eliminan en cascada sus inscripciones, temas, trabajo, entregas y anuncios. |
| RN-16 | Un usuario propietario de clases no puede eliminarse (`ON DELETE RESTRICT`): primero deben resolverse sus clases. |

## 3.5 Casos de uso principales

### CU-01 · Publicar una tarea con material adjunto

- **Actor principal:** Docente
- **Precondición:** Sesión iniciada; es propietario o docente de la clase.
- **Flujo normal:**
  1. Entra a la clase y abre *Trabajo de clase*.
  2. Pulsa **Crear → Tarea**.
  3. Escribe el título y las instrucciones; opcionalmente fija puntaje, fecha y tema.
  4. Pulsa **Publicar**: el trabajo queda en `published` y visible para la clase.
  5. Abre el trabajo y adjunta el material (archivo o enlace).
- **Postcondición:** `status = 'published'`, `published_at` fijado, notificación
  generada para cada estudiante inscrito, el trabajo aparece en el tablón y en
  los pendientes de los alumnos.
- **Variante (preparar antes de exponer):** tras el paso 4, **Opciones → Volver
  a borrador**; el trabajo desaparece de la vista del alumno, se adjunta el
  material con calma y se vuelve a **Publicar**.
- **Flujos alternativos:** si falta el título, la validación lo rechaza y el
  diálogo permanece abierto; si el archivo excede 15 MB o tiene un tipo no
  permitido, la subida se rechaza con un mensaje explicativo.

### CU-02 · Entregar un trabajo

- **Actor principal:** Estudiante
- **Precondición:** El trabajo está publicado en una clase donde está inscrito.
- **Flujo normal:**
  1. Abre el trabajo desde *Pendientes*, el tablón o *Trabajo de clase*.
  2. Adjunta sus archivos en **Tu trabajo** y, si aplica, escribe su respuesta.
  3. Pulsa **Entregar**.
- **Postcondición:** `state = 'turned_in'`, `submitted_at` registrado,
  `is_late` calculado, la entrega aparece en los pendientes de revisión del docente.
- **Flujo alternativo:** mientras no esté devuelta, puede pulsar **Retirar la
  entrega** (`state = 'reclaimed'`), corregir y volver a entregar.

### CU-03 · Calificar y devolver

- **Actor principal:** Docente
- **Precondición:** Existe al menos una entrega del trabajo.
- **Flujo normal:**
  1. Abre el trabajo; ve la lista de estudiantes con su estado.
  2. Despliega una fila para revisar el texto y los archivos entregados.
  3. Escribe la nota y pulsa **Guardar borrador** (el alumno no la ve).
  4. Opcionalmente deja un comentario privado.
  5. Pulsa **Devolver** —o **Devolver todo** para cerrar el trabajo completo.
- **Postcondición:** `grade` fijado, `state = 'returned'`, `returned_at`
  registrado, notificación de calificación enviada al estudiante, la nota
  aparece en la libreta.

### CU-04 · Unirse a una clase

- **Actor principal:** Estudiante
- **Flujo normal:** en *Inicio* pulsa **Añadir clase → Unirse a una clase**,
  escribe el código de 8 caracteres y confirma.
- **Postcondición:** fila en `enrollments` con `course_role = 'student'`; la
  clase aparece en su menú lateral.
- **Flujos alternativos:** código inexistente → mensaje de error; ya inscrito →
  se informa sin duplicar la inscripción. Con un enlace de invitación
  (`/join/:code`) el código llega precargado.

### CU-05 · Crear un usuario y vincular su acudiente

- **Actor principal:** Administrador
- **Flujo normal:**
  1. Entra a *Administración*.
  2. Pulsa **Crear usuario**, completa los datos y elige el rol → el estudiante queda creado.
  3. Repite el paso 2 con rol *Acudiente*.
  4. En la fila del estudiante abre **Opciones → Acudientes**.
  5. Elige el acudiente, indica el parentesco y pulsa **Vincular**.
- **Postcondición:** fila en `guardian_students`; al iniciar sesión, el
  acudiente ve *Seguimiento* con el progreso del estudiante.

### CU-06 · Consultar el progreso como acudiente

- **Actor principal:** Acudiente
- **Precondición:** Tiene al menos un vínculo registrado.
- **Flujo normal:** inicia sesión, abre *Seguimiento* y consulta las clases, el
  promedio y las notas del estudiante.
- **Postcondición:** ninguna. El acceso es de solo lectura.
- **Restricción:** al intentar abrir `/admin` o una clase, el sistema lo impide
  (verificado por prueba automatizada).

## 3.6 Matriz de trazabilidad requerimiento ↔ implementación ↔ prueba

| RF | Backend | Frontend | Prueba E2E |
|---|---|---|---|
| RF-01 – RF-06 | `authService`, `rateLimit` | `LoginPage`, `RegisterPage` | `smoke.spec.ts` |
| RF-07 – RF-09 | `userService` | `ProfilePage` | `modules.spec.ts` |
| RF-11 – RF-20 | `courseService` | `HomePage`, `CustomizeCourseDialog` | `smoke.spec.ts`, `attachments.spec.ts` |
| RF-21 – RF-23 | `courseService` | `PeopleTab` | `smoke.spec.ts` |
| RF-25 – RF-29 | `streamService` | `StreamTab`, `CommentThread` | `features.spec.ts` |
| RF-30 – RF-38 | `courseworkService` | `ClassworkTab`, `TopicsDialog` | `features.spec.ts` |
| RF-39 – RF-43 | `attachmentService` | `AttachmentPicker`, `FilePreviewDialog` | `attachments.spec.ts` |
| RF-46 – RF-54 | `submissionService` | `CourseworkDetailPage`, `TodoPage` | `attachments.spec.ts`, `modules.spec.ts` |
| RF-55 – RF-65 | `submissionService`, `courseworkController` | `CourseworkDetailPage`, `GradesTab` | `features.spec.ts` |
| RF-67 – RF-70 | `notificationRepo`, `calendarService` | `NotificationsPage`, `CalendarPage` | `modules.spec.ts` |
| RF-71 – RF-75 | `userService` | `SettingsPage`, `ThemeToggle` | `theme.spec.ts` |
| RF-77 – RF-85 | `adminController`, `guardianService` | `AdminPage`, `GuardianLinksDialog` | `features.spec.ts` |
| RF-86 – RF-87 | `guardianService` | `GuardianPage` | `features.spec.ts` |

---

# 4. Alcance

## 4.1 Delimitación

Kiro Education es un **prototipo funcional de demostración académica**, de
alcance local (un equipo con XAMPP), destinado a mostrar el ciclo completo de la
actividad académica bajo control de acceso por roles. Se ejecuta en el entorno
de desarrollo (`npm run dev`) y no está desplegado en un servidor público.

## 4.2 Incluido en el alcance

**Funcional**

- Cuatro roles con módulos diferenciados: administrador, docente, estudiante y acudiente.
- Ciclo completo de la clase: creación, personalización, inscripción por código o enlace, archivado y eliminación.
- Ciclo completo de la actividad: borrador → publicación → entrega → calificación en borrador → devolución.
- Cuatro tipos de trabajo (tarea, material, pregunta, cuestionario) organizados en temas reordenables.
- Adjuntos de documentos y enlaces, tanto en la tarea como en la entrega, con vista previa.
- Comentarios de clase y comentarios privados alumno ↔ docente.
- Libreta de calificaciones con exportación a CSV y devolución en lote.
- Notificaciones internas, calendario mensual y listas de pendientes por rol.
- Perfil de usuario y ajustes personales (tema, densidad, notificaciones).
- Módulo de administración: métricas, gestión de usuarios y vínculos de acudiente.

**Técnico**

- Base de datos MySQL con 13 tablas, 2 vistas y 3 índices de apoyo, entregada como scripts SQL ejecutables en MySQL Workbench.
- API REST de 75 rutas bajo `/api`, con autenticación JWT y autorización por rol.
- 20 vistas de interfaz construidas sobre 35 componentes reutilizables (11 átomos, 9 moléculas, 13 organismos, 2 plantillas).
- Tema claro y oscuro persistido por usuario.
- 38 pruebas E2E automatizadas.
- Migraciones idempotentes para actualizar una base con datos ya cargados.

## 4.3 Excluido del alcance

| Excluido | Motivo |
|---|---|
| Integración real con Google (Classroom, Drive, Meet, cuentas) | El objetivo es simular el comportamiento con backend propio; usar sus APIs exige credenciales y aprobación de Google. |
| Envío de correo electrónico (recuperar contraseña, invitaciones, resumen al acudiente) | Requiere un servidor SMTP o un servicio externo, fuera del entorno XAMPP local. |
| Cuestionarios con autocalificación y rúbricas | Exigen su propio modelo de datos (preguntas, opciones, criterios, niveles); planificado como siguiente iteración. |
| Periodos académicos y promedio ponderado | Igual que el anterior: modelo adicional pendiente. |
| Videollamada integrada | Necesita infraestructura de señalización y medios (WebRTC/SFU). |
| Detección de plagio | Requiere un servicio de comparación documental externo. |
| Actualización en tiempo real por WebSocket | La actualización actual es por recarga de datos al navegar o actuar. |
| Aplicación móvil nativa | La interfaz es responsiva y se usa desde el navegador del móvil. |
| Despliegue en la nube y contenedores | El requisito explícito es ejecución local sobre XAMPP. |
| Traducción efectiva de la interfaz | La preferencia de idioma se guarda, pero los textos están en español. |
| Registro de auditoría y borrado lógico | Planificado; no imprescindible para la demostración. |
| Paginación de listados | Con el volumen de datos de prueba no es necesaria; sí lo sería en producción. |

## 4.4 Limitaciones conocidas

1. **Almacenamiento local de archivos.** Los adjuntos se guardan en el disco del servidor. Con varias instancias habría que mover el almacenamiento a un servicio compartido.
2. **Limitador de intentos en memoria.** Los contadores viven en el proceso; se reinician al reiniciar la API y no se comparten entre instancias.
3. **Sin renovación de token.** Al expirar los 7 días, la sesión se cierra y hay que volver a iniciarla.
4. **Borrado físico.** Eliminar una clase o un trabajo es definitivo; no hay papelera.
5. **Sin paginación.** Los listados traen todas las filas.
6. **La preferencia de idioma no traduce.** Queda registrada pero no cambia los textos.
7. **Requiere que MySQL esté iniciado.** Sin XAMPP en marcha la aplicación muestra el aviso de API sin conexión.

## 4.5 Supuestos

- Existe un equipo con Node.js 20+ y XAMPP instalado.
- El usuario `root` de MySQL tiene los permisos necesarios sobre `classroom_db`.
- Los usuarios del prototipo se crean desde el módulo de administración o con el registro público; no se importan desde un sistema externo.
- El volumen esperado es el de un aula (decenas de usuarios), no institucional.

---

# 5. Objetivos

## 5.1 Objetivo general

> Desarrollar un sistema web prototipo que simule las funciones principales de
> Google Classroom —gestión de clases, publicación de trabajo, entrega,
> calificación y comunicación— sobre una arquitectura cliente–servidor con base
> de datos MySQL administrada desde XAMPP, aplicando control de acceso basado en
> roles de modo que cada tipo de usuario disponga únicamente de los módulos que
> le corresponden.

## 5.2 Objetivos específicos

**Sobre la base de datos**

1. Diseñar un modelo relacional normalizado que represente roles, usuarios, clases, inscripciones, temas, trabajo, entregas, anuncios, adjuntos, comentarios, notificaciones, preferencias y vínculos de acudiente, garantizando la integridad mediante claves foráneas y restricciones de unicidad.
2. Entregar el modelo como scripts SQL ejecutables directamente en MySQL Workbench, acompañados de datos de prueba representativos de un aula real.
3. Proveer migraciones idempotentes que permitan incorporar nuevas funciones a una base con datos ya cargados sin pérdida de información.
4. Encapsular en vistas las consultas de mayor costo (libreta de calificaciones y trabajo pendiente) e incorporar índices en los accesos frecuentes.

**Sobre el backend**

5. Construir una API REST organizada en capas con responsabilidad única —rutas, middlewares, controladores, servicios y repositorios— donde solo los repositorios escriban SQL y solo los servicios decidan permisos.
6. Implementar autenticación con contraseñas cifradas mediante bcrypt y token JWT transportado en cookie `httpOnly`.
7. Implementar autorización por rol y por pertenencia a la clase, de forma que ningún permiso dependa de lo que muestre la interfaz.
8. Validar toda entrada del cliente mediante esquemas antes de procesarla, y proteger las consultas con parámetros y listas blancas de columnas.
9. Gestionar la subida de imágenes y documentos con validación de tipo y tamaño, nombres aleatorios en el servidor y cabeceras que impidan su ejecución.

**Sobre el frontend**

10. Construir la interfaz aplicando diseño atómico, de manera que las vistas se compongan de átomos, moléculas, organismos y plantillas reutilizables.
11. Lograr un entorno visual minimalista basado en superficies neutras, en el que el color cumpla una función informativa concentrada en los iconos.
12. Centralizar la paleta y las medidas en un único archivo de tokens, y derivar de él el tema oscuro sin introducir lógica de tema en los componentes.
13. Ofrecer personalización en tiempo real de la clase (color, imagen de galería o imagen propia) y del tema del usuario, con persistencia en la base de datos.
14. Garantizar que la aplicación sea usable desde 320 px de ancho y accesible mediante teclado y lector de pantalla.

**Sobre la simulación de los flujos**

15. Reproducir el ciclo de vida del trabajo en clase, incluyendo el estado de borrador invisible para el estudiante.
16. Reproducir el ciclo de vida de la entrega con sus cuatro estados y la detección automática de retraso en el servidor.
17. Reproducir el modelo de calificación en dos etapas —nota en borrador y nota devuelta— con la visibilidad diferenciada que le corresponde a cada rol.
18. Reproducir los dos canales de comunicación de la plataforma: comentarios de clase y comentarios privados alumno ↔ docente.

**Sobre la calidad y la verificación**

19. Mantener el código con tipado estricto y estilo uniforme, verificados con TypeScript y ESLint sin errores.
20. Cubrir con pruebas automatizadas de extremo a extremo los flujos críticos de los cuatro roles, incluidas las reglas de visibilidad y las restricciones de acceso.
21. Documentar el sistema —instalación, arquitectura, modelo de datos, API y manuales de usuario por rol— de modo que un tercero pueda instalarlo y evaluarlo sin asistencia.

## 5.3 Verificación del cumplimiento

| Objetivo | Evidencia verificable |
|---|---|
| 1 – 4 | `001_schema.sql` (13 tablas, 2 vistas, 3 índices), `002_seed.sql`, migraciones `003`–`005` |
| 5 – 9 | `backend/src/` con 6 capas; 75 rutas; `authenticate`, `authorize`, `validate`, `rateLimit`, `upload` |
| 10 – 14 | 35 componentes en 4 niveles; `styles/theme.css` como único origen de la paleta; `theme.spec.ts` |
| 15 – 18 | `features.spec.ts` verifica borrador, nota en borrador, comentarios privados y el 403 al tercero |
| 19 | `npm run typecheck` y `npm run lint` sin salida de error |
| 20 | `npm run test:e2e` → 38 pruebas en verde |
| 21 | Este documento y `README.md` |

---

# 6. Manual del sistema

Dirigido a quien instala, mantiene o evalúa técnicamente el sistema.

## 6.1 Requisitos

| Componente | Versión mínima | Comprobación |
|---|---|---|
| Node.js | 20 LTS | `node -v` |
| npm | 10 | `npm -v` |
| XAMPP con MySQL/MariaDB | MariaDB 10.4 / MySQL 5.7 | Panel de XAMPP → MySQL en *Running* |
| Navegador | Chromium, Firefox o Safari actual | — |
| Espacio en disco | ~500 MB (incluye `node_modules` y los navegadores de Playwright) | — |

## 6.2 Instalación paso a paso

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env        # en Windows: copy .env.example .env
#    Ajusta DB_PASSWORD si tu usuario root de MySQL tiene contraseña.

# 3. Iniciar MySQL desde el panel de XAMPP (botón Start en MySQL)

# 4. Crear la base de datos y cargar los datos de prueba
npm run db:setup

# 5. Levantar la aplicación (API en :4000 y frontend en :5173)
npm run dev
```

Abrir <http://localhost:5173> e iniciar sesión con cualquiera de las cuentas de
prueba (§8.1).

### Alternativa: crear la base desde MySQL Workbench

Si se prefiere no usar la terminal:

1. Abrir MySQL Workbench y conectarse a `localhost:3306` con el usuario `root`.
2. Abrir `backend/src/database/migrations/001_schema.sql` y ejecutarlo completo (`Ctrl+Shift+Enter`). Crea `classroom_db` con todas las tablas y vistas.
3. Abrir `backend/src/database/seeds/002_seed.sql` y ejecutarlo completo. Carga los datos de prueba.

> **Advertencia.** `001_schema.sql` empieza con `DROP DATABASE IF EXISTS classroom_db`.
> Ejecutarlo borra todo lo que hubiera. Para actualizar una base **con datos que
> se quieren conservar**, usar las migraciones `003`–`005` en lugar del schema.

### Migraciones sobre una base con datos

| Archivo | Qué añade |
|---|---|
| `003_customization.sql` | `users.bio`, `users.phone`, `courses.banner_kind`, `courses.banner_url`, tabla `user_settings` |
| `004_theme.sql` | `user_settings.theme` |
| `005_guardians.sql` | Tabla `guardian_students` y los 3 índices de apoyo |

Las tres son **idempotentes**: comprueban `information_schema` antes de alterar,
así que ejecutarlas dos veces no produce error ni duplica nada.

> **Importante.** Estas migraciones usan `DELIMITER`, que es una directiva del
> *cliente* MySQL y no una instrucción SQL. Deben ejecutarse en **MySQL
> Workbench** o con `mysql -u root < 003_customization.sql`. **No** funcionan con
> `npm run db:setup`, que usa el conector `mysql2` y no interpreta `DELIMITER`.

## 6.3 Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | `4000` | Puerto de la API |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen autorizado del frontend |
| `DB_HOST` | `127.0.0.1` | Servidor MySQL |
| `DB_PORT` | `3306` | Puerto MySQL |
| `DB_USER` | `root` | Usuario MySQL |
| `DB_PASSWORD` | *(vacío)* | Contraseña MySQL |
| `DB_NAME` | `classroom_db` | Nombre de la base de datos |
| `JWT_SECRET` | `classroom-dev-secret` | Clave de firma del token — **cambiar en producción** |
| `JWT_EXPIRES_IN` | `7d` | Vigencia de la sesión |
| `VITE_API_URL` | `/api` | Ruta relativa; Vite hace proxy hacia `PORT` |

`config/env.ts` valida su presencia al arrancar y falla de inmediato con un
mensaje claro si falta alguna sin valor por defecto.

## 6.4 Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  Navegador                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React 19 SPA  (Vite dev server :5173)                 │  │
│  │  pages → organisms → molecules → atoms                 │  │
│  │  context (Auth, Settings) · hooks · services (fetch)   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │  HTTP /api  (proxy de Vite)
                           │  cookie httpOnly con el JWT
┌──────────────────────────▼───────────────────────────────────┐
│  API Express 5  (:4000)                                      │
│                                                              │
│   routes  ──►  middlewares  ──►  controllers                 │
│               authenticate         (leen la petición,        │
│               authorize             devuelven la respuesta)  │
│               validate (Zod)             │                   │
│               rateLimit                  ▼                   │
│               upload (multer)        services                │
│                                     (reglas de negocio      │
│                                      y permisos)             │
│                                          │                   │
│                                          ▼                   │
│                                    repositories              │
│                                    (los únicos que           │
│                                     escriben SQL)            │
└──────────────────────────┬───────────────────────────────────┘
                           │  pool mysql2
┌──────────────────────────▼───────────────────────────────────┐
│  MySQL / MariaDB  (XAMPP :3306)   ·   classroom_db           │
│  13 tablas  ·  2 vistas  ·  claves foráneas InnoDB           │
└──────────────────────────────────────────────────────────────┘
```

**Regla estructural:** el flujo es siempre
`routes → middlewares → controller → service → repository → MySQL`.
Ninguna capa salta a la siguiente ni retrocede. Esto permite responder sin
ambigüedad a dos preguntas de auditoría: *¿dónde se escribe SQL?* (solo en
`repositories/`) y *¿dónde se decide un permiso?* (solo en `services/`).

## 6.5 Estructura de carpetas

```
classroom-react/
├─ frontend/                          ← Diseño atómico
│  ├─ index.html                      ← script anti-destello del tema
│  ├─ public/
│  │  ├─ banners/*.svg                ← galería de encabezados
│  │  └─ favicon.svg
│  └─ src/
│     ├─ assets/
│     │  ├─ icons/index.ts            ← registro central de iconos
│     │  ├─ images/                   ← 4 ilustraciones de estado vacío
│     │  └─ logos/
│     ├─ components/
│     │  ├─ atoms/        (11)        ← Button, Input, Avatar, Badge, Card,
│     │  │                               Spinner, Switch, Toast, IconButton,
│     │  │                               CourseBanner, Illustration
│     │  ├─ molecules/    (9)         ← CourseCard, StreamItem, EmptyState,
│     │  │                               Menu, CommentThread, AttachmentList,
│     │  │                               AttachmentPicker, ThemeToggle,
│     │  │                               ApiOfflineBanner
│     │  ├─ organisms/    (13)        ← TopBar, SideNav, Dialog y 10 diálogos
│     │  └─ templates/    (2)         ← AppShell, AuthLayout
│     ├─ pages/           (16 + 4)    ← una vista por archivo
│     │  └─ course/                   ← pestañas Stream, Classwork, People, Grades
│     ├─ context/                     ← AuthContext, SettingsContext
│     ├─ hooks/                       ← useAuth, useSettings, useFetch,
│     │                                  useCourseActions, useCourseContext
│     ├─ services/                    ← cliente HTTP + un archivo por dominio
│     ├─ router/                      ← AppRouter, ProtectedRoute
│     ├─ styles/theme.css             ← ÚNICO origen de la paleta y el tema oscuro
│     ├─ lib/                         ← cn, dates, files, theme
│     ├─ constants/theme.ts
│     ├─ types/models.ts
│     └─ main.tsx
│
├─ backend/src/                       ← Jerarquía por función y responsabilidad
│  ├─ config/
│  │  ├─ env.ts                       ← variables validadas al arrancar
│  │  └─ uploads.ts                   ← rutas, tipos MIME y nombres de archivo
│  ├─ database/
│  │  ├─ connection.ts                ← pool + helpers query/execute/transaction
│  │  ├─ migrations/                  ← 001_schema, 003, 004, 005
│  │  └─ seeds/002_seed.sql
│  ├─ routes/          (6 + index)    ← URLs y middlewares
│  ├─ controllers/     (10)           ← leen la petición, devuelven la respuesta
│  ├─ services/        (9)            ← reglas de negocio y permisos
│  ├─ repositories/    (8)            ← los únicos que escriben SQL
│  ├─ middlewares/     (6)            ← authenticate, authorize, validate,
│  │                                     errorHandler, rateLimit, upload
│  ├─ validators/schemas.ts           ← esquemas Zod
│  ├─ utils/                          ← HttpError, token, asyncHandler, classCode
│  ├─ types/models.ts
│  ├─ app.ts                          ← montaje de Express y cabeceras de seguridad
│  └─ server.ts                        ← arranque y verificación de MySQL
│
├─ docs/DOCUMENTACION.md              ← este archivo
├─ scripts/
│  ├─ db-setup.mjs                    ← ejecuta schema + seed
│  └─ capturas.mjs                    ← genera el anexo de capturas en PDF
├─ tests/e2e/          (5 archivos)   ← 38 pruebas Playwright
├─ playwright.config.ts
├─ vite.config.ts
├─ tsconfig.json · tsconfig.frontend.json · tsconfig.backend.json
├─ eslint.config.js
└─ .env · .env.example
```

## 6.6 Modelo de datos

### Diagrama de relaciones

```
                        ┌────────┐
                        │ roles  │
                        └───┬────┘
                            │ 1:N
                        ┌───▼────┐        1:1      ┌───────────────┐
                        │ users  │◄────────────────►│ user_settings │
                        └───┬────┘                  └───────────────┘
              ┌────────────┼─────────────┬──────────────────┐
              │ 1:N        │ 1:N         │ 1:N              │ N:M
      ┌───────▼──────┐  ┌──▼──────────┐ ┌▼──────────────┐ ┌─▼──────────────────┐
      │ enrollments  │  │notifications│ │  comments     │ │ guardian_students  │
      └───────┬──────┘  └──┬──────────┘ └───────────────┘ └────────────────────┘
              │ N:1        │ N:1
          ┌───▼────────────▼───┐
          │      courses       │
          └───┬────────────┬───┘
     1:N      │            │      1:N
      ┌───────▼──────┐  ┌──▼──────────────┐
      │    topics    │  │  announcements  │
      └───────┬──────┘  └─────────────────┘
              │ 1:N (SET NULL)
        ┌─────▼──────┐
        │ coursework │
        └─────┬──────┘
              │ 1:N
       ┌──────▼───────┐          ┌──────────────┐
       │ submissions  │          │ attachments  │  ← polimórfica:
       └──────────────┘          └──────────────┘    coursework | submission | announcement
```

### Tablas

| # | Tabla | Filas clave | Para qué |
|---|---|---|---|
| 1 | `roles` | 4 fijas | admin, teacher, student, guardian |
| 2 | `users` | — | Cuentas: nombre, correo único, hash bcrypt, avatar, biografía, teléfono, estado |
| 3 | `courses` | — | Clase: nombre, sección, materia, aula, propietario, `class_code` único, color, encabezado, estado |
| 4 | `enrollments` | — | Quién pertenece a qué clase y con qué rol **dentro** de ella. `UNIQUE (course_id, user_id)` |
| 5 | `topics` | — | Unidades del *Trabajo en clase*, con `position` para el orden |
| 6 | `coursework` | — | Tarea / material / pregunta / cuestionario; `status` draft o published, `max_points`, `due_at` |
| 7 | `submissions` | — | Entrega por alumno: `state`, `answer_text`, `grade`, `draft_grade`, `is_late`. `UNIQUE (coursework_id, student_id)` |
| 8 | `announcements` | — | Publicaciones del tablón |
| 9 | `attachments` | — | Adjuntos polimórficos (`owner_type` + `owner_id`); tipo link, file, drive o youtube |
| 10 | `comments` | — | Comentarios polimórficos (`target_type` + `target_id`) con `visibility` class o private |
| 11 | `notifications` | — | Avisos por usuario, con `read_at` para el contador de no leídos |
| 12 | `user_settings` | 1 por usuario | `theme`, `density`, `language`, tres interruptores de notificación, `show_archived` |
| 13 | `guardian_students` | — | Vínculo acudiente ↔ estudiante. `UNIQUE (guardian_id, student_id)` |

### Enumeraciones

| Tabla.columna | Valores |
|---|---|
| `users.status` | `active`, `inactive` |
| `courses.status` | `active`, `archived` |
| `courses.banner_kind` | `color`, `gallery`, `upload` |
| `enrollments.course_role` | `teacher`, `student` |
| `coursework.type` | `assignment`, `material`, `question`, `quiz` |
| `coursework.status` | `draft`, `published` |
| `submissions.state` | `assigned`, `turned_in`, `returned`, `reclaimed` |
| `attachments.owner_type` | `coursework`, `submission`, `announcement` |
| `attachments.kind` | `link`, `file`, `drive`, `youtube` |
| `comments.target_type` | `announcement`, `coursework`, `submission` |
| `comments.visibility` | `class`, `private` |
| `notifications.type` | `coursework`, `announcement`, `grade`, `comment`, `enrollment` |
| `user_settings.theme` | `light`, `dark`, `system` |
| `user_settings.density` | `comfortable`, `compact` |

### Vistas

**`v_gradebook`** — matriz alumno × trabajo. Une `courses`, `coursework`,
`enrollments`, `users` y `submissions`. Filtra a trabajo publicado **con
puntaje** (`max_points IS NOT NULL`), de modo que el material informativo no
distorsione el promedio. Alimenta la pestaña *Calificaciones* y la exportación
a CSV.

**`v_pending_work`** — trabajo sin entregar por estudiante. Considera solo
clases activas, trabajo publicado de tipo `assignment`, `question` o `quiz`, y
entregas en estado `assigned`/`reclaimed` o inexistentes. Alimenta *Pendientes*
y el bloque «Pronto se entregará».

### Índices de apoyo

| Índice | Tabla | Columnas | Consulta que acelera |
|---|---|---|---|
| `idx_sub_state_date` | `submissions` | `state`, `submitted_at` | Pendientes de revisión del docente |
| `idx_cw_course_due` | `coursework` | `course_id`, `due_at` | Calendario y próximas entregas |
| `idx_com_visibility` | `comments` | `target_type`, `target_id`, `visibility` | Separación de hilos de clase y privados |

### Política de borrado

| Relación | Regla | Efecto |
|---|---|---|
| `users` → `roles` | `RESTRICT` | No se puede borrar un rol en uso |
| `courses` → `users` (propietario) | `RESTRICT` | No se puede borrar un docente con clases |
| `enrollments`, `topics`, `coursework`, `announcements` → `courses` | `CASCADE` | Al borrar la clase se borra su contenido |
| `submissions` → `coursework` | `CASCADE` | Al borrar el trabajo se borran sus entregas |
| `coursework` → `topics` | `SET NULL` | Al borrar un tema, su trabajo pasa a «Sin tema» |
| `guardian_students` → `users` | `CASCADE` | Al borrar la cuenta desaparecen sus vínculos |

## 6.7 API REST

Todas las rutas van bajo `/api`. La sesión viaja en una cookie `httpOnly`
(también se acepta `Authorization: Bearer <token>`). Los errores devuelven
`{ message: string }` con el código HTTP correspondiente.

### Códigos de estado

| Código | Significado |
|---|---|
| `200` | Operación correcta |
| `201` | Recurso creado |
| `204` | Correcto sin contenido |
| `400` | Datos inválidos (validación Zod) |
| `401` | Sin sesión o token inválido |
| `403` | Sesión válida pero sin permiso |
| `404` | Recurso inexistente |
| `409` | Conflicto (correo o código duplicado) |
| `429` | Demasiados intentos fallidos de inicio de sesión |
| `500` | Error interno |

### Salud

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Comprueba API y conexión a MySQL |

### Autenticación — `/auth`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Crear cuenta (student, teacher o guardian) |
| `POST` | `/auth/login` | Público | Iniciar sesión (con limitador de intentos) |
| `POST` | `/auth/logout` | Público | Cerrar sesión |
| `GET` | `/auth/me` | Sesión | Usuario de la sesión actual |
| `GET` | `/auth/roles` | Público | Roles disponibles para el registro |

### Perfil y ajustes — `/users`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/users/me` | Perfil propio |
| `PATCH` | `/users/me` | Editar nombre, biografía y teléfono |
| `POST` | `/users/me/password` | Cambiar contraseña (verifica la actual) |
| `POST` | `/users/me/avatar` | Subir foto (multipart, campo `image`) |
| `DELETE` | `/users/me/avatar` | Quitar la foto |
| `GET` | `/users/me/settings` | Preferencias |
| `PATCH` | `/users/me/settings` | Guardar preferencias (incluido el tema) |

### Clases — `/courses`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/courses` | Sesión | Mis clases (`?status=active\|archived`) |
| `POST` | `/courses` | Docente, Admin | Crear clase |
| `POST` | `/courses/join` | Sesión | Unirse con el código |
| `GET` | `/courses/:id` | Miembro | Detalle de la clase |
| `PATCH` | `/courses/:id` | Propietario | Editar datos y color |
| `POST` | `/courses/:id/copy` | Docente, Admin | Duplicar la clase |
| `PATCH` | `/courses/:id/banner` | Propietario | Fijar color o imagen de galería |
| `POST` | `/courses/:id/banner/upload` | Propietario | Subir imagen de encabezado |
| `PATCH` | `/courses/:id/status` | Propietario | Archivar o restaurar |
| `DELETE` | `/courses/:id` | Propietario | Eliminar |
| `POST` | `/courses/:id/leave` | Miembro | Abandonar la clase |
| `GET` | `/courses/:id/members` | Miembro | Integrantes |
| `DELETE` | `/courses/:id/members/:memberId` | Propietario | Retirar integrante |
| `GET` | `/courses/:id/stream` | Miembro | Tablón (anuncios + trabajo publicado) |
| `POST` | `/courses/:id/announcements` | Docente | Publicar anuncio |

### Trabajo en clase por clase — `/courses/:courseId`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/coursework` | Trabajo de la clase agrupado por tema |
| `POST` | `/coursework` | Crear trabajo (publicado; con `status: 'draft'` queda en borrador) |
| `GET` | `/gradebook` | Libreta de calificaciones |
| `GET` | `/gradebook.csv` | Libreta en CSV (BOM UTF-8) |
| `GET` | `/reusable` | Trabajo reutilizable de otras clases del docente |
| `POST` | `/reuse` | Copiar un trabajo con sus adjuntos |
| `GET` | `/topics` | Temas |
| `POST` | `/topics` | Crear tema |
| `PATCH` | `/topics/reorder` | Reordenar temas |
| `PATCH` | `/topics/:topicId` | Renombrar tema |
| `DELETE` | `/topics/:topicId` | Eliminar tema |

### Trabajo, adjuntos y calificación — `/coursework`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/coursework/pending` | Estudiante | Mis pendientes |
| `GET` | `/coursework/to-review` | Docente | Entregas por revisar |
| `GET` | `/coursework/:id` | Miembro | Detalle (el docente ve todas las entregas) |
| `PATCH` | `/coursework/:id` | Docente | Editar |
| `POST` | `/coursework/:id/publish` | Docente | Publicar |
| `POST` | `/coursework/:id/unpublish` | Docente | Volver a borrador |
| `DELETE` | `/coursework/:id` | Docente | Eliminar |
| `GET` | `/coursework/:id/attachments` | Miembro | Adjuntos de la tarea |
| `POST` | `/coursework/:id/attachments` | Docente | Añadir enlace |
| `POST` | `/coursework/:id/attachments/upload` | Docente | Subir documento (campo `file`) |
| `DELETE` | `/coursework/:id/attachments/:attachmentId` | Docente | Quitar adjunto |
| `POST` | `/coursework/:id/submission/files` | Estudiante | Subir archivo a la propia entrega |
| `DELETE` | `/coursework/:id/submission/files/:attachmentId` | Estudiante | Quitar archivo propio |
| `POST` | `/coursework/:id/turn-in` | Estudiante | Entregar |
| `POST` | `/coursework/:id/reclaim` | Estudiante | Retirar la entrega |
| `POST` | `/coursework/:id/draft-grade` | Docente | Guardar nota en borrador |
| `POST` | `/coursework/:id/return-grade` | Docente | Devolver la nota |

### Comentarios, notificaciones y calendario

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/comments/:targetType/:targetId` | Hilo (el backend aplica la visibilidad) |
| `POST` | `/comments` | Comentar (`visibility` class o private) |
| `DELETE` | `/comments/:id` | Eliminar el propio; el docente, cualquiera de su clase |
| `GET` | `/notifications` | Notificaciones + contador de no leídas |
| `PATCH` | `/notifications/:id/read` | Marcar una como leída |
| `PATCH` | `/notifications/read-all` | Marcar todas como leídas |
| `GET` | `/calendar` | Entregas del mes (`?year=&month=`) |

### Administración — `/admin` *(solo rol admin)*

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/admin/overview` | Métricas globales y catálogo de roles |
| `GET` | `/admin/courses` | Todas las clases del sistema |
| `GET` | `/admin/users` | Listar y buscar usuarios (`?search=`) |
| `POST` | `/admin/users` | Crear usuario con cualquier rol |
| `PATCH` | `/admin/users/:id/role` | Cambiar rol |
| `PATCH` | `/admin/users/:id/status` | Activar o desactivar |
| `POST` | `/admin/users/:id/password` | Restablecer contraseña |

### Acudiente — `/guardian`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/guardian/me/students` | Acudiente, Admin | Estudiantes a mi cargo |
| `GET` | `/guardian/students/:studentId` | Acudiente, Admin | Resumen del estudiante |
| `GET` | `/guardian/students/:studentId/guardians` | Admin | Acudientes de un estudiante |
| `POST` | `/guardian/links` | Admin | Crear vínculo |
| `DELETE` | `/guardian/links/:guardianId/:studentId` | Admin | Eliminar vínculo |

### Archivos subidos

| Ruta | Descripción |
|---|---|
| `GET /api/uploads/:filename` | Archivo subido. Se sirve con `X-Content-Type-Options: nosniff` y `Content-Security-Policy: default-src 'none'; sandbox` |

**Límites de subida**

| Tipo | Campo | Tamaño máximo | Formatos |
|---|---|---|---|
| Imagen | `image` | 4 MB | PNG, JPG, WEBP, SVG |
| Documento | `file` | 15 MB | PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP e imágenes |

## 6.8 Seguridad

| Mecanismo | Implementación |
|---|---|
| Contraseñas | bcrypt, 10 rondas. Nunca se almacenan ni registran en claro. |
| Sesión | JWT firmado (`JWT_SECRET`), vigencia 7 días, en cookie `httpOnly` + `sameSite`. Se acompaña de una cookie no sensible `has_session=1` que solo indica «hay sesión», para no consultar `/auth/me` sin necesidad. |
| Autenticación | Middleware `authenticate`: sin token válido → `401`. |
| Autorización por rol | Middleware `authorize('admin')`, `authorize('teacher','admin')`, etc. → `403`. |
| Autorización por pertenencia | Verificada en el *service*: no basta ser docente, hay que ser docente **de esa clase**. |
| Validación | Esquemas Zod aplicados antes del controlador. |
| Inyección SQL | Consultas parametrizadas + listas blancas de columnas que traducen camelCase a snake\_case, de modo que una clave arbitraria del cliente nunca alcanza el SQL. |
| Fuerza bruta | 10 intentos **fallidos** por minuto y por IP + correo; un acceso correcto limpia el contador. Respuesta `429` con cabecera `Retry-After`. |
| Archivos | Tipo MIME y tamaño validados; nombre reaescrito a `<timestamp>-<12 hex><ext>`; el nombre original nunca toca el sistema de archivos. |
| Servido de archivos | `nosniff` + CSP restrictiva: el navegador no ejecuta lo que se sirva desde `/api/uploads`. |
| CORS | Un único origen autorizado (`CORS_ORIGIN`), con credenciales. |
| Errores | `errorHandler` traduce las excepciones a mensajes de usuario y no filtra trazas ni SQL. |

### Antes de un despliegue real

1. Cambiar `JWT_SECRET` por un valor aleatorio largo.
2. Crear un usuario MySQL específico con permisos mínimos sobre `classroom_db`; no usar `root`.
3. Servir bajo HTTPS y activar `secure: true` en la cookie.
4. Mover el limitador de intentos a Redis o a la base de datos.
5. Mover los archivos subidos a un almacenamiento compartido con copias de seguridad.
6. Añadir paginación en los listados.

## 6.9 Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | API y frontend juntos, con recarga en caliente |
| `npm run dev:api` | Solo la API (`tsx watch`) |
| `npm run dev:web` | Solo el frontend (Vite) |
| `npm run db:setup` | Crea la base de datos y carga los datos de prueba |
| `npm run db:reset` | Reinicia la base desde cero |
| `npm run typecheck` | TypeScript sobre frontend y backend |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (levanta API y frontend por su cuenta) |
| `npm run test:e2e:ui` | Playwright en modo interactivo |
| `npm run build` | Compila el frontend a `dist/` |
| `node scripts/capturas.mjs` | Genera el anexo de capturas del sistema en PDF |

## 6.10 Pruebas

38 pruebas de extremo a extremo con Playwright. Recorren el navegador real
contra la API real y la base de datos real, en un solo worker para que el orden
sea determinista.

| Archivo | Pruebas | Qué verifica |
|---|---|---|
| `smoke.spec.ts` | 7 | Inicio de sesión por rol, creación de clase, unirse por código, integrantes, cierre de sesión |
| `features.spec.ts` | 11 | Comentarios de clase y privados con su 403, menú Crear, temas, despublicar, colocación de menús y del encabezado, nota en borrador, CSV, rol acudiente |
| `attachments.spec.ts` | 6 | Adjuntar y quitar documentos y enlaces, entrega del alumno, restricción al alumno, vista previa, ilustraciones de estado vacío |
| `modules.spec.ts` | 9 | Notificaciones, calendario, pendientes, pendientes de revisión, perfil, ajustes, administración |
| `theme.spec.ts` | 5 | Tema oscuro aplicado, persistido tras cerrar sesión, opción del sistema, sin destello al recargar |

```bash
npm run test:e2e          # requiere MySQL de XAMPP iniciado
npm run test:e2e:ui       # modo interactivo, útil para la demostración
npx playwright show-report
```

Dos defectos reales fueron detectados por esta suite y corregidos: el limitador
de intentos penalizaba también los inicios de sesión correctos, y el desplegable
de acudientes del módulo de administración usaba la lista filtrada por la
búsqueda en lugar de la lista completa.

## 6.11 Diagnóstico de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| Franja «Sin conexión con el servidor» | La API no responde | Verificar que `npm run dev` sigue en ejecución y que MySQL está iniciado en XAMPP |
| `ECONNREFUSED 127.0.0.1:3306` al arrancar | MySQL detenido | Panel de XAMPP → *Start* en MySQL |
| `ER_BAD_DB_ERROR: Unknown database 'classroom_db'` | Base no creada | `npm run db:setup` |
| `Access denied for user 'root'` | Contraseña distinta | Ajustar `DB_PASSWORD` en `.env` |
| `EADDRINUSE :4000` o `:5173` | Puerto ocupado | Cerrar el proceso anterior o cambiar `PORT` |
| Sesión cerrada al recargar | Cookies bloqueadas | Permitir cookies para `localhost` |
| Acentos mal en el CSV | Excel ignoró el BOM | Importar con codificación UTF-8 |
| `You have an error in your SQL syntax ... DELIMITER` | Migración `003`/`004`/`005` ejecutada con `db:setup` | Ejecutarla en MySQL Workbench o con `mysql -u root < archivo.sql` |
| El puerto 3306 lo ocupa otro MySQL | Servicio de MySQL instalado aparte | Detener ese servicio o cambiar el puerto de XAMPP y `DB_PORT` |

## 6.12 Mantenimiento

**Copia de seguridad**

```bash
# Base de datos
C:\xampp\mysql\bin\mysqldump.exe -u root classroom_db > respaldo.sql

# Archivos subidos: copiar la carpeta de uploads del backend
```

**Restauración**

```bash
C:\xampp\mysql\bin\mysql.exe -u root classroom_db < respaldo.sql
```

**Añadir una función nueva** — el orden que respeta la arquitectura:

1. SQL: nueva migración idempotente en `database/migrations/`.
2. Tipos: `backend/src/types/models.ts` y `frontend/src/types/models.ts`.
3. Repositorio: la consulta, con parámetros y lista blanca de columnas.
4. Servicio: la regla de negocio y la decisión de permiso.
5. Controlador: leer la petición y devolver la respuesta.
6. Validador: el esquema Zod.
7. Ruta: la URL con sus middlewares.
8. Servicio del frontend: la llamada HTTP.
9. Componente: el nivel atómico más bajo que sirva.
10. Prueba E2E que verifique el flujo.
11. `npm run typecheck && npm run lint && npm run test:e2e`.

---

# 7. Manual de usuario

## 7.1 Ingresar al sistema

1. Abrir el navegador en <http://localhost:5173>.
2. Escribir el correo y la contraseña.
3. Pulsar **Entrar**.

Quien no tenga cuenta pulsa **Crear cuenta** y elige su rol (estudiante,
docente o acudiente). Las cuentas de administrador solo las crea otro
administrador.

En la pantalla de ingreso, el botón de sol/luna de la esquina permite cambiar el
tema antes incluso de iniciar sesión.

Si aparece una franja indicando que no hay conexión con el servidor, es que la
aplicación o MySQL no están en marcha; consultar §6.11.

## 7.2 La pantalla principal

Tres zonas:

- **Barra superior** — botón del menú, nombre del sistema, campana de
  notificaciones con el contador de no leídas, botón de tema y avatar (que abre
  *Mi perfil*, *Ajustes*, *Administración* si corresponde, y *Cerrar sesión*).
- **Menú lateral** — Inicio, Calendario, los módulos propios del rol, las clases
  agrupadas en *Clases impartidas* y *Clases inscritas*, *Clases archivadas*,
  *Mi perfil* y *Ajustes*. En pantallas pequeñas se abre superpuesto y se cierra
  al tocar fuera.
- **Contenido** — las tarjetas de las clases, cada una con su color o su imagen
  de encabezado.

## 7.3 Manual del docente

### Crear una clase

1. En *Inicio*, pulsar **Añadir clase → Crear clase**.
2. Escribir el nombre (obligatorio) y, si se desea, sección, materia y aula.
3. Pulsar **Crear**.

La clase aparece en *Clases impartidas* con un código de 8 caracteres visible en
el encabezado. Ese código es el que se entrega a los estudiantes.

### Personalizar el encabezado

Dentro de la clase, **Ajustes de la clase → Personalizar**. Tres opciones:

- **Color** — elegir uno de la paleta.
- **Galería** — elegir una de las imágenes incluidas.
- **Subir imagen** — cargar una propia (PNG, JPG, WEBP o SVG, hasta 4 MB).

El cambio se ve de inmediato y queda guardado; no hace falta recargar.

### Publicar un anuncio

En la pestaña **Tablón**, escribir en *Comparte algo con tu clase* y pulsar
**Publicar**. Aparece en el tablón de todos los integrantes y genera su
notificación.

### Crear trabajo

En la pestaña **Trabajo de clase**, pulsar **Crear** y elegir:

| Opción | Para qué |
|---|---|
| **Tarea** | Trabajo que el estudiante entrega, con puntaje y fecha |
| **Tarea de cuestionario** | Igual que la tarea, marcada como cuestionario |
| **Pregunta** | El estudiante responde por escrito |
| **Material** | Solo lectura, sin entrega ni nota |
| **Reutilizar publicación** | Copiar un trabajo de otra clase propia |
| **Tema** | Crear una unidad para agrupar el trabajo |

En el formulario: título (obligatorio), instrucciones, puntaje máximo, fecha y
hora de entrega, y tema. Puntaje y fecha pueden dejarse vacíos.

> Al pulsar **Publicar** el trabajo queda visible para la clase de inmediato y
> se envía la notificación. Si prefieres prepararlo con calma, publícalo y luego
> usa **Opciones → Volver a borrador**: desaparece de la vista del alumno hasta
> que vuelvas a publicarlo.

### Adjuntar material

Abrir el trabajo. En **Material de la tarea**:

- **Subir archivo** — PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP o imagen, hasta 15 MB.
- **Enlace** — pegar la URL y, si se desea, un título. Los enlaces de YouTube se reconocen solos.

Para quitar un adjunto, pulsar la **X** de su fila. Los archivos que se pueden
previsualizar (imagen, PDF, TXT, CSV) se abren en un visor al tocarlos.

### Publicar y retirar

El trabajo queda publicado desde que se crea: aparece en el tablón y en los
pendientes de los estudiantes, y todos reciben su notificación.

Para retirarlo, **Opciones → Volver a borrador**: deja de verse en la clase y no
vuelve a notificarse, pero **las entregas ya recibidas no se pierden**. Al
pulsar **Opciones → Publicar** reaparece.

Ese es el camino para preparar una tarea con calma: publicarla, volverla a
borrador, adjuntar el material y publicarla de nuevo cuando esté lista.

### Organizar por temas

**Crear → Tema** abre el gestor de temas, donde se puede:

- añadir un tema,
- renombrarlo,
- subirlo o bajarlo para cambiar el orden,
- eliminarlo — su trabajo no se borra, pasa a **Sin tema**.

### Calificar

1. Abrir el trabajo. Se muestra la lista de estudiantes con su estado:
   **Asignado**, **Entregado** o **Calificado**, y la marca de **Tarde** cuando
   corresponde.
2. Pulsar la fila del estudiante para desplegar su respuesta escrita y sus
   archivos.
3. Escribir la nota en la casilla.
4. **Guardar borrador** — la nota queda registrada y **el estudiante no la ve**.
   Útil para calificar todo el grupo y revisar antes de publicar.
5. **Devolver** — la nota pasa a definitiva y el estudiante recibe la
   notificación.
6. **Devolver todo** — cierra de una vez todas las notas en borrador del trabajo.

### Comentarios privados

En la fila desplegada del estudiante hay un hilo privado. Lo que se escriba ahí
solo lo ven ese estudiante y el docente de la clase; ningún compañero puede
acceder.

### La libreta de calificaciones

Pestaña **Calificaciones**: matriz de estudiantes por trabajo, con el promedio.
Solo entra el trabajo publicado y con puntaje.

**Exportar a CSV** descarga `libreta-clase-<id>.csv`, listo para abrir en Excel
con los acentos correctos.

### Integrantes

Pestaña **Integrantes**: docentes y estudiantes por separado. El propietario
puede retirar a un integrante desde el menú de su fila.

### Archivar o eliminar

**Ajustes de la clase → Archivar** guarda la clase fuera del camino sin borrar
nada; se recupera desde *Clases archivadas*. **Eliminar** borra la clase y todo
su contenido de forma **definitiva**.

## 7.4 Manual del estudiante

### Unirse a una clase

1. En *Inicio*, pulsar **Añadir clase → Unirse a una clase**.
2. Escribir el código de 8 caracteres que entregó el docente.
3. Pulsar **Unirse**.

Con un enlace de invitación (`/join/<código>`) el código llega ya escrito: basta
confirmar.

### Ver qué hay pendiente

Tres caminos:

- **Pendientes** en el menú lateral — todo lo que falta entregar, con la fecha más próxima primero.
- **Calendario** — las fechas de entrega del mes.
- Dentro de la clase, **Trabajo de clase** — todo el trabajo agrupado por tema.

### Entregar un trabajo

1. Abrir el trabajo. Aparecen las instrucciones, los adjuntos del docente y la fecha límite.
2. En **Tu trabajo**, pulsar **Subir archivo** y elegir el documento (hasta 15 MB). Se pueden subir varios.
3. Si el trabajo pide una respuesta escrita, escribirla en el campo correspondiente.
4. Pulsar **Entregar**.

El estado cambia a **Entregado**. Si la entrega ocurre después de la fecha
límite, queda marcada como **Tarde** automáticamente.

> Solo se pueden adjuntar archivos a la **propia entrega**. El material de la
> tarea es del docente.

### Corregir una entrega

Mientras el docente no la haya devuelto: **Retirar la entrega**, cambiar los
archivos y volver a **Entregar**.

### Ver la calificación

Cuando el docente devuelve la nota, llega una notificación y la nota aparece en
el trabajo. Antes de eso no hay nada que ver: la nota en borrador del docente es
invisible para el estudiante.

Las notas de una clase, con su promedio, están en la pestaña
**Calificaciones**.

### Preguntar

- **Comentario de clase** — en el tablón o bajo el trabajo. Lo ve toda la clase.
- **Comentario privado** — en el trabajo, sección *Comentarios privados*. Solo lo ven el estudiante y el docente.

## 7.5 Manual del administrador

### Panel

*Administración* en el menú lateral. Arriba, ocho métricas: usuarios, docentes,
estudiantes, inactivos, clases activas, archivadas, trabajos y entregas. Debajo,
dos pestañas: **Usuarios** y **Clases**.

### Crear un usuario

1. Pulsar **Crear usuario**.
2. Completar nombre, apellido, correo y contraseña inicial (mínimo 6 caracteres).
3. Elegir el rol: Administrador, Docente, Estudiante o Acudiente.
4. Pulsar **Crear**.

### Gestionar usuarios

Buscar por nombre o correo, y desde **Opciones** de cada fila:

| Acción | Efecto |
|---|---|
| **Cambiar a <rol>** | Cambia el rol global |
| **Acudientes** | *(solo estudiantes)* Gestiona los vínculos |
| **Restablecer contraseña** | Fija una contraseña nueva |
| **Desactivar / Activar** | Impide o permite el ingreso |

> El administrador no puede cambiarse el rol ni desactivarse a sí mismo, para
> que el sistema no se quede sin administradores.

### Vincular un acudiente

1. Buscar al **estudiante**.
2. **Opciones → Acudientes**.
3. Elegir el acudiente en el desplegable, escribir el parentesco (opcional) y pulsar **Vincular**.

Para deshacerlo, **Desvincular** en la fila del vínculo. Un estudiante puede
tener varios acudientes.

### Ver todas las clases

Pestaña **Clases**: todas las del sistema con su propietario, su sección y su
código. Al pulsar una se abre.

## 7.6 Manual del acudiente

1. Iniciar sesión con las credenciales que entregó la institución.
2. Pulsar **Seguimiento** en el menú lateral.

Se muestra, para cada estudiante vinculado:

- sus datos y sus clases,
- el **promedio general**,
- la lista de **calificaciones** por trabajo.

El acceso es de **solo lectura**: el acudiente no entra a las clases, no
comenta, no entrega y no puede abrir el módulo de administración. Si no aparece
ningún estudiante, es que el vínculo aún no ha sido creado por la
administración.

## 7.7 Perfil y ajustes

### Mi perfil

- Cambiar la **foto** (PNG, JPG, WEBP o SVG hasta 4 MB) o quitarla — sin foto se muestran las iniciales.
- Editar **nombre**, **biografía** y **teléfono**.
- **Cambiar la contraseña**, indicando la actual y la nueva (mínimo 6 caracteres).

### Ajustes

| Ajuste | Opciones |
|---|---|
| **Tema** | Claro · Oscuro · Del sistema |
| **Densidad** | Cómoda · Compacta (filas más juntas en las listas) |
| **Idioma** | Español · Inglés *(se guarda; los textos siguen en español)* |
| **Notificaciones** | Trabajo nuevo · Anuncios · Calificaciones |
| **Menú** | Mostrar las clases archivadas en el menú lateral |

El tema también se cambia con el botón de sol/luna de la barra superior. La
preferencia queda guardada en el servidor: al cerrar sesión y volver a entrar
—incluso desde otro navegador— el tema elegido se conserva.

### Notificaciones

La campana de la barra superior muestra el número de no leídas. Al abrirla se
listan los avisos de trabajo nuevo, anuncios, calificaciones y comentarios
privados. Cada aviso lleva al lugar que lo originó. **Marcar todas como leídas**
limpia el contador.

---

# 8. Anexos

## 8.1 Cuentas de prueba

Todas usan la contraseña **`123456`**.

| Correo | Rol | Qué se puede mostrar con esta cuenta |
|---|---|---|
| `admin@classroom.test` | Administrador | Métricas, gestión de usuarios, vínculos de acudiente, todas las clases |
| `gersson@classroom.test` | Docente | Clase de Programación con trabajo, entregas y notas por revisar |
| `carlos@classroom.test` | Docente | Otras dos clases propias |
| `jostin@classroom.test` | Estudiante | Pendientes, entregas, comentarios privados |
| `laura@classroom.test` | Estudiante | Una entrega ya calificada |
| `mateo@classroom.test` | Estudiante | Entrega pendiente de calificar |
| `rosa@classroom.test` | Acudiente | Seguimiento de Jostin Gómez |

## 8.2 Datos de prueba cargados

| Entidad | Cantidad |
|---|---|
| Roles | 4 |
| Usuarios | 7 |
| Clases | 3 |
| Inscripciones | 9 |
| Temas | 3 |
| Trabajo en clase | 5 |
| Entregas | 4 |
| Vínculos de acudiente | 1 (Rosa Gómez → Jostin Gómez) |

## 8.3 Glosario

| Término | Significado en este sistema |
|---|---|
| **Clase** | Curso o salón. Tabla `courses`. |
| **Código de clase** | Cadena única de 8 caracteres para inscribirse. |
| **Tablón** | Muro cronológico de anuncios y trabajo publicado. |
| **Trabajo en clase** | Conjunto de tareas, material, preguntas y cuestionarios. |
| **Tema** | Unidad que agrupa el trabajo de una clase. |
| **Borrador (trabajo)** | Trabajo creado pero no publicado; invisible al estudiante. |
| **Entrega** | Registro del trabajo enviado por un estudiante. Tabla `submissions`. |
| **Nota en borrador** | Calificación guardada por el docente y no visible para el estudiante. |
| **Devolver** | Publicar la calificación al estudiante. |
| **Tarde** | Entrega posterior a la fecha límite; lo determina el servidor. |
| **Libreta** | Matriz alumno × trabajo con las notas y el promedio. |
| **Acudiente** | Adulto responsable con acceso de solo lectura al progreso de un estudiante. |
| **Diseño atómico** | Organización de la interfaz en átomos, moléculas, organismos y plantillas. |
| **Token de diseño** | Variable CSS que define un color o una medida, centralizada en `theme.css`. |
| **Migración idempotente** | Script SQL que puede ejecutarse varias veces sin efectos adicionales. |
| **E2E** | Prueba de extremo a extremo: navegador real contra API y base de datos reales. |

## 8.4 Estado de verificación

| Comprobación | Comando | Resultado |
|---|---|---|
| Tipado | `npm run typecheck` | Sin errores |
| Estilo | `npm run lint` | Sin advertencias |
| Compilación | `npm run build` | Correcta |
| Pruebas E2E | `npm run test:e2e` | 38 de 38 en verde |

## 8.5 Anexo de capturas

El anexo visual con las capturas de cada pantalla del sistema se genera
automáticamente:

```bash
npm run dev                    # en una terminal
node scripts/capturas.mjs      # en otra
```

Produce `docs/Anexo-Capturas.pdf` y las imágenes individuales en
`docs/capturas/`. Cada captura se toma iniciando sesión con el rol
correspondiente, de modo que las pantallas por rol se ven tal como las ve ese
usuario.
