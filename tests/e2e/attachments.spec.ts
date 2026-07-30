import { expect, test, type Page } from '@playwright/test'

const login = async (page: Page, email: string) => {
  // Cierra cualquier sesion previa: /login redirige al inicio si ya hay una.
  await page.context().clearCookies()
  await page.goto('/login')
  await page.getByLabel('Correo electronico').fill(email)
  await page.getByLabel('Contrasena').fill('123456')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Clases' })).toBeVisible()
}

/** Un PDF minimo, suficiente para que el navegador lo mande como application/pdf. */
const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n% archivo de prueba\n'),
})

test('el docente adjunta un documento a la tarea y lo puede quitar', async ({ page }) => {
  await login(page, 'gersson@classroom.test')
  await page.goto('/courses/1/work/1')

  const material = page.getByText('Material de la tarea').or(page.getByText('Adjuntar material'))
  await expect(material).toBeVisible()

  const nombre = `temario-e2e-${Date.now()}.pdf`
  await page.locator('input[type="file"]').first().setInputFiles(pdf(nombre))

  // Aparece en la lista y sobrevive a un recargado (esta en la base de datos).
  await expect(page.getByText(nombre)).toBeVisible()
  await page.reload()
  await expect(page.getByText(nombre)).toBeVisible()

  // Un PDF se puede previsualizar: al tocarlo se abre el visor, y ahi esta
  // el enlace de descarga con su nombre original.
  await page.getByRole('button', { name: `${nombre} 29 B - toca para ver` }).click()
  const visor = page.getByRole('dialog', { name: `Vista previa de ${nombre}` })
  await expect(visor).toBeVisible()

  const descarga = visor.getByRole('link', { name: 'Descargar' })
  await expect(descarga).toHaveAttribute('href', /^\/api\/uploads\//)
  await expect(descarga).toHaveAttribute('download', nombre)

  await visor.getByRole('button', { name: 'Cerrar vista previa' }).click()
  await expect(visor).toHaveCount(0)

  await page.getByRole('button', { name: `Quitar ${nombre}` }).click()
  await expect(page.getByText(nombre)).toHaveCount(0)
})

test('el docente adjunta un enlace de YouTube y se detecta el tipo', async ({ page }) => {
  await login(page, 'gersson@classroom.test')
  await page.goto('/courses/1/work/1')

  await page.getByRole('button', { name: 'Enlace' }).click()
  await page.getByPlaceholder('https://...').fill('https://www.youtube.com/watch?v=e2e-demo')
  await page.getByPlaceholder('Titulo (opcional)').fill('Video de apoyo E2E')
  await page.getByRole('button', { name: 'Anadir enlace' }).click()

  await expect(page.getByText('Video de apoyo E2E')).toBeVisible()
  await expect(page.getByText('YouTube').first()).toBeVisible()

  await page.getByRole('button', { name: 'Quitar Video de apoyo E2E' }).click()
  await expect(page.getByText('Video de apoyo E2E')).toHaveCount(0)
})

test('el estudiante adjunta su trabajo y el docente lo ve', async ({ page }) => {
  const nombre = `entrega-e2e-${Date.now()}.pdf`

  await login(page, 'mateo@classroom.test')
  await page.goto('/courses/1/work/3')

  await expect(page.getByText('Tu trabajo', { exact: true })).toBeVisible()
  await page.locator('input[type="file"]').first().setInputFiles(pdf(nombre))
  await expect(page.getByText(nombre)).toBeVisible()

  // El docente ve el archivo en la fila del alumno.
  await login(page, 'gersson@classroom.test')
  await page.goto('/courses/1/work/3')
  await expect(page.getByText(/Mateo Suarez/)).toBeVisible()
  await expect(page.getByRole('button', { name: `${nombre} 29 B - toca para ver` })).toBeVisible()
})

test('el estudiante no puede adjuntar a la tarea, solo a su entrega', async ({ page }) => {
  await login(page, 'jostin@classroom.test')
  await page.goto('/courses/1/work/1')

  // No hay boton de enlace: esa seccion es solo del docente.
  await expect(page.getByRole('button', { name: 'Enlace' })).toHaveCount(0)
  // Pero si el de su propio trabajo.
  await expect(page.getByText('Tu trabajo', { exact: true })).toBeVisible()
})

test('los estados vacios muestran la ilustracion correcta', async ({ page }) => {
  await login(page, 'jostin@classroom.test')

  // Sin clases archivadas -> ilustracion del gato.
  await page.goto('/archived')
  await expect(page.getByText('No tienes clases archivadas')).toBeVisible()
  const archive = page.locator('[data-illustration="archive"]')
  await expect(archive).toBeVisible()
  // La imagen cargo de verdad, no es un enlace roto (cat.jpeg mide 474x391).
  await expect(archive).toHaveJSProperty('naturalWidth', 474)

  // Pagina inexistente -> ilustracion de la ardilla.
  await page.goto('/ruta-que-no-existe')
  await expect(page.getByText('Pagina no encontrada')).toBeVisible()
  await expect(page.locator('[data-illustration="notFound"]')).toBeVisible()
})

test('el trabajo de clase vacio usa la ilustracion del lobo', async ({ page }) => {
  // Archivar pide confirmacion; Playwright cancela los dialogos si no se aceptan.
  page.on('dialog', (dialog) => void dialog.accept())

  await login(page, 'gersson@classroom.test')

  // Clase recien creada: no tiene trabajo todavia.
  await page.goto('/')
  await page.getByRole('button', { name: 'Anadir clase' }).click()
  await page.getByRole('menuitem', { name: 'Crear clase' }).click()

  const nombre = `Clase E2E vacia ${Date.now()}`
  const dialog = page.getByRole('dialog', { name: 'Crear clase' })
  await dialog.getByLabel('Nombre de la clase (obligatorio)').fill(nombre)
  await dialog.getByRole('button', { name: 'Crear' }).click()
  await expect(dialog).toHaveCount(0)

  await page.getByRole('link', { name: new RegExp(nombre) }).first().click()
  await page.getByRole('link', { name: 'Trabajo de clase' }).click()

  await expect(page.getByText('Aqui podras asignar trabajos')).toBeVisible()
  await expect(page.locator('[data-illustration="classwork"]')).toBeVisible()

  // El tablon vacio usa la de la ardilla.
  await page.getByRole('link', { name: 'Tablon' }).click()
  await expect(page.locator('[data-illustration="stream"]')).toBeVisible()

  // Limpieza: la clase era solo para esta prueba. Hay que archivarla primero,
  // porque "Eliminar" solo se ofrece sobre clases archivadas.
  await page.getByRole('button', { name: 'Ajustes de la clase' }).click()
  await page.getByRole('menuitem', { name: 'Archivar' }).click()

  await page.goto('/archived')
  await page.getByRole('button', { name: `Opciones de ${nombre}` }).click()
  await page.getByRole('menuitem', { name: 'Eliminar' }).click()
  await expect(page.getByRole('link', { name: new RegExp(nombre) })).toHaveCount(0)
})
