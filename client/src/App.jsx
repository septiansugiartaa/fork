import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login"
import SantriDashboard from "./pages/santri/dashboard"
import SantriProfil from "./pages/santri/pendataan"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/santri" element={<SantriDashboard />} />
        <Route path="/santri/profil" element={<SantriProfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App