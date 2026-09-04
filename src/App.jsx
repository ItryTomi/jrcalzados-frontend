import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import WhatsAppFAB from './components/WhatsAppFAB'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import Producto from './pages/Producto'
import Contacto from './pages/Contacto'
import Checkout from './pages/Checkout'
import Legales from './pages/Legales'
import Arrepentimiento from './pages/Arrepentimiento'
import Panel from './pages/Panel'
import MiCuenta from './pages/MiCuenta'
import PagoResultado from './pages/PagoResultado'

function IrArriba() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })

    // Canonica por pagina. El index.html es el mismo para todas las rutas,
    // asi que si la dejaramos fija Google leeria que todo el sitio es la
    // home. Se actualiza en cada navegacion.
    let canon = document.querySelector('link[rel="canonical"]')
    if (!canon) {
      canon = document.createElement('link')
      canon.rel = 'canonical'
      document.head.appendChild(canon)
    }
    canon.href = `${window.location.origin}${pathname}`
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <IrArriba />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/:categoria" element={<Catalogo />} />
          <Route path="/producto/:id" element={<Producto />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pago/:estado" element={<PagoResultado />} />
          <Route path="/legales/:doc" element={<Legales />} />
          <Route path="/arrepentimiento" element={<Arrepentimiento />} />
          <Route path="/panel" element={<Panel />} />
          <Route path="/mi-cuenta" element={<MiCuenta />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFAB />
    </>
  )
}
