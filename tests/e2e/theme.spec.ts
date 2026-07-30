import { expect, test, type Page } from '@playwright/test'

const login = async (page: Page, email: string) => {
  await page.context().clearCookies()
  await page.goto('/login')
  await page.getByLabel('Correo electronico').fill(email)
  await page.getByLabel('Contrasena').fill('123456')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Clases' })).toBeVisible()
}

const html = (page: Page) => page.locator('html')

/** Deja al usuario en tema claro para no arrastrar estado entre pruebas. */
const resetToLight = async (page: Page) => {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Claro', exact: true }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
}

test('el boton de la barra superior alterna claro y oscuro', async ({ page }) => {
  await login(page, 'mateo@classroom.test')
  await resetToLight(page)

  await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  // El boton cambia de significado.
  await page.getByRole('button', { name: 'Cambiar a modo claro' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
})

test('el modo oscuro sobrevive a cerrar sesion y volver a entrar', async ({ page }) => {
  // El estudiante lo activa.
  await login(page, 'mateo@classroom.test')
  await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  // Cierra sesion de verdad, desde el menu de la cuenta.
  await page.getByRole('button', { name: /Cuenta de Mateo/ }).click()
  await page.getByRole('menuitem', { name: 'Cerrar sesion' }).click()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()

  // Otro usuario entra en el mismo navegador: manda SU preferencia, no la de Mateo.
  await login(page, 'laura@classroom.test')
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Claro', exact: true }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')

  // Mateo vuelve: su modo oscuro sigue guardado en la base de datos.
  await login(page, 'mateo@classroom.test')
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  await resetToLight(page)
})

test('la preferencia se guarda en la base de datos, no solo en el navegador', async ({
  page,
  context,
}) => {
  await login(page, 'mateo@classroom.test')
  await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  // Navegador limpio: sin cookies y sin localStorage.
  await context.clearCookies()
  const limpio = await context.browser()!.newContext()
  const otra = await limpio.newPage()
  await otra.goto('/login')
  await otra.getByLabel('Correo electronico').fill('mateo@classroom.test')
  await otra.getByLabel('Contrasena').fill('123456')
  await otra.getByRole('button', { name: 'Entrar' }).click()
  await expect(otra.getByRole('heading', { name: 'Clases' })).toBeVisible()

  await expect(otra.locator('html')).toHaveAttribute('data-theme', 'dark')
  await limpio.close()

  await login(page, 'mateo@classroom.test')
  await resetToLight(page)
})

test('las tres opciones de Ajustes funcionan y se reflejan al recargar', async ({ page }) => {
  await login(page, 'mateo@classroom.test')
  await page.goto('/settings')

  await page.getByRole('button', { name: 'Oscuro', exact: true }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Del sistema', exact: true }).click()
  // El navegador de pruebas usa el esquema claro por defecto.
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  await expect(page.getByText(/Sigue tu sistema operativo/)).toBeVisible()

  await resetToLight(page)
})

test('en oscuro el texto y las superficies cambian de verdad', async ({ page }) => {
  await login(page, 'mateo@classroom.test')
  await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  // El fondo del documento deja de ser claro y el texto se aclara.
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 23, 26)')
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(232, 234, 237)')

  await resetToLight(page)
})
