import { BrowserRouter } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Preloader from './components/Preloader.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Preloader />
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
