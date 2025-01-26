import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import SolveForX from "./SolveForX.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolveForX />
  </StrictMode>,
)
