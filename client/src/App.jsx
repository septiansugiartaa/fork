import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login"
import SantriDashboard from "./pages/santri/dashboard"
import SantriProfile from "./pages/santri/pendataan"
import SantriKeuangan from "./pages/santri/keuangan"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route path="/santri" element={<SantriDashboard />} />
        <Route path="/santri/profil" element={<SantriProfile />} />
        <Route path="/santri/keuangan" element={<SantriKeuangan />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App