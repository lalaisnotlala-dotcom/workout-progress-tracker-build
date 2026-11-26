'use client'

import { customAlphabet } from 'nanoid'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Dumbbell } from 'lucide-react'
import { isValidUserCode, USER_CODE_STORAGE_KEY } from '@/lib/user-code'

const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)

export function UserBootstrap() {
  const router = useRouter()

  useEffect(() => {
    let code = window.localStorage.getItem(USER_CODE_STORAGE_KEY)
    if (!isValidUserCode(code)) {
      code = `user-${generateId()}`
      window.localStorage.setItem(USER_CODE_STORAGE_KEY, code)
    }
    router.replace(`/?user=${encodeURIComponent(code)}`)
  }, [router])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
      <Dumbbell className="size-8 motion-safe:animate-bounce" aria-hidden="true" />
      <p role="status">Setting up your tracker...</p>
    </main>
  )
}
