import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { CatalogoProvider } from './context/CatalogoContext'
import App from './App'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogoProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </CatalogoProvider>
    </BrowserRouter>
  </StrictMode>
)
