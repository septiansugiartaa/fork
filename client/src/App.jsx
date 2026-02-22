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
import MateriManage from "./pages/manageMateri" 

import PengurusLayout from "./components/Layout"
import PengurusDashboard from "./pages/pengurus/dashboard"
import PengurusSantri from "./pages/pengurus/dataSantri"
import PengurusUstadz from "./pages/pengurus/dataUstadz"
import PengurusKelas from "./pages/pengurus/dataKelas"
import PengurusKamar from "./pages/pengurus/dataKamar"
import PengurusJenisLayanan from "./pages/pengurus/jenisLayanan"
import PengurusRiwayatLayanan from "./pages/pengurus/riwayatLayanan"
import PengurusKeuangan from "./pages/pengurus/keuangan"

import TimkesDashboard from "./pages/timkesehatan/dashboard"

import OrangtuaDashboard from "./pages/orangtua/dashboard"
import OrangtuaProfile from "./pages/orangtua/pendataan"
import OrangtuaKegiatan from "./pages/orangtua/kegiatan"
import OrangtuaKeuangan from "./pages/orangtua/keuangan"
import OrangtuaPengaduan from "./pages/orangtua/pengaduan"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['santri']} />}>
          <Route path="/santri">
            <Route index element={<SantriDashboard />} />
            <Route path="profil" element={<SantriProfile />} />
            <Route path="keuangan" element={<SantriKeuangan />} />
            <Route path="kegiatan" element={<SantriKegiatan />} />
            <Route path="pengaduan" element={<SantriPengaduan />} />
            <Route path="layanan">
              <Route index element={<SantriLayanan />} />
              <Route path="riwayat" element={<SantriRiwayatLayanan />} />
            </Route>
            <Route path="scabies">
              <Route path="viewMateri" element={<MateriView />} />
              <Route path="viewMateri/:id" element={<DetailMateri />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['pengurus']} />}>
          <Route path="/pengurus" element={<PengurusLayout />}>
            <Route index element={<PengurusDashboard />} />
            <Route path="data-santri" element={<PengurusSantri />} />
            <Route path="data-ustadz" element={<PengurusUstadz />} />
            <Route path="data-kelas" element={<PengurusKelas />} />
            <Route path="data-kamar" element={<PengurusKamar />} />
            <Route path="jenis-layanan" element={<PengurusJenisLayanan />} />
            <Route path="riwayat-layanan" element={<PengurusRiwayatLayanan />} />
            <Route path="keuangan" element={<PengurusKeuangan />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['timkes']} />}>
          <Route path="/timkesehatan" element={<TimkesDashboard />}/>
          <Route path="/timkesehatan/manageMateri" element={<MateriManage />}/>
          <Route path="/timkesehatan/manageMateri/:id" element={<DetailMateri />}/>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['orangtua']} />}>
          <Route path="/orangtua">
            <Route index element={<OrangtuaDashboard />} />
            <Route path="profil" element={<OrangtuaProfile />} />
            <Route path="kegiatan" element={<OrangtuaKegiatan />} />
            <Route path="keuangan" element={<OrangtuaKeuangan />} />
            <Route path="pengaduan" element={<OrangtuaPengaduan />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App