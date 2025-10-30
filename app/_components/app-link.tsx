// components/AppLink.tsx
'use client'

import React from 'react'
import Link, { LinkProps } from 'next/link'

type Props = LinkProps & {
  children: React.ReactNode
  className?: string
}

export default function AppLink({ children, ...props }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    // show the progress bar immediately
    ;(window as any).__showTopProgress?.()
    // allow normal Link behavior to continue (do NOT call router.push here)
    if (typeof (props as any).onClick === 'function') {
      ;(props as any).onClick(e)
    }
  }

  // forward the Link props; Next's Link accepts a child element, so we pass props through
  return (
  
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  )
}
