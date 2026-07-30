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

/** El banner de la pagina de la clase (el primero es el del encabezado). */
const courseBanner = (page: Page) => page.locator('[data-banner="course"]').first()

const openFirstCourse = async (page: Page) => {
  await page.getByRole('link', { name: /2026_Tecnica/ }).first().click()
  await expect(page.getByRole('link', { name: 'Tablon' })).toBeVisible()
}

test.describe('Personalizacion de la clase', () => {
  test('el color se aplica al banner sin recargar la pagina', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await openFirstCourse(page)
    await page.getByRole('button', { name: 'Personalizar' }).click()

    const dialog = page.getByRole('dialog', { name: 'Personalizar clase' })
    await dialog.getByRole('button', { name: 'Oliva' }).click()

    // El aviso confirma que ya se guardo, sin recargar.
    await expect(dialog.getByText('Los cambios se aplican al instante')).toBeVisible()
    await dialog.getByRole('button', { name: 'Listo' }).click()

    // El banner de la pagina refleja el color nuevo, sin recargar.
    await expect(courseBanner(page)).toHaveAttribute('data-theme-color', '#5F6B45')
    await expect(courseBanner(page)).toHaveAttribute('data-banner-kind', 'color')
  })

  test('la imagen de la galeria queda guardada tras recargar', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await openFirstCourse(page)
    await page.getByRole('button', { name: 'Personalizar' }).click()

    const dialog = page.getByRole('dialog', { name: 'Personalizar clase' })
    await dialog.getByRole('button', { name: 'Rejilla' }).click()
    await expect(dialog.getByText('Los cambios se aplican al instante')).toBeVisible()
    await dialog.getByRole('button', { name: 'Listo' }).click()

    await expect(courseBanner(page)).toHaveAttribute('data-banner-kind', 'gallery')

    // Persistio en la base de datos, no solo en el estado de React.
    await page.reload()
    await expect(courseBanner(page)).toHaveAttribute('data-banner-kind', 'gallery')
    await expect(courseBanner(page)).toHaveAttribute('style', /grid\.svg/)
  })
})

test.describe('Perfil', () => {
  test('el usuario edita su perfil y se refleja en la cabecera', async ({ page }) => {
    await login(page, 'laura@classroom.test')
    await page.goto('/profile')

    await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible()
    await page.getByLabel('Sobre mi').fill('Estudiante de decimo grado')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByText('Perfil actualizado')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Sobre mi')).toHaveValue('Estudiante de decimo grado')
  })

  test('rechaza el cambio de contrasena con la actual incorrecta', async ({ page }) => {
    await login(page, 'laura@classroom.test')
    await page.goto('/profile')

    await page.getByLabel('Contrasena actual').fill('noesesta')
    await page.getByLabel('Nueva contrasena').fill('otra123')
    await page.getByLabel('Confirmar').fill('otra123')
    await page.getByRole('button', { name: 'Actualizar contrasena' }).click()

    await expect(page.getByText('La contrasena actual no es correcta')).toBeVisible()
  })
})

test.describe('Ajustes', () => {
  test('la densidad se guarda y aplica en el documento', async ({ page }) => {
    await login(page, 'mateo@classroom.test')
    await page.goto('/settings')

    await page.getByRole('button', { name: 'Compacta' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')

    // Lo dejamos como estaba para no afectar a otras pruebas.
    await page.getByRole('button', { name: 'Comoda' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable')
  })

  test('los interruptores de notificaciones persisten', async ({ page }) => {
    await login(page, 'mateo@classroom.test')
    await page.goto('/settings')

    const toggle = page.getByRole('switch', { name: 'Calificaciones' })

    // Partimos del valor actual para que la prueba se pueda repetir.
    const before = await toggle.getAttribute('aria-checked')
    const after = before === 'true' ? 'false' : 'true'

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', after)

    await page.reload()
    await expect(page.getByRole('switch', { name: 'Calificaciones' })).toHaveAttribute(
      'aria-checked',
      after,
    )
  })
})

test.describe('Calendario', () => {
  test('muestra el mes actual y permite navegar', async ({ page }) => {
    await login(page, 'jostin@classroom.test')
    await page.goto('/calendar')

    await expect(page.getByRole('heading', { name: 'Calendario' })).toBeVisible()
    await expect(page.getByText('Lun')).toBeVisible()

    await page.getByRole('button', { name: 'Mes siguiente' }).click()
    await expect(page.getByRole('button', { name: 'Hoy' })).toBeVisible()
    await page.getByRole('button', { name: 'Hoy' }).click()
    await expect(page.getByRole('button', { name: 'Hoy' })).toHaveCount(0)
  })
})

test.describe('Administracion', () => {
  test('el admin ve las metricas y crea un usuario', async ({ page }) => {
    await login(page, 'admin@classroom.test')
    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: 'Administracion' })).toBeVisible()
    await expect(page.getByText('Usuarios', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Crear usuario' }).click()
    const dialog = page.getByRole('dialog', { name: 'Crear usuario' })

    // Correo unico por ejecucion, para poder repetir la prueba.
    const email = `e2e-${Date.now()}@classroom.test`
    await dialog.getByLabel('Nombre').fill('Prueba')
    await dialog.getByLabel('Apellido').fill('E2E')
    await dialog.getByLabel('Correo electronico').fill(email)
    await dialog.getByLabel('Contrasena temporal').fill('123456')
    await dialog.getByRole('radio', { name: 'Docente' }).check()
    await dialog.getByRole('button', { name: 'Crear' }).click()

    await expect(page.getByText('Usuario Prueba E2E creado')).toBeVisible()
    await page.getByPlaceholder('Buscar por nombre o correo').fill(email)
    await expect(page.getByText(email)).toBeVisible()
  })

  test('un estudiante no puede entrar al modulo de administracion', async ({ page }) => {
    await login(page, 'jostin@classroom.test')
    await page.goto('/admin')

    // La ruta redirige al inicio.
    await expect(page.getByRole('heading', { name: 'Clases' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Administracion' })).toHaveCount(0)
  })
})
