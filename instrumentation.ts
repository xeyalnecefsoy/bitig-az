export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateProductionEnv } = await import('@/lib/env')
    try {
      validateProductionEnv()
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}
