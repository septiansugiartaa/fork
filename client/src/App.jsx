import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoutes";

import SantriDashboard from "./pages/santri/dashboard"
import SantriProfile from "./pages/santri/pendataan"
import SantriKeuangan from "./pages/santri/keuangan"
import SantriKegiatan from "./pages/santri/kegiatan"
import SantriPengaduan from "./pages/santri/pengaduan"
import SantriLayanan from "./pages/santri/layanan"
import SantriRiwayatLayanan from "./pages/santri/riwayatLayanan"
import MateriView from "./pages/viewMateri"
import DetailMateri from "./pages/detailMateri" 

import PengurusLayout from "./components/Layout"
import PengurusDashboard from "./pages/pengurus/dashboard"
import PengurusSantri from "./pages/pengurus/dataSantri"
import PengurusUstadz from "./pages/pengurus/dataUstadz"
import PengurusKelas from "./pages/pengurus/dataKelas"
import PengurusKamar from "./pages/pengurus/dataKamar"
import PengurusJenisLayanan from "./pages/pengurus/jenisLayanan"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['santri']} />}>
          <Route path="/santri" element={<SantriDashboard />} />
          <Route path="/santri/profil" element={<SantriProfile />} />
          <Route path="/santri/keuangan" element={<SantriKeuangan />} />
          <Route path="/santri/kegiatan" element={<SantriKegiatan />} />
          <Route path="/santri/pengaduan" element={<SantriPengaduan />} />
          <Route path="/santri/layanan" element={<SantriLayanan />} />
          <Route path="/santri/layanan/riwayat" element={<SantriRiwayatLayanan />} />
          <Route path="/santri/scabies/viewMateri" element={<MateriView />}/>
          <Route path="/santri/scabies/viewMateri/:id" element={<DetailMateri />}/>
        </Route>

        <Route path="/pengurus" element={<PengurusLayout />}>
          <Route index element={<PengurusDashboard />} />
          <Route path="data-santri" element={<PengurusSantri />} />
          <Route path="data-ustadz" element={<PengurusUstadz />} />
          <Route path="data-kelas" element={<PengurusKelas />} />
          <Route path="data-kamar" element={<PengurusKamar />} />
          <Route path="jenis-layanan" element={<PengurusJenisLayanan />} />
        </Route>

        {/* <Route element={<ProtectedRoute allowedRoles={['orangtua']} />}>
             <Route path="/orangtua" element={<OrangtuaDashboard />} />
        </Route> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App