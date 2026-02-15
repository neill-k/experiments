'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import for p5 to avoid SSR issues
const P5Wrapper = dynamic(() => import('./P5Wrapper'), { ssr: false })

export default function GravitySandpark() {
  return (
    <main className="min-h-dvh bg-black">
      <P5Wrapper />
    </main>
  )
}
