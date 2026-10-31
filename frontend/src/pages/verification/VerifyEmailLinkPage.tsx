import { getCurrentUser } from '../../api/auth'
import { useAuth } from '../../providers/useAuth'
import VerifiedPage from './VerifiedPage'

export default function VerifyEmailLinkPage() {
  const auth = useAuth()

  // after a successful email change / elevation, refresh the auth context user
  const handleVerified = (detail: string) => {
    if (detail === 'Account deleted successfully.') {
      void auth.logoutUser()
      return
    }
    if (!auth.accessToken) return
    getCurrentUser(auth.accessToken)
      .then(auth.updateUser)
      .catch(() => {
        // the verification itself already succeeded; a stale context user is
        // only cosmetic and self-heals on next session restore
      })
  }

  return (
    <VerifiedPage
      pendingTitle="Verification in progress..."
      successTitle="Success"
      footerLink={{ to: '/collections', label: 'Back home' }}
      onVerified={handleVerified}
    />
  )
}
