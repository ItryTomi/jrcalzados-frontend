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
import PagoResultado from './pages/PagoResultado'

function IrArriba() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
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
          <Route path="/pago/:estado" element={<PagoResultado />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFAB />
    </>
  )
}
