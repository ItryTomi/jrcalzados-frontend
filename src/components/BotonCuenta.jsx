import { Link } from 'react-router-dom'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { User } from 'lucide-react'
import { hayCuentas } from '../context/AuthContext'
import './BotonCuenta.css'

// Si Clerk no esta configurado no se muestra nada y la web sigue siendo
// de compra como invitado, sin rastro de cuentas.
export default function BotonCuenta() {
  if (!hayCuentas) return null

  return (
    <div className="cuenta">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="cuenta-entrar" aria-label="Ingresar a mi cuenta" title="Ingresar">
            <User size={21} />
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <Link to="/mi-cuenta" className="cuenta-link" aria-label="Mi cuenta" title="Mi cuenta">
          <User size={21} />
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }}
        />
      </SignedIn>
    </div>
  )
}
