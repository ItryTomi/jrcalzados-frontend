import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { CatalogoProvider } from './context/CatalogoContext'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogoProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
