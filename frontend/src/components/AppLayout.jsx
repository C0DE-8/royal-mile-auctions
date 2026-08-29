import { Route, Routes } from 'react-router-dom'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import ScrollAndReveal from './ScrollAndReveal.jsx'
import AdminPage from '../pages/Admin/AdminPage.jsx'
import AuctionsPage from '../pages/Auctions/AuctionsPage.jsx'
import BuyerInfoPage from '../pages/BuyerInfo/BuyerInfoPage.jsx'
import ContactPage from '../pages/Contact/ContactPage.jsx'
import HomePage from '../pages/Home/HomePage.jsx'
import InventoryPage from '../pages/Inventory/InventoryPage.jsx'
import NotFoundPage from '../pages/NotFound/NotFoundPage.jsx'
import SellVehiclePage from '../pages/SellVehicle/SellVehiclePage.jsx'

function AppLayout() {
  return (
    <>
      <ScrollAndReveal />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/buyers" element={<BuyerInfoPage />} />
          <Route path="/sell" element={<SellVehiclePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default AppLayout
