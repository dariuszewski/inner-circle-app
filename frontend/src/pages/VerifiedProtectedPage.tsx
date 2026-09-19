import { useEffect, useRef } from 'react'

import { getCurrentUser } from '../api/auth'
import { useAuth } from '../providers/useAuth'
import VerifiedPage from './VerifiedPage'

export default function VerifiedProtectedPage() {
  const auth = useAuth()

  // after a successful email change / elevation, refresh the auth context user
  // (onVerified runs inside an effect downstream, so it is StrictMode-safe)
  const onVerifiedRef = useRef(() => {
    if (!auth.accessToken) return
    getCurrentUser(auth.accessToken)
      .then(auth.updateUser)
      .catch(() => {
        // the verification itself already succeeded; a stale context user is
        // only cosmetic and self-heals on next session restore
      })
  })

  useEffect(() => {
    onVerifiedRef.current = () => {
      if (!auth.accessToken) return
      getCurrentUser(auth.accessToken)
        .then(auth.updateUser)
        .catch(() => {})
    }
  })

  return (
    <VerifiedPage
      pendingTitle="Verification in progress..."
      successTitle="Success"
      footerLink={{ to: '/collections', label: 'Back home' }}
      showLogo={false}
      onVerified={() => onVerifiedRef.current()}
    />
  )
}
