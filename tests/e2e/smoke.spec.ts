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

const openCourse = async (page: Page) => {
  await page.getByRole('link', { name: /2026_Tecnica/ }).first().click()
  await expect(page.getByRole('link', { name: 'Tablon' })).toBeVisible()
}

test('el docente ve sus clases y el tablon de novedades', async ({ page }) => {
  await login(page, 'gersson@classroom.test')

  await expect(page.getByRole('heading', { name: /2026_Tecnica/ })).toBeVisible()
  await openCourse(page)

  await expect(page.getByText('Codigo de clase')).toBeVisible()
  await expect(page.getByText('Proximas entregas')).toBeVisible()
  await expect(
    page.getByRole('link', { name: /publico una tarea: Actividad 3 CRUD/ }),
  ).toBeVisible()
})

test('el menu de la card de clase ofrece las acciones del docente', async ({ page }) => {
  await login(page, 'gersson@classroom.test')

  await page.getByRole('button', { name: /Opciones de 2026_Tecnica/ }).click()
  const menu = page.getByRole('menu')

  await expect(menu.getByRole('menuitem', { name: 'Copiar enlace de invitacion' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Personalizar' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Copiar', exact: true })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Archivar' })).toBeVisible()

  // Escape cierra el menu.
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
})

test('el docente edita los datos de la clase desde Personalizar', async ({ page }) => {
  await login(page, 'gersson@classroom.test')
  await openCourse(page)

  await page.getByRole('button', { name: 'Personalizar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Personalizar clase' })
  await expect(dialog).toBeVisible()

  await dialog.getByRole('button', { name: 'Datos de la clase' }).click()
  await dialog.getByLabel('Sala').fill('Sala 9')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Sala 9')).toBeVisible()
})

test('el docente abre la libreta de calificaciones', async ({ page }) => {
  await login(page, 'gersson@classroom.test')
  await openCourse(page)
  await page.getByRole('link', { name: 'Calificaciones' }).click()

  await expect(page.getByRole('columnheader', { name: 'Alumno' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Laura Pineda' })).toBeVisible()
})

test('el docente ve las entregas pendientes de revision', async ({ page }) => {
  await login(page, 'gersson@classroom.test')

  await expect(page.getByText(/Jostin Gomez entrego Actividad 3 CRUD/)).toBeVisible()
  await page.getByRole('link', { name: 'Pendientes de revision' }).click()

  await expect(page.getByRole('heading', { name: 'Pendientes de revision' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Actividad 3 CRUD/ })).toBeVisible()
})

test('el estudiante ve pendientes y el detalle de una tarea', async ({ page }) => {
  await login(page, 'jostin@classroom.test')

  await expect(page.getByText('Pronto se entregara')).toBeVisible()
  await page.getByRole('link', { name: 'Ver lista de tareas pendientes' }).click()

  await expect(page.getByRole('heading', { name: 'Pendientes' })).toBeVisible()
  await page.getByRole('link', { name: /Quiz: Express/ }).click()

  await expect(page.getByRole('heading', { name: /Quiz: Express/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entregar' })).toBeVisible()
})

test('el estudiante no ve las opciones de docente', async ({ page }) => {
  await login(page, 'jostin@classroom.test')

  // En su card solo puede copiar el enlace o anular su inscripcion.
  await page.getByRole('button', { name: /Opciones de 2026_Tecnica/ }).click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem', { name: 'Anular inscripcion' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Archivar' })).toHaveCount(0)
  await expect(menu.getByRole('menuitem', { name: 'Editar' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await openCourse(page)
  await expect(page.getByRole('link', { name: 'Trabajo de clase' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Calificaciones' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ajustes de la clase' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Personalizar' })).toHaveCount(0)
})
