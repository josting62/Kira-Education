import type { ReactNode } from 'react'
import { Icon } from '@/assets/icons'
import { ApiOfflineBanner } from '@/components/molecules/ApiOfflineBanner'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Plantilla centrada para login y registro. */
export const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-canvas">
    <ApiOfflineBanner />

    {/* Tambien aqui, para poder entrar en oscuro desde el primer momento. */}
    <div className="flex justify-end px-3 pt-3">
      <ThemeToggle />
    </div>

    <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-10 sm:pb-16">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-accent-500 text-white">
          <Icon.course className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Kiro Education
          </h1>
          <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <h2 className="mb-5 text-base font-medium text-ink">{title}</h2>
        {children}
      </div>

      {footer && <div className="mt-5 text-center text-xs text-ink-muted">{footer}</div>}
    </div>
  </div>
)
