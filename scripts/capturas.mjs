/**
 * Genera el anexo visual de la documentacion.
 *
 * Recorre el sistema con un navegador real: inicia sesion con cada rol, abre
 * cada pantalla, la fotografia y arma un PDF con las imagenes ordenadas y
 * comentadas.
 *
 * Uso:
 *   npm run dev            (en una terminal, con MySQL de XAMPP iniciado)
 *   npm run docs:capturas  (en otra)
 *
 * Salida:
 *   docs/capturas/NN-nombre.png   una imagen por pantalla
 *   docs/Anexo-Capturas.pdf       el anexo listo para imprimir o entregar
 */
import { chromium } from '@playwright/test'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:5173'
const PASSWORD = '123456'
const DOCS = path.resolve('docs')
const SHOTS = path.join(DOCS, 'capturas')

/** 1440x900 a escala 2: nitidez suficiente para imprimir. */
const VIEWPORT = { width: 1440, height: 900 }
const SCALE = 2

// ---------------------------------------------------------------------------
// Guion de capturas
// ---------------------------------------------------------------------------
// Cada seccion se toma con una sesion limpia. `act` permite abrir un menu o un
// dialogo antes de disparar; `viewportOnly` evita la captura de pagina completa
// cuando lo interesante es el dialogo y no el fondo.

/** Espera a que un dialogo este visible antes de fotografiarlo. */
const dialog = (page, name) => page.getByRole('dialog', { name }).waitFor({ state: 'visible' })

const SECTIONS = [
  {
    title: '1. Acceso al sistema',
    account: null,
    intro:
      'Pantallas publicas. El boton de sol/luna permite cambiar el tema antes de iniciar sesion.',
    shots: [
      {
        slug: 'inicio-sesion',
        title: 'Inicio de sesion',
        caption:
          'Formulario de acceso. La contrasena viaja al servidor y se compara contra un hash bcrypt; nunca se almacena en claro.',
        goto: '/login',
      },
      {
        slug: 'inicio-sesion-oscuro',
        title: 'Inicio de sesion en tema oscuro',
        caption:
          'El mismo formulario con el tema oscuro aplicado. La paleta oscura es una redefinicion de los tokens de color: ningun componente contiene logica de tema.',
        goto: '/login',
        act: async (page) => {
          await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click()
          await page.locator('html[data-theme="dark"]').waitFor()
        },
        after: async (page) => {
          await page.getByRole('button', { name: 'Cambiar a modo claro' }).click()
          await page.locator('html[data-theme="light"]').waitFor()
        },
      },
      {
        slug: 'registro',
        title: 'Crear cuenta',
        caption:
          'Registro publico. El rol se elige entre estudiante, docente y acudiente; las cuentas de administrador solo las crea otro administrador.',
        goto: '/register',
      },
    ],
  },

  {
    title: '2. Modulo del docente',
    account: 'gersson@classroom.test',
    intro:
      'Sesion iniciada como Gersson Rubio (rol docente), propietario de la clase de Programacion.',
    shots: [
      {
        slug: 'docente-inicio',
        title: 'Inicio — mis clases',
        caption:
          'Tarjetas de las clases del docente. El menu lateral separa las clases impartidas de las clases en las que esta inscrito como alumno.',
        goto: '/',
      },
      {
        slug: 'docente-tablon',
        title: 'Tablon de novedades',
        caption:
          'Encabezado personalizado de la clase, codigo para unirse, anuncios y trabajo publicado en orden cronologico, con sus hilos de comentarios.',
        goto: '/courses/1',
      },
      {
        slug: 'docente-personalizar',
        title: 'Personalizar la clase',
        caption:
          'Tres modos de encabezado: color plano, imagen de la galeria incluida o imagen propia. El cambio se refleja al instante y se guarda en la base de datos.',
        goto: '/courses/1',
        viewportOnly: true,
        act: async (page) => {
          await page.getByRole('button', { name: 'Ajustes de la clase' }).click()
          await page.getByRole('menuitem', { name: 'Personalizar' }).click()
          await dialog(page, /Personalizar/)
        },
      },
      {
        slug: 'docente-trabajo-de-clase',
        title: 'Trabajo de clase',
        caption:
          'Tareas, material, preguntas y cuestionarios agrupados por tema. Los borradores llevan su distintivo y solo los ve el docente.',
        goto: '/courses/1/work',
      },
      {
        slug: 'docente-menu-crear',
        title: 'Menu Crear',
        caption:
          'Las seis opciones de creacion: tarea, tarea de cuestionario, pregunta, material, reutilizar publicacion y tema.',
        goto: '/courses/1/work',
        viewportOnly: true,
        act: async (page) => {
          await page.getByRole('button', { name: 'Crear', exact: true }).click()
          await page.getByRole('menu').waitFor({ state: 'visible' })
        },
      },
      {
        slug: 'docente-temas',
        title: 'Gestion de temas',
        caption:
          'Crear, renombrar, reordenar y eliminar temas. Al eliminar un tema su trabajo no se borra: pasa a «Sin tema» (ON DELETE SET NULL).',
        goto: '/courses/1/work',
        viewportOnly: true,
        act: async (page) => {
          await page.getByRole('button', { name: 'Crear', exact: true }).click()
          await page.getByRole('menuitem', { name: 'Tema', exact: true }).click()
          await dialog(page, 'Temas de la clase')
        },
      },
      {
        slug: 'docente-calificar',
        title: 'Calificar un trabajo',
        caption:
          'Lista de estudiantes con su estado. La nota se guarda primero como borrador —invisible para el alumno— y se publica al pulsar Devolver. «Devolver todo» cierra el trabajo completo.',
        goto: '/courses/1/work/1',
      },
      {
        slug: 'docente-entrega-desplegada',
        title: 'Entrega desplegada y comentario privado',
        caption:
          'Al desplegar la fila de un alumno aparecen su respuesta escrita, sus archivos y el hilo privado. Un tercer estudiante que solicite ese hilo recibe 403 desde el servidor.',
        goto: '/courses/1/work/1',
        act: async (page) => {
          const fila = page.getByRole('button', { name: /Ver el trabajo de/ }).first()
          if (await fila.count()) await fila.click()
        },
      },
      {
        slug: 'docente-libreta',
        title: 'Libreta de calificaciones',
        caption:
          'Matriz alumno x trabajo alimentada por la vista v_gradebook, que excluye el material sin puntaje para no distorsionar el promedio. Exportable a CSV con BOM UTF-8.',
        goto: '/courses/1/grades',
      },
      {
        slug: 'docente-integrantes',
        title: 'Integrantes',
        caption:
          'Docentes y estudiantes por separado. El propietario puede retirar a un integrante desde el menu de su fila.',
        goto: '/courses/1/people',
      },
      {
        slug: 'docente-por-revisar',
        title: 'Pendientes de revision',
        caption:
          'Entregas recibidas y aun sin calificar, de todas las clases del docente. Se apoya en el indice idx_sub_state_date.',
        goto: '/to-review',
      },
      {
        slug: 'docente-inicio-oscuro',
        title: 'Tema oscuro aplicado',
        caption:
          'La preferencia se guarda en user_settings.theme, por lo que acompana al usuario entre sesiones y entre navegadores.',
        goto: '/settings',
        act: async (page) => {
          await page.getByRole('button', { name: 'Oscuro', exact: true }).click()
          await page.locator('html[data-theme="dark"]').waitFor()
          await page.goto(`${BASE}/`)
          await page.getByRole('heading', { name: 'Clases' }).waitFor()
        },
        after: async (page) => {
          await page.goto(`${BASE}/settings`)
          await page.getByRole('button', { name: 'Claro', exact: true }).click()
          await page.locator('html[data-theme="light"]').waitFor()
        },
      },
    ],
  },

  {
    title: '3. Modulo del estudiante',
    account: 'jostin@classroom.test',
    intro: 'Sesion iniciada como Jostin Gomez (rol estudiante), inscrito en dos clases.',
    shots: [
      {
        slug: 'alumno-inicio',
        title: 'Inicio del estudiante',
        caption:
          'Las mismas tarjetas de clase, pero el menu lateral ofrece «Pendientes» en lugar de «Pendientes de revision»: los modulos dependen del rol.',
        goto: '/',
      },
      {
        slug: 'alumno-pendientes',
        title: 'Pendientes',
        caption:
          'Trabajo sin entregar, con la fecha mas proxima primero. Se apoya en la vista v_pending_work.',
        goto: '/todo',
      },
      {
        slug: 'alumno-detalle-trabajo',
        title: 'Detalle del trabajo y entrega',
        caption:
          'Instrucciones, material del docente y el bloque «Tu trabajo». El estudiante solo puede adjuntar a su propia entrega, nunca al material de la tarea.',
        goto: '/courses/1/work/1',
      },
      {
        slug: 'alumno-calificaciones',
        title: 'Mis calificaciones',
        caption:
          'Notas devueltas y promedio de la clase. Las notas en borrador del docente no aparecen aqui hasta ser devueltas.',
        goto: '/courses/1/grades',
      },
      {
        slug: 'alumno-notificaciones',
        title: 'Notificaciones',
        caption:
          'Avisos de trabajo nuevo, anuncios, calificaciones y comentarios privados. El contador de no leidas vive en la barra superior.',
        goto: '/notifications',
      },
      {
        slug: 'alumno-calendario',
        title: 'Calendario',
        caption:
          'Vista mensual de las fechas de entrega, construida sobre el indice idx_cw_course_due.',
        goto: '/calendar',
      },
      {
        slug: 'alumno-perfil',
        title: 'Mi perfil',
        caption:
          'Foto, biografia, telefono y cambio de contrasena. Sin foto se muestran las iniciales sobre un color derivado del nombre.',
        goto: '/profile',
      },
      {
        slug: 'alumno-ajustes',
        title: 'Ajustes',
        caption:
          'Tema, densidad, idioma, notificaciones por tipo y visibilidad de las clases archivadas. Todo se guarda en user_settings.',
        goto: '/settings',
      },
      {
        slug: 'alumno-vacio',
        title: 'Estado vacio ilustrado',
        caption:
          'Cuando no hay nada que mostrar, la pantalla lo explica con una ilustracion en lugar de dejar el area en blanco.',
        goto: '/archived',
      },
    ],
  },

  {
    title: '4. Modulo de administracion',
    account: 'admin@classroom.test',
    intro: 'Sesion iniciada como Ana Admin (rol administrador).',
    shots: [
      {
        slug: 'admin-panel',
        title: 'Panel de administracion',
        caption:
          'Ocho metricas globales y la gestion de usuarios con busqueda por nombre o correo.',
        goto: '/admin',
      },
      {
        slug: 'admin-opciones-usuario',
        title: 'Acciones sobre un usuario',
        caption:
          'Cambiar rol, gestionar acudientes, restablecer contrasena y activar o desactivar. El administrador no puede cambiarse el rol ni desactivarse a si mismo.',
        goto: '/admin',
        viewportOnly: true,
        act: async (page) => {
          await page.getByRole('button', { name: /Opciones de Jostin/ }).click()
          await page.getByRole('menu').waitFor({ state: 'visible' })
        },
      },
      {
        slug: 'admin-crear-usuario',
        title: 'Crear usuario',
        caption:
          'Alta de cuentas con cualquiera de los cuatro roles. La contrasena inicial se cifra con bcrypt antes de guardarse.',
        goto: '/admin',
        viewportOnly: true,
        act: async (page) => {
          await page.getByRole('button', { name: 'Crear usuario' }).click()
          await dialog(page, /Crear usuario/)
        },
      },
      {
        slug: 'admin-acudientes',
        title: 'Vincular un acudiente',
        caption:
          'Vinculo acudiente - estudiante con parentesco informativo. Se materializa en la tabla guardian_students, con restriccion UNIQUE (guardian_id, student_id) para evitar duplicados. Un estudiante puede tener varios acudientes.',
        goto: '/admin',
        viewportOnly: true,
        act: async (page) => {
          await page.getByRole('button', { name: /Opciones de Jostin/ }).click()
          await page.getByRole('menuitem', { name: 'Acudientes' }).click()
          await dialog(page, /Acudientes de Jostin/)
        },
      },
      {
        slug: 'admin-clases',
        title: 'Todas las clases del sistema',
        caption:
          'Listado global con propietario, seccion y codigo de cada clase. Solo el administrador ve las clases que no le pertenecen.',
        goto: '/admin',
        act: async (page) => {
          await page.getByRole('button', { name: 'Clases', exact: true }).click()
        },
      },
    ],
  },

  {
    title: '5. Modulo del acudiente',
    account: 'rosa@classroom.test',
    intro:
      'Sesion iniciada como Rosa Gomez (rol acudiente), vinculada al estudiante Jostin Gomez.',
    shots: [
      {
        slug: 'acudiente-seguimiento',
        title: 'Seguimiento del estudiante',
        caption:
          'Clases, promedio general y calificaciones del estudiante a su cargo. El acceso es de solo lectura: el acudiente no entra a las clases ni al modulo de administracion, y el servidor lo impide aunque se fuerce la URL.',
        goto: '/seguimiento',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const log = (message) => console.log(message)

/** Aborta con un mensaje util si la aplicacion no esta levantada. */
const requireAppRunning = async () => {
  const targets = [
    [BASE, 'el frontend (npm run dev:web)'],
    [`${BASE}/api/health`, 'la API y MySQL (npm run dev:api + XAMPP)'],
  ]

  for (const [url, what] of targets) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      console.error(
        `\nNo responde ${url}\n` +
          `Falta ${what}.\n` +
          `Arranca la aplicacion con "npm run dev" y vuelve a ejecutar este script.\n` +
          `Detalle: ${error.message}\n`,
      )
      process.exit(1)
    }
  }
}

const login = async (page, email) => {
  await page.context().clearCookies()
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Correo electronico').fill(email)
  await page.getByLabel('Contrasena').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Cualquiera de los dos encabezados confirma que la sesion arranco.
  await page
    .getByRole('heading', { name: 'Clases' })
    .or(page.getByRole('heading', { name: 'Seguimiento' }))
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
}

/**
 * El tema es una preferencia real del usuario, y una cuenta que lo tenga en
 * oscuro haria salir su seccion entera en oscuro. Se normaliza a claro para las
 * capturas y se devuelve como estaba al terminar la seccion.
 */
const readTheme = async (page) => {
  const response = await page.request.get(`${BASE}/api/users/me/settings`)
  const body = await response.json()
  return body?.data?.theme ?? 'system'
}

const writeTheme = async (page, theme) => {
  await page.request.patch(`${BASE}/api/users/me/settings`, { data: { theme } })
}

/** Deja que terminen las peticiones y las transiciones antes de disparar. */
const settle = async (page) => {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(400)
}

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------------------------------------------------------------------------
// Captura
// ---------------------------------------------------------------------------

const capture = async (browser) => {
  await rm(SHOTS, { recursive: true, force: true })
  await mkdir(SHOTS, { recursive: true })

  const taken = []
  let index = 0

  for (const section of SECTIONS) {
    log(`\n${section.title}`)

    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
      locale: 'es-CO',
    })
    const page = await context.newPage()

    let originalTheme = null

    if (section.account) {
      try {
        await login(page, section.account)
        originalTheme = await readTheme(page)
        if (originalTheme !== 'light') await writeTheme(page, 'light')
      } catch (error) {
        console.error(`  ! no se pudo iniciar sesion como ${section.account}: ${error.message}`)
        await context.close()
        continue
      }
    }

    for (const shot of section.shots) {
      index += 1
      const file = `${String(index).padStart(2, '0')}-${shot.slug}.png`

      try {
        await page.goto(`${BASE}${shot.goto}`)
        await settle(page)
        if (shot.act) await shot.act(page)
        await settle(page)

        await page.screenshot({
          path: path.join(SHOTS, file),
          fullPage: !shot.viewportOnly,
        })

        if (shot.after) await shot.after(page)

        taken.push({ file, section: section.title, ...shot })
        log(`  ok  ${file}`)
      } catch (error) {
        console.error(`  !   ${file} — ${error.message.split('\n')[0]}`)
      }
    }

    // La preferencia del usuario vuelve a ser la que tenia antes de las capturas.
    if (originalTheme && originalTheme !== 'light') {
      await writeTheme(page, originalTheme).catch(() => {})
    }

    await context.close()
  }

  return taken
}

// ---------------------------------------------------------------------------
// Armado del PDF
// ---------------------------------------------------------------------------

const buildHtml = async (taken) => {
  const today = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
    new Date(Number(process.env.CAPTURAS_FECHA ?? Date.now())),
  )

  // Las imagenes se incrustan en base64: el PDF queda autocontenido.
  const pages = []
  let number = 0

  for (const shot of taken) {
    number += 1
    const bytes = await readFile(path.join(SHOTS, shot.file))
    pages.push(`
      <section class="hoja">
        <header>
          <span class="seccion">${escape(shot.section)}</span>
          <span class="folio">Figura ${number}</span>
        </header>
        <h2>${escape(shot.title)}</h2>
        <figure>
          <img src="data:image/png;base64,${bytes.toString('base64')}" alt="${escape(shot.title)}" />
          <figcaption>${escape(shot.caption)}</figcaption>
        </figure>
        <footer>${escape(shot.file)}</footer>
      </section>`)
  }

  const indice = taken
    .map((shot, i) => `<li><span>Figura ${i + 1}</span> ${escape(shot.title)}</li>`)
    .join('')

  const secciones = SECTIONS.map(
    (section) => `<li><strong>${escape(section.title)}</strong><br />${escape(section.intro)}</li>`,
  ).join('')

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Kiro Education — Anexo de capturas</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #1f2328;
    font-size: 11pt;
    line-height: 1.5;
  }
  .hoja {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    min-height: 247mm;
  }
  .hoja:last-child { page-break-after: auto; }

  /* Portada */
  .portada { justify-content: center; text-align: center; }
  .portada h1 { font-size: 30pt; margin: 0 0 4mm; letter-spacing: -0.5pt; }
  .portada .sub { font-size: 14pt; color: #5b6472; margin: 0 0 14mm; }
  .portada dl {
    display: grid; grid-template-columns: auto auto; gap: 2mm 6mm;
    justify-content: center; text-align: left; font-size: 10.5pt; margin: 0 0 14mm;
  }
  .portada dt { color: #6b7280; }
  .portada dd { margin: 0; font-weight: 600; }
  .portada .nota {
    max-width: 130mm; margin: 0 auto; font-size: 10pt; color: #5b6472;
    border-top: 0.4mm solid #e5e7eb; padding-top: 5mm;
  }

  /* Indice */
  h2 { font-size: 15pt; margin: 0 0 4mm; }
  .indice ol { padding-left: 0; list-style: none; margin: 0 0 8mm; }
  .indice ol li {
    display: flex; gap: 4mm; padding: 1.2mm 0;
    border-bottom: 0.2mm dotted #d1d5db;
  }
  .indice ol li span { color: #6b7280; min-width: 22mm; }
  .indice ul { padding-left: 5mm; margin: 0; }
  .indice ul li { margin-bottom: 3mm; font-size: 10pt; color: #374151; }

  /* Hojas de figura */
  .hoja header {
    display: flex; justify-content: space-between;
    font-size: 8.5pt; color: #6b7280; text-transform: uppercase;
    letter-spacing: 0.4pt; border-bottom: 0.3mm solid #e5e7eb;
    padding-bottom: 2mm; margin-bottom: 4mm;
  }
  figure { margin: 0; flex: 1; }
  figure img {
    width: 100%; height: auto; display: block;
    border: 0.3mm solid #d1d5db; border-radius: 1.5mm;
  }
  figcaption {
    margin-top: 4mm; font-size: 10pt; color: #374151;
    border-left: 1mm solid #c9a6b0; padding-left: 4mm;
  }
  .hoja footer {
    margin-top: 5mm; font-size: 8pt; color: #9ca3af;
    font-family: ui-monospace, Consolas, monospace;
  }
</style>
</head>
<body>

<section class="hoja portada">
  <h1>Kiro Education</h1>
  <p class="sub">Anexo de capturas del sistema</p>
  <dl>
    <dt>Documento</dt><dd>Anexo visual de la documentacion</dd>
    <dt>Sistema</dt><dd>Simulador academico tipo Google Classroom</dd>
    <dt>Figuras</dt><dd>${taken.length}</dd>
    <dt>Generado</dt><dd>${today}</dd>
  </dl>
  <p class="nota">
    Todas las capturas de este anexo se tomaron automaticamente sobre el sistema
    en ejecucion, iniciando sesion con la cuenta del rol correspondiente. Cada
    pantalla se muestra tal como la ve ese usuario, con los datos de prueba
    cargados por el script de siembra.
  </p>
</section>

<section class="hoja indice">
  <h2>Indice de figuras</h2>
  <ol>${indice}</ol>
  <h2>Recorrido por rol</h2>
  <ul>${secciones}</ul>
</section>

${pages.join('\n')}

</body>
</html>`
}

const buildPdf = async (browser, taken) => {
  const html = await buildHtml(taken)
  const htmlPath = path.join(DOCS, 'anexo-capturas.html')
  await writeFile(htmlPath, html, 'utf8')

  const context = await browser.newContext()
  const page = await context.newPage()
  // Se carga desde archivo para que el navegador no limite el tamano de la URL.
  await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`)
  await page.emulateMedia({ media: 'print' })

  const pdfPath = path.join(DOCS, 'Anexo-Capturas.pdf')
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '15mm', right: '15mm' },
  })

  await context.close()
  // El HTML llevaba las 30 imagenes en base64: no vale la pena conservarlo.
  await rm(htmlPath, { force: true })
  return pdfPath
}

// ---------------------------------------------------------------------------

const main = async () => {
  await requireAppRunning()
  await mkdir(DOCS, { recursive: true })

  const browser = await chromium.launch()
  try {
    const taken = await capture(browser)

    if (taken.length === 0) {
      console.error('\nNo se pudo tomar ninguna captura. Revisa los mensajes anteriores.')
      process.exit(1)
    }

    const pdfPath = await buildPdf(browser, taken)
    const files = (await readdir(SHOTS)).length

    log(`\n${taken.length} figuras · ${files} imagenes en docs/capturas/`)
    log(`PDF: ${path.relative(process.cwd(), pdfPath)}`)
    if (taken.length < SECTIONS.flatMap((s) => s.shots).length) {
      log('Aviso: alguna captura fallo; el PDF incluye solo las que salieron bien.')
    }
  } finally {
    await browser.close()
  }
}

await main()
