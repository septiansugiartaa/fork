import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../../config/api";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FormScreening() {
  const { id, screeningId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isEditMode = !!screeningId;
  const routePrefix = location.pathname.split('/')[1];

  const [santri, setSantri] = useState(null);
  const [bagianA, setBagianA] = useState([]);
  const [bagianB, setBagianB] = useState([]);
  const [jawaban, setJawaban] = useState([]);
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [diagnosaManual, setDiagnosaManual] = useState("");
  const [diagnosaOtomatis, setDiagnosaOtomatis] = useState("Bukan_Scabies");
  const [penanganan, setPenanganan] = useState([]);
  const [opsiPenanganan, setOpsiPenanganan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riwayatScreeningCount, setRiwayatScreeningCount] = useState(0);
  const [areaPredileksi, setAreaPredileksi] = useState([]);
  const [errors, setErrors] = useState({ bagianA: "", bagianB: "", penanganan: "" });
  const [fotoError, setFotoError] = useState("");

  const validateForm = () => {
    let newErrors = { bagianA: "", bagianB: "", penanganan: "" };
    let isValid = true;

    if (!isEditMode) {
      const jawabanA = jawaban.filter(j => bagianA.some(a => a.id_pertanyaan_screening === j.id_pertanyaan_screening));
      const jawabanB = jawaban.filter(j => bagianB.some(b => b.id_pertanyaan_screening === j.id_pertanyaan_screening));

      if (jawabanA.length !== bagianA.length) { newErrors.bagianA = "Semua pertanyaan Bagian A wajib dijawab"; isValid = false; }
      if (jawabanB.length !== bagianB.length) { newErrors.bagianB = "Semua pertanyaan Bagian B wajib dijawab"; isValid = false; }
      if (penanganan.length === 0) { newErrors.penanganan = "Minimal pilih 1 penanganan"; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    const totalYa = jawaban.filter(j => j.jawaban === true).length;
    let hasil = "Bukan_Scabies";
    if (totalYa > 5) hasil = "Scabies";
    else if (totalYa >= 3) hasil = "Perlu_Evaluasi_Lebih_Lanjut";
    setDiagnosaOtomatis(hasil);
  }, [jawaban]);

  const fetchInitialData = async () => {
    try {
      const [pertanyaanRes, santriRes, penangananRes, riwayatRes] = await Promise.all([
        api.get("/admin/screening/pertanyaan"),
        api.get(`/admin/screening/santri/${id}/detail`),
        api.get("/admin/screening/penanganan"),
        api.get(`/admin/screening/santri/${id}/screening`, { params: { page: 1, limit: 1 } })
      ]);

      setBagianA(pertanyaanRes.data.data.bagianA);
      setBagianB(pertanyaanRes.data.data.bagianB);
      setSantri(santriRes.data.data);
      setOpsiPenanganan(penangananRes.data.data);
      setRiwayatScreeningCount(riwayatRes.data?.pagination?.total || 0);

      if (isEditMode) {
        const screeningRes = await api.get(`/admin/screening/${screeningId}`);
        const screening = screeningRes.data.data;

        setJawaban(screening.detail_screening.map(d => ({
          id_pertanyaan_screening: d.id_pertanyaan_screening,
          jawaban: d.jawaban
        })));
        setDiagnosaManual(screening.diagnosa);
        setPenanganan(screening.screening_penanganan.map(p => p.id_penanganan));
        try {
          const parsedCatatan = screening.catatan ? JSON.parse(screening.catatan) : null;
          setAreaPredileksi(parsedCatatan?.area_predileksi || []);
        } catch {
          setAreaPredileksi([]);
        }

        if (screening.foto_predileksi) {
          setPreview(`/uploads/screening/${screening.foto_predileksi}`);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id_pertanyaan, value) => {
    if (isEditMode) return;
    setJawaban((prev) => {
      const filtered = prev.filter((j) => j.id_pertanyaan_screening !== id_pertanyaan);
      return [...filtered, { id_pertanyaan_screening: id_pertanyaan, jawaban: value === "ya" }];
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (foto) formData.append("foto", foto);
      
      if (fotoError) return;

      if (isEditMode) {
        await api.put(`/admin/screening/${screeningId}/foto`, formData);
      } else {
        if (!validateForm()) return;
        const finalDiagnosa = diagnosaManual || diagnosaOtomatis;

        formData.append("id_santri", id);
        formData.append("jawaban", JSON.stringify(jawaban));
        formData.append("diagnosaManual", finalDiagnosa);
        formData.append("penanganan", JSON.stringify(penanganan));
        formData.append("areaPredileksi", JSON.stringify(areaPredileksi));

        await api.post("/admin/screening/create", formData);
      }

      navigate(`/${routePrefix}/daftarSantriScreening/${id}`);
    } catch (err) {
      console.error("Submit error:", err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !santri) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-green-600" />
    </div>
  );

  const getDiagnosaStyle = (diagnosa) => {
    if (!diagnosa) return "text-gray-500";
    if (diagnosa === "Scabies") return "text-red-600 font-semibold";
    if (diagnosa === "Bukan_Scabies") return "text-green-600 font-semibold";
    return "text-yellow-600 font-semibold";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1 className="text-2xl font-bold ml-4">{isEditMode ? "Update Foto Predileksi" : "Formulir Screening"}</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <Card title="Data Diri Santri">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <Info label="Nama Santri" value={santri.nama} />
            <Info label="NIS" value={santri.nip} />
            <Info label="Kelas" value={santri.kelas?.kelas || "-"} />
            <Info label="Kamar" value={santri.kamar?.kamar || "-"} />
          </div>
        </Card>

        {!isEditMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
            {riwayatScreeningCount === 0
              ? 'Screening pertama: jika hasil awal "Perlu Evaluasi Lebih Lanjut", sistem akan mengarahkan rekomendasi ke "Kemungkinan Scabies".'
              : 'Screening lanjutan: hasil "Perlu Evaluasi Lebih Lanjut" mengikuti aturan default sistem.'}
          </div>
        )}

        <Section title="Bagian A — Riwayat 14-30 Hari Terakhir" data={bagianA} handleChange={handleChange} disabled={isEditMode} jawaban={jawaban} error={errors.bagianA} />
        <Section title="Bagian B — Gejala Klinis" data={bagianB} handleChange={handleChange} disabled={isEditMode} jawaban={jawaban} error={errors.bagianB} />

        <Card title="Bagian C — Gambar Predileksi" error={fotoError}>
          <p className="text-sm text-gray-600 mb-2">Unggah Gambar Predileksi</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setFotoError("");
              if (!file) return;
              if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
                setFotoError("Format gambar harus JPG, JPEG, PNG, atau WEBP");
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                setFotoError("Ukuran Gambar Maksimal 2 MB");
                return;
              }
              setFoto(file);
              setPreview(URL.createObjectURL(file));
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {preview && <img src={preview} alt="preview" className="w-40 mt-4 rounded-lg border shadow-sm" />}
          {fotoError && <p className="text-sm text-red-600 mt-2">{fotoError}</p>}
        </Card>

        <Card title="Bagian D — Diagnosis">
          <select value={diagnosaManual} disabled={isEditMode} onChange={(e) => setDiagnosaManual(e.target.value)} className="border rounded-lg px-4 py-2 w-full outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Gunakan Rekomendasi Diagnosis</option>
            <option value="Scabies">Scabies</option>
            <option value="Kemungkinan_Scabies">Kemungkinan Scabies</option>
            <option value="Perlu_Evaluasi_Lebih_Lanjut">Perlu Evaluasi Lebih Lanjut</option>
            <option value="Bukan_Scabies">Bukan Scabies</option>
          </select>

          <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
            <p className="text-sm text-gray-600">Rekomendasi Sistem Berdasarkan Skor:</p>
            <p className={getDiagnosaStyle(diagnosaOtomatis)}>{diagnosaOtomatis.replaceAll("_", " ")}</p>
          </div>
        </Card>

        <Card title="Bagian E — Penanganan" error={errors.penanganan}>
          <div className="space-y-2">
            {opsiPenanganan.map((item) => (
              <label key={item.id_penanganan} className="flex gap-3 items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isEditMode}
                  checked={penanganan.includes(item.id_penanganan)}
                  onChange={(e) => {
                    if (e.target.checked) setPenanganan(prev => [...prev, item.id_penanganan]);
                    else setPenanganan(prev => prev.filter(id => id !== item.id_penanganan));
                    setErrors(prev => ({ ...prev, penanganan: "" }));
                  }}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-gray-700">{item.opsi_penanganan}</span>
              </label>
            ))}
          </div>
          {errors.penanganan && <p className="text-sm text-red-600 mt-2">{errors.penanganan}</p>}
        </Card>

        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
            {submitting ? "Menyimpan..." : isEditMode ? "Update Foto" : "Simpan Screening"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <label className="text-xs font-bold text-green-600 uppercase tracking-wider">{label}</label>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function Card({ title, children, error }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 border ${error ? "border-red-500" : "border-gray-100"}`}>
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Section({ title, data, handleChange, disabled, jawaban, error }) {
  return (
    <Card title={title} error={error}>
      {data.map((item, index) => (
        <div key={item.id_pertanyaan_screening} className="pb-4 border-b border-gray-50 last:border-0">
          <p className="mb-3 text-gray-700">{index + 1}. {item.pertanyaan}</p>
          <div className="flex gap-6">
            <Radio item={item} value="ya" handleChange={handleChange} disabled={disabled} jawaban={jawaban} />
            <Radio item={item} value="tidak" handleChange={handleChange} disabled={disabled} jawaban={jawaban} />
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
    </Card>
  );
}

function Radio({ item, value, handleChange, disabled, jawaban }) {
  const selected = jawaban.find(j => j.id_pertanyaan_screening === item.id_pertanyaan_screening);
  const isChecked = selected && selected.jawaban === (value === "ya");

  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-60' : ''}`}>
      <input
        type="radio"
        name={`pertanyaan-${item.id_pertanyaan_screening}`}
        value={value}
        checked={isChecked}
        disabled={disabled}
        onChange={(e) => handleChange(item.id_pertanyaan_screening, e.target.value)}
        className="w-4 h-4 accent-green-600"
      />
      <span className="capitalize text-gray-600">{value}</span>
    </label>
  );
}