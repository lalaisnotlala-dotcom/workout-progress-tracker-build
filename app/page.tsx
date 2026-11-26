import { getDashboard } from '@/app/actions'
import { Dashboard } from '@/components/workout/dashboard'
import { UserBootstrap } from '@/components/workout/user-bootstrap'
import { isValidUserCode } from '@/lib/user-code'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ user?: string | string[] }>
}) {
  const { user } = await searchParams
  if (!isValidUserCode(user)) return <UserBootstrap />

  const initialData = await getDashboard(user)
  return <Dashboard userCode={user} initialData={initialData} />
}
