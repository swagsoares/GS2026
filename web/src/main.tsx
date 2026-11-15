import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Painel from './pages/Painel'
import Visitas from './pages/Visitas'
import Demo from './pages/Demo'
import Governanca from './pages/Governanca'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<Inicio />} />
        <Route element={<Layout />}>
          <Route path="painel" element={<Painel />} />
          <Route path="visitas" element={<Visitas />} />
          <Route path="demonstracao" element={<Demo />} />
          <Route path="governanca" element={<Governanca />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
