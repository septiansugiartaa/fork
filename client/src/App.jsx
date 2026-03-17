import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoutes";
import Layout from "./components/Layout"
import { AuthProvider } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage"

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
import FaqPage from "./pages/faq"

import PengurusDashboard from "./pages/pengurus/dashboard"
import PengurusSantri from "./pages/pengurus/dataSantri"
import PengurusOrangtua from "./pages/pengurus/dataOrangtua"
import PengurusUstadz from "./pages/pengurus/dataUstadz"
import PengurusKelas from "./pages/pengurus/dataKelas"
import PengurusKamar from "./pages/pengurus/dataKamar"
import PengurusJenisLayanan from "./pages/pengurus/jenisLayanan"
import PengurusJenisTagihan from "./pages/pengurus/jenisTagihan"
import PengurusRiwayatLayanan from "./pages/pengurus/riwayatLayanan"
import PengurusKeuangan from "./pages/pengurus/keuangan"
import PengurusKegiatan from "./pages/pengurus/kegiatan"

import TimkesDashboard from "./pages/timkesehatan/dashboard"
import TimkesScreening from "./pages/timkesehatan/daftarSantriScreening"
import TimkesDetailScreening from "./pages/timkesehatan/portalScreening"
import TimkesCreateScreening from "./pages/timkesehatan/formScreening"
import TimkesViewScreening from "./pages/timkesehatan/viewScreening"
import TimkesAbsensiKebersihan from "./pages/timkesehatan/daftarKamarAbsensi"
import TimkesDetailAbsensi from "./pages/timkesehatan/portalAbsensi"
import TimkesCreateAbsensi from "./pages/timkesehatan/formAbsensi"
import TimkesLaporanAbsensi from "./pages/timkesehatan/viewAbsensi"

import OrangtuaDashboard from "./pages/orangtua/dashboard"
import OrangtuaProfile from "./pages/orangtua/pendataan"
import OrangtuaKegiatan from "./pages/orangtua/kegiatan"
import OrangtuaKeuangan from "./pages/orangtua/keuangan"
import OrangtuaPengaduan from "./pages/orangtua/pengaduan"

import UstadzDashboard from "./pages/ustadz/dashboard"
import UstadzProfile from "./pages/ustadz/pendataan"
import UstadzKegiatan from "./pages/ustadz/kegiatan"
import UstadzSantri from "./pages/ustadz/daftarSantri"
import UstadzPengaduan from "./pages/ustadz/pengaduan"

import PimpinanDashboard from "./pages/pimpinan/dashboard"
import PimpinanSantri from "./pages/pimpinan/dataSantri"
import PimpinanUstadz from "./pages/pimpinan/dataUstadz"
import PimpinanMateri from "./pages/pimpinan/viewMateri"
import PimpinanDetailMateri from "./pages/pimpinan/detailMateri"
import PimpinanPengaduan from "./pages/pimpinan/pengaduan"
import PimpinanKeuangan from "./pages/pimpinan/keuangan"
import PimpinanFeedback from "./pages/pimpinan/feedback"

import AdminDashboard from "./pages/admin/dashboard"
import AdminStaf from "./pages/admin/manajemenStaf"
import AdminSantri from "./pages/admin/dataSantri"
import AdminOrangtua from "./pages/admin/dataOrangtua"
import AdminUstadz from "./pages/admin/dataUstadz"
import AdminKelas from "./pages/admin/dataKelas"
import AdminKamar from "./pages/admin/dataKamar"
import AdminJenisLayanan from "./pages/admin/jenisLayanan"
import AdminJenisTagihan from "./pages/admin/jenisTagihan"
import AdminPengaduan from "./pages/admin/pengaduan"
import AdminScreening from "./pages/admin/screening/daftarSantriScreening"
import AdminDetailScreening from "./pages/admin/screening/portalScreening"
import AdminCreateScreening from "./pages/admin/screening/formScreening"
import AdminViewScreening from "./pages/admin/screening/viewScreening"
import AdminKegiatan from "./pages/admin/kegiatan"
import AdminRiwayatLayanan from "./pages/admin/riwayatLayanan"
import AdminKeuangan from "./pages/admin/keuangan"
import AdminFeedback from "./pages/admin/feedback"
import AdminLog from "./pages/admin/log"

import PpdbDashboard from "./pages/ppdb/adminDashboard";
import Pendaftar     from "./pages/ppdb/adminPendaftar";
import Seleksi     from "./pages/ppdb/panitiaSeleksi";
import FormPendaftaran    from "./pages/ppdb/formPendaftaran";
import CekStatus          from "./pages/ppdb/cekStatus";       

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/ppdb/daftar" element={<FormPendaftaran />} />
          <Route path="/ppdb/cek-status" element={<CekStatus />} />
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
            <Route path="/pengurus" element={<Layout />}>
              <Route index element={<PengurusDashboard />} />
              <Route path="data-santri" element={<PengurusSantri />} />
              <Route path="data-orangtua" element={<PengurusOrangtua />} />
              <Route path="data-ustadz" element={<PengurusUstadz />} />
              <Route path="data-kelas" element={<PengurusKelas />} />
              <Route path="data-kamar" element={<PengurusKamar />} />
              <Route path="jenis-layanan" element={<PengurusJenisLayanan />} />
              <Route path="jenis-tagihan" element={<PengurusJenisTagihan />} />
              <Route path="riwayat-layanan" element={<PengurusRiwayatLayanan />} />
              <Route path="keuangan" element={<PengurusKeuangan />} />
              <Route path="kegiatan" element={<PengurusKegiatan />} />
              <Route path="ppdb/rekapitulasi" element={<PpdbDashboard />} />
              <Route path="ppdb/pendaftar" element={<Pendaftar />} />
              <Route path="ppdb/seleksi" element={<Seleksi />} />
              <Route path="faq" element={<FaqPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['timkesehatan']} />}>
            <Route path="/timkesehatan" element={<Layout />}>
              <Route index element={<TimkesDashboard />} />
              <Route path="manageMateri" element={<MateriManage />} />
              <Route path="manageMateri/:id" element={<DetailMateri />} />
              <Route path="daftarSantriScreening" element={<TimkesScreening />} />
              <Route
                path="daftarSantriScreening/:id/create"
                element={<TimkesCreateScreening />}
              />
              <Route
                path="daftarSantriScreening/:id/edit/:screeningId"
                element={<TimkesCreateScreening />}
              />
              <Route
                path="daftarSantriScreening/:id"
                element={<TimkesDetailScreening />}
              />
              <Route
                path="/timkesehatan/daftarSantriScreening/:id/view/:screeningId"
                element={<TimkesViewScreening />}
              />
              <Route path="daftarAbsensiKamar" element={<TimkesAbsensiKebersihan />}/>
              <Route path="daftarAbsensiKamar/:id" element={<TimkesDetailAbsensi />} />
              <Route path="daftarAbsensiKamar/:id/create" element={<TimkesCreateAbsensi />} />
              <Route
                path="/timkesehatan/daftarAbsensiKamar/:id/edit/:id_heading"
                element={<TimkesCreateAbsensi/>}
                />
              <Route path="daftarAbsensiKamar/:id/laporan" element={<TimkesLaporanAbsensi />} />
              <Route path="faq" element={<FaqPage />} />
            </Route>
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

          <Route element={<ProtectedRoute allowedRoles={['ustadz']} />}>
            <Route path="/ustadz">
              <Route index element={<UstadzDashboard />} />
              <Route path="profil" element={<UstadzProfile />} />
              <Route path="kegiatan" element={<UstadzKegiatan />} />
              <Route path="daftar-santri" element={<UstadzSantri />} />
              <Route path="pengaduan" element={<UstadzPengaduan />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['pimpinan']} />}>
            <Route path="/pimpinan" element={<Layout />}>
              <Route index element={<PimpinanDashboard />} />
              <Route path="data-santri" element={<PimpinanSantri />} />
              <Route path="data-ustadz" element={<PimpinanUstadz />} />
              <Route path="scabies/materi" element={<PimpinanMateri />} />
              <Route path="scabies/materi/:id" element={<PimpinanDetailMateri />} />
              <Route path="pengaduan" element={<PimpinanPengaduan />} />
              <Route path="keuangan" element={<PimpinanKeuangan />} />
              <Route path="feedback" element={<PimpinanFeedback />} />
              <Route path="ppdb/rekapitulasi" element={<PpdbDashboard />} />
              <Route path="ppdb/pendaftar" element={<Pendaftar />} />
              <Route path="ppdb/seleksi" element={<Seleksi />} />
              <Route path="faq" element={<FaqPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="data-staf" element={<AdminStaf />} />
              <Route path="data-santri" element={<AdminSantri />} />
              <Route path="data-orangtua" element={<AdminOrangtua />} />
              <Route path="data-ustadz" element={<AdminUstadz />} />
              <Route path="data-kelas" element={<AdminKelas />} />
              <Route path="data-kamar" element={<AdminKamar />} />
              <Route path="jenis-layanan" element={<AdminJenisLayanan />} />
              <Route path="jenis-tagihan" element={<AdminJenisTagihan />} />
              <Route path="pengaduan" element={<AdminPengaduan />} />
              <Route path="kegiatan" element={<AdminKegiatan />} />
              <Route path="riwayat-layanan" element={<AdminRiwayatLayanan />} />
              <Route path="keuangan" element={<AdminKeuangan />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="log" element={<AdminLog />} />

              <Route path="manageMateri" element={<MateriManage />} />
              <Route path="manageMateri/:id" element={<DetailMateri />} />
              <Route path="daftarSantriScreening" element={<AdminScreening />} />
              <Route path="daftarSantriScreening/:id/create" element={<AdminCreateScreening />} />
              <Route path="daftarSantriScreening/:id/edit/:screeningId" element={<AdminCreateScreening />} />
              <Route path="daftarSantriScreening/:id" element={<AdminDetailScreening />} />
              <Route path="daftarSantriScreening/:id/view/:screeningId" element={<AdminViewScreening />} />

              <Route path="ppdb/rekapitulasi" element={<PpdbDashboard />} />
              <Route path="ppdb/pendaftar" element={<Pendaftar />} />
              <Route path="ppdb/seleksi" element={<Seleksi />} />
              <Route path="faq" element={<FaqPage />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App