import * as React from 'react'

import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

const buttonVariants = {
  default: 'bg-slate-950 text-white shadow-sm hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-950 hover:bg-slate-200',
  outline: 'border border-slate-200 bg-white text-slate-950 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700',
}

const sizeVariants = {
  sm: 'h-9 rounded-md px-3 text-sm',
  default: 'h-10 rounded-md px-4 py-2',
  lg: 'h-11 rounded-md px-6 text-base',
  icon: 'h-10 w-10 rounded-md',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          buttonVariants[variant],
          sizeVariants[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'