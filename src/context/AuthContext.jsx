import { createContext, useContext } from 'react'
import { ClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'

// Las cuentas de comprador son OPCIONALES en dos sentidos:
//
// 1. Si no hay clave de Clerk cargada, la web funciona igual: no aparece
//    el boton de ingresar y se compra como invitado, como hasta ahora.
// 2. Aunque haya cuentas, nunca se obliga a crear una para comprar.
//    Pedir registro antes de pagar es de las cosas que mas ventas hacen
//    perder.

const CLAVE = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
export const hayCuentas = Boolean(CLAVE)

const SinCuentas = createContext(null)

export function AuthProvider({ children }) {
  if (!hayCuentas) {
    return <SinCuentas.Provider value={null}>{children}</SinCuentas.Provider>
  }
  return (
    <ClerkProvider
      publishableKey={CLAVE}
      afterSignOutUrl="/"
      localization={{ locale: 'es-ES' }}
    >
      {children}
    </ClerkProvider>
  )
}

// Envoltorio unico para que los componentes no tengan que saber si Clerk
// esta activo o no.
export function useCuenta() {
  if (!hayCuentas) {
    return { hayCuentas: false, entrado: false, cargando: false, usuario: null, token: async () => null }
  }
  // Los hooks solo se llaman cuando Clerk existe, y hayCuentas no cambia
  // durante la vida de la app, asi que el orden de hooks es estable.
  /* eslint-disable react-hooks/rules-of-hooks */
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user } = useUser()
  /* eslint-enable react-hooks/rules-of-hooks */

  return {
    hayCuentas: true,
    cargando: !isLoaded,
    entrado: Boolean(isSignedIn),
    usuario: user
      ? {
          id: user.id,
          nombre: user.firstName || '',
          apellido: user.lastName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          telefono: user.primaryPhoneNumber?.phoneNumber || '',
          foto: user.imageUrl
        }
      : null,
    token: getToken
  }
}
