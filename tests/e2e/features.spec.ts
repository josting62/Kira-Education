import { expect, test, type Page } from '@playwright/test'

const login = async (page: Page, email: string) => {
  await page.context().clearCookies()
  await page.goto('/login')
  await page.getByLabel('Correo electronico').fill(email)
  await page.getByLabel('Contrasena').fill('123456')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(
    page.getByRole('heading', { name: 'Clases' }).or(page.getByRole('heading', { name: 'Seguimiento' })),
  ).toBeVisible()
}

test.describe('Comentarios', () => {
  test('el docente comenta en el tablon y el alumno lo ve', async ({ page }) => {
    const texto = `Comentario E2E ${Date.now()}`

    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1')

    // El primer hilo del tablon arranca plegado.
    await page.getByRole('button', { name: /comentario|Comentar/ }).first().click()
    const campo = page.getByLabel('Anade un comentario a la clase').first()
    await campo.fill(texto)
    await page.getByRole('button', { name: 'Publicar comentario' }).first().click()
    await expect(page.getByText(texto)).toBeVisible()

    // El alumno lo ve al abrir el hilo.
    await login(page, 'jostin@classroom.test')
    await page.goto('/courses/1')
    await page.getByRole('button', { name: /comentario/ }).first().click()
    await expect(page.getByText(texto)).toBeVisible()
  })

  test('los comentarios privados solo los ven el alumno y su docente', async ({ page }) => {
    const texto = `Duda privada ${Date.now()}`

    await login(page, 'jostin@classroom.test')
    await page.goto('/courses/1/work/1')
    await expect(page.getByText('Comentarios privados')).toBeVisible()

    await page.getByLabel('Escribe a tu docente').fill(texto)
    await page.getByRole('button', { name: 'Publicar comentario' }).last().click()
    await expect(page.getByText(texto)).toBeVisible()

    // Otro alumno de la misma clase no lo ve en su propia vista.
    await login(page, 'mateo@classroom.test')
    await page.goto('/courses/1/work/1')
    await expect(page.getByText(texto)).toHaveCount(0)
  })
})

test.describe('Trabajo en clase', () => {
  test('el menu Crear ofrece las seis opciones de Classroom', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')

    await page.getByRole('button', { name: 'Crear', exact: true }).click()
    const menu = page.getByRole('menu')

    for (const opcion of [
      'Tarea',
      'Tarea de cuestionario',
      'Pregunta',
      'Material',
      'Reutilizar publicacion',
      'Tema',
    ]) {
      await expect(menu.getByRole('menuitem', { name: opcion, exact: true })).toBeVisible()
    }
  })

  test('el docente crea, renombra, reordena y borra un tema', async ({ page }) => {
    page.on('dialog', (d) => void d.accept())
    const nombre = `Tema E2E ${Date.now()}`

    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')

    await page.getByRole('button', { name: 'Crear', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Tema', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Temas de la clase' })
    await dialog.getByLabel('Nuevo tema').fill(nombre)
    await dialog.getByRole('button', { name: 'Anadir' }).click()
    await expect(dialog.getByText(nombre)).toBeVisible()

    // Renombrar
    await dialog.getByRole('button', { name: `Renombrar ${nombre}` }).click()
    await dialog.getByLabel(`Nuevo nombre de ${nombre}`).fill(`${nombre} bis`)
    await dialog.getByRole('button', { name: 'Guardar' }).click()
    await expect(dialog.getByText(`${nombre} bis`)).toBeVisible()

    // Reordenar: al subirlo, el boton de subir se deshabilita (ya es el primero).
    await dialog.getByRole('button', { name: `Subir ${nombre} bis` }).click()
    await expect(dialog.getByRole('button', { name: `Subir ${nombre} bis` })).toBeDisabled()

    await dialog.getByRole('button', { name: `Borrar ${nombre} bis` }).click()
    await expect(dialog.getByText(`${nombre} bis`)).toHaveCount(0)
  })

  test('el docente despublica un trabajo y vuelve a publicarlo', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')

    const fila = page.getByRole('button', { name: /Opciones de Actividad 3 CRUD/ })
    await fila.click()
    await page.getByRole('menuitem', { name: 'Volver a borrador' }).click()
    await expect(page.getByText('El trabajo volvio a borrador')).toBeVisible()
    await expect(page.getByText('Borrador').first()).toBeVisible()

    await fila.click()
    await page.getByRole('menuitem', { name: 'Publicar' }).click()
    await expect(page.getByText('Trabajo publicado')).toBeVisible()
  })
})

test.describe('Colocacion de los menus y del encabezado', () => {
  test('el menu de un trabajo se ve completo, sin recortarlo la card', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')

    await page.getByRole('button', { name: /^Opciones de / }).first().click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()

    // La card de la lista tiene overflow-hidden. El panel se pinta en un portal
    // sobre el body con position fixed, asi que la ultima opcion tiene que
    // quedar entera dentro de la ventana: toBeInViewport tiene en cuenta el
    // recorte de los contenedores, que es justo lo que fallaba.
    await expect(menu.getByRole('menuitem', { name: 'Eliminar' })).toBeInViewport({ ratio: 1 })
  })

  test('el boton Personalizar queda pegado al borde del encabezado', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1')

    const banner = page.locator('[data-banner="course"]')
    const boton = page.getByRole('button', { name: 'Personalizar' })

    const caja = await banner.boundingBox()
    const suya = await boton.boundingBox()
    if (!caja || !suya) throw new Error('No se pudo medir el encabezado')

    // Anclado a la esquina, no colocado a continuacion del titulo: con un nombre
    // de clase corto el boton se salia del encabezado.
    const margen = caja.x + caja.width - (suya.x + suya.width)
    expect(margen).toBeGreaterThan(8)
    expect(margen).toBeLessThan(32)
  })
})

test.describe('Calificacion', () => {
  test('la nota en borrador no la ve el alumno hasta devolverla', async ({ page }) => {
    // La prueba crea su propia tarea y la borra al final. Calificar es
    // irreversible (una entrega devuelta no vuelve atras), asi que reutilizar
    // una tarea del seed haria que la segunda ejecucion arrancara ya calificada.
    page.on('dialog', (d) => void d.accept())
    const tarea = `Tarea E2E notas ${Date.now()}`

    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')

    await page.getByRole('button', { name: 'Crear', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Tarea', exact: true }).click()
    const crear = page.getByRole('dialog', { name: 'Crear trabajo en clase' })
    await crear.getByLabel('Titulo').fill(tarea)
    await crear.getByRole('button', { name: 'Publicar' }).click()
    await expect(crear).toHaveCount(0)

    // El alumno la entrega.
    await login(page, 'mateo@classroom.test')
    await page.goto('/courses/1/work')
    await page.getByRole('link', { name: new RegExp(tarea) }).click()
    await page.getByRole('button', { name: 'Entregar' }).click()
    await expect(page.getByText('Entregado').first()).toBeVisible()

    // El docente guarda la nota solo como borrador.
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')
    await page.getByRole('link', { name: new RegExp(tarea) }).click()
    await page.getByRole('spinbutton', { name: 'Nota de Mateo Suarez' }).fill('77')
    await page.getByRole('button', { name: 'Guardar borrador de Mateo Suarez' }).click()
    await expect(page.getByText(/borrador 77/)).toBeVisible()

    // Mateo sigue viendo su entrega sin nota: el borrador no sale de la vista del docente.
    await login(page, 'mateo@classroom.test')
    await page.goto('/courses/1/work')
    await page.getByRole('link', { name: new RegExp(tarea) }).click()
    await expect(page.getByText('77')).toHaveCount(0)

    // Al devolverla, ya la ve.
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')
    await page.getByRole('link', { name: new RegExp(tarea) }).click()
    await page.getByRole('button', { name: 'Devolver la nota de Mateo Suarez' }).click()
    await expect(page.getByText('Calificado').first()).toBeVisible()

    await login(page, 'mateo@classroom.test')
    await page.goto('/courses/1/work')
    await page.getByRole('link', { name: new RegExp(tarea) }).click()
    await expect(page.getByText('77')).toBeVisible()

    // Limpieza: la tarea era solo para esta prueba.
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/work')
    await page.getByRole('button', { name: `Opciones de ${tarea}` }).click()
    await page.getByRole('menuitem', { name: 'Eliminar' }).click()
    await expect(page.getByRole('link', { name: new RegExp(tarea) })).toHaveCount(0)
  })

  test('la libreta se puede exportar a CSV', async ({ page }) => {
    await login(page, 'gersson@classroom.test')
    await page.goto('/courses/1/grades')

    const enlace = page.getByRole('link', { name: 'Exportar a CSV' })
    await expect(enlace).toHaveAttribute('href', '/api/courses/1/gradebook.csv')

    const descarga = page.waitForEvent('download')
    await enlace.click()
    const archivo = await descarga
    expect(archivo.suggestedFilename()).toBe('libreta-clase-1.csv')
  })
})

test.describe('Acudiente', () => {
  test('ve el resumen de su acudido y no puede entrar a las clases', async ({ page }) => {
    await login(page, 'rosa@classroom.test')

    // El acudiente entra a su panel desde el menu lateral.
    await page.getByRole('link', { name: 'Seguimiento' }).click()
    await expect(page.getByRole('heading', { name: 'Seguimiento' })).toBeVisible()
    await expect(page.getByText('Jostin Gomez')).toBeVisible()
    await expect(page.getByText('Promedio')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Calificaciones' })).toBeVisible()

    // No tiene el menu de clases ni acceso al modulo admin.
    await expect(page.getByRole('link', { name: 'Administracion' })).toHaveCount(0)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Administracion' })).toHaveCount(0)
  })

  test('el admin vincula y desvincula un acudiente', async ({ page }) => {
    await login(page, 'admin@classroom.test')
    await page.goto('/admin')
    await page.getByPlaceholder('Buscar por nombre o correo').fill('laura')

    await page.getByRole('button', { name: /Opciones de Laura/ }).click()
    await page.getByRole('menuitem', { name: 'Acudientes' }).click()

    const dialog = page.getByRole('dialog', { name: /Acudientes de Laura/ })
    await expect(dialog).toBeVisible()

    await dialog
      .getByLabel('Vincular un acudiente')
      .selectOption({ label: 'Rosa Gomez (rosa@classroom.test)' })
    await dialog.getByLabel('Parentesco (opcional)').fill('Tia')
    await dialog.getByRole('button', { name: 'Vincular' }).click()

    // El boton de desvincular solo existe si el vinculo esta creado, asi que
    // sirve de senal en los dos sentidos (el nombre tambien sale en el <select>).
    const desvincular = dialog.getByRole('button', { name: 'Desvincular Rosa Gomez' })
    await expect(desvincular).toBeVisible()
    await desvincular.click()
    await expect(desvincular).toHaveCount(0)
  })
})
