import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import { ArrowLeft, Loader2 } from "lucide-react";

const ANATOMI_AREA_OPTIONS = [
  { key: "kepala", label: "Kepala" },
  { key: "leher", label: "Leher" },
  { key: "dada", label: "Dada" },
  { key: "perut", label: "Perut" },
  { key: "tangan_kiri", label: "Tangan Kiri" },
  { key: "tangan_kanan", label: "Tangan Kanan" },
  { key: "selangkangan", label: "Selangkangan" },
  { key: "paha_kiri", label: "Paha Kiri" },
  { key: "paha_kanan", label: "Paha Kanan" },
  { key: "betis_kiri", label: "Betis Kiri" },
  { key: "betis_kanan", label: "Betis Kanan" }
];

const BENTUK_OPTIONS = [
  { value: "Ruam_Merah", label: "Ruam merah" },
  { value: "Bintil_Merah_Kecil", label: "Bintil merah kecil" },
  { value: "Terowongan_Kecil_di_Kulit", label: "Terowongan kecil di kulit" },
  { value: "Bintil_Bernanah", label: "Bintil bernanah" }
];

export default function FormScreening() {
  const { id, screeningId } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!screeningId;

  const [santri, setSantri] = useState(null);
  const [bagianA, setBagianA] = useState([]);
  const [bagianB, setBagianB] = useState([]);
  const [jawaban, setJawaban] = useState([]);
  const [diagnosaManual, setDiagnosaManual] = useState("");
  const [penanganan, setPenanganan] = useState([]);
  const [opsiPenanganan, setOpsiPenanganan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riwayatScreeningCount, setRiwayatScreeningCount] = useState(0);
  const [predileksiMap, setPredileksiMap] = useState({});
  const [errors, setErrors] = useState({
    bagianA: "",
    bagianB: "",
    penanganan: ""
  });

  const diagnosaOtomatis = useMemo(() => {
    const bagianBIds = bagianB.map((b) => b.id_pertanyaan_screening);
    const totalYa = jawaban.filter(
      (j) => bagianBIds.includes(j.id_pertanyaan_screening) && j.jawaban === true
    ).length;

    if (totalYa > 4) return "Scabies";
    if (totalYa >= 2) {
      return riwayatScreeningCount === 0
        ? "Kemungkinan_Scabies"
        : "Perlu_Evaluasi_Lebih_Lanjut";
    }
    return "Bukan_Scabies";
  }, [jawaban, bagianB, riwayatScreeningCount]);

  const fetchData = useCallback(async () => {
    try {
      const [pertanyaanRes, santriRes, penangananRes, riwayatRes] = await Promise.all([
        api.get("/timkesehatan/screening/pertanyaan"),
        api.get(`/timkesehatan/screening/santri/${id}/detail`),
        api.get("/timkesehatan/screening/penanganan"),
        api.get(`/timkesehatan/screening/santri/${id}/screening`, { params: { page: 1, limit: 1 } })
      ]);
  

      setBagianA(pertanyaanRes.data.data.bagianA);
      setBagianB(pertanyaanRes.data.data.bagianB);
      setSantri(santriRes.data.data);
      setOpsiPenanganan(penangananRes.data.data);
      setRiwayatScreeningCount(riwayatRes.data?.pagination?.total || 0);

      if (isEditMode) {
        const screeningRes = await api.get(`/timkesehatan/screening/${screeningId}`);
        const screening = screeningRes.data.data;

        setJawaban(
          screening.detail_screening.map((d) => ({
            id_pertanyaan_screening: d.id_pertanyaan_screening,
            jawaban: d.jawaban,
            nilai_number: d.nilai_number
          }))
        );

        setDiagnosaManual(screening.diagnosa);

        setPenanganan(screening.screening_penanganan.map((p) => p.id_penanganan));

        const currentPredileksi = {};
        (screening.screening_predileksi || []).forEach((item) => {
          currentPredileksi[item.area] = item.bentuk_kelainan || "Ruam_Merah";
        });

        if (Object.keys(currentPredileksi).length === 0) {
          try {
            const parsed = screening.catatan ? JSON.parse(screening.catatan) : null;
            (parsed?.area_predileksi || []).forEach((area) => {
              currentPredileksi[area] = "Ruam_Merah";
            });
          } catch {
            // noop
          }
        }

        setPredileksiMap(currentPredileksi);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, screeningId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNumberChange = (idPertanyaan, value) => {
    if (isEditMode) return;

    setJawaban((prev) => {
      const filtered = prev.filter((j) => j.id_pertanyaan_screening !== idPertanyaan);
      return [
        ...filtered,
        {
          id_pertanyaan_screening: idPertanyaan,
          nilai_number: value === "" ? null : Number(value)
        }
      ];
    });

    setErrors((prev) => ({ ...prev, bagianA: "", bagianB: "" }));
  };

  const handleChange = (idPertanyaan, value) => {
    if (isEditMode) return;

    setJawaban((prev) => {
      const filtered = prev.filter((j) => j.id_pertanyaan_screening !== idPertanyaan);
      return [
        ...filtered,
        {
          id_pertanyaan_screening: idPertanyaan,
          jawaban: value === "ya"
        }
      ];
    });

    setErrors((prev) => ({ ...prev, bagianA: "", bagianB: "" }));
  };

  const toggleAreaPredileksi = (key) => {
    if (isEditMode) return;

    setPredileksiMap((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = "Ruam_Merah";
      }
      return updated;
    });

  };

  const updateBentukKelainan = (key, bentuk) => {
    if (isEditMode) return;
    setPredileksiMap((prev) => ({ ...prev, [key]: bentuk }));
  };

  const validateForm = () => {
    const newErrors = {
      bagianA: "",
      bagianB: "",
      penanganan: ""
    };

    let isValid = true;

    const jawabanA = jawaban.filter((j) =>
      bagianA.some((a) => a.id_pertanyaan_screening === j.id_pertanyaan_screening)
    );

    if (jawabanA.length !== bagianA.length) {
      newErrors.bagianA = "Semua pertanyaan Bagian A wajib dijawab";
      isValid = false;
    }

    const jawabanB = jawaban.filter((j) =>
      bagianB.some((b) => b.id_pertanyaan_screening === j.id_pertanyaan_screening)
    );

    if (jawabanB.length !== bagianB.length) {
      newErrors.bagianB = "Semua pertanyaan Bagian B wajib dijawab";
      isValid = false;
    }

    if (penanganan.length === 0) {
      newErrors.penanganan = "Minimal pilih 1 penanganan";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      navigate(`/timkesehatan/daftarSantriScreening/${id}`);
      return;
    }

    try {
      setSubmitting(true);
      if (!validateForm()) {
        return;
      }

      const payload = {
        id_santri: Number(id),
        jawaban,
        diagnosaManual: diagnosaManual || diagnosaOtomatis,
        penanganan,
        predileksi: Object.entries(predileksiMap).map(([area, bentuk_kelainan]) => ({
          area,
          bentuk_kelainan
        }))
      };

      await api.post("/timkesehatan/screening/create", payload);
      navigate(`/timkesehatan/daftarSantriScreening/${id}`);
    } catch (err) {
      console.error("Submit Error:", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !santri) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="flex items-center gap-3 mb-6 px-3 sm:px-4 md:px-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isEditMode ? "Detail Screening" : "Formulir Screening"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8">
        <Card title="Data Diri Santri">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <Info label="Nama Santri" value={santri.nama} />
            <Info label="NIS" value={santri.nip} />
            <Info label="Kelas" value={santri.kelas?.kelas || "-"} />
            <Info label="Kamar" value={santri.kamar?.kamar || "-"} />
          </div>
        </Card>

        <Section
          title="Bagian A — Riwayat 14-30 Hari Terakhir"
          data={bagianA}
          handleChange={handleChange}
          handleNumberChange={handleNumberChange}
          disabled={isEditMode}
          jawaban={jawaban}
          error={errors.bagianA}
        />

        <Section
          title="Bagian B — Gejala Klinis"
          data={bagianB}
          handleChange={handleChange}
          handleNumberChange={handleNumberChange}
          disabled={isEditMode}
          jawaban={jawaban}
          error={errors.bagianB}
        />

        <Card title="Bagian C — Area Predileksi dan Bentuk Kelainan">
          <p className="text-sm text-gray-600 mb-4">
            Centang area anatomi yang terindikasi, lalu pilih bentuk kelainan kulit untuk tiap area yang dicentang.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {ANATOMI_AREA_OPTIONS.map((item) => {
                const checked = Boolean(predileksiMap[item.key]);

                return (
                  <div key={item.key} className="border rounded-xl p-3 bg-gray-50">
                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAreaPredileksi(item.key)}
                        disabled={isEditMode}
                      />
                      {item.label}
                    </label>

                    {checked && (
                      <select
                        className="mt-2 w-full border rounded-lg px-3 py-2 text-sm"
                        value={predileksiMap[item.key]}
                        disabled={isEditMode}
                        onChange={(e) => updateBentukKelainan(item.key, e.target.value)}
                      >
                        {BENTUK_OPTIONS.map((bentuk) => (
                          <option key={bentuk.value} value={bentuk.value}>
                            {bentuk.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            <AnatomiPreview predileksiMap={predileksiMap} />
          </div>
        </Card>

        <Card title="Bagian D — Diagnosis">
          <select
            value={diagnosaManual}
            disabled={isEditMode}
            onChange={(e) => setDiagnosaManual(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full"
          >
            <option value="">Gunakan Rekomendasi Diagnosis</option>
            <option value="Scabies">Scabies</option>
            <option value="Kemungkinan_Scabies">Kemungkinan Scabies</option>
            <option value="Perlu_Evaluasi_Lebih_Lanjut">Perlu Evaluasi Lebih Lanjut</option>
            <option value="Bukan_Scabies">Bukan Scabies</option>
          </select>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600">Rekomendasi Sistem Berdasarkan Skor:</p>
            <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
              <p className="text-sm text-gray-600">Rekomendasi Sistem Berdasarkan Skor:</p>
              <p className={getDiagnosaStyle(diagnosaOtomatis)}>
                {diagnosaOtomatis.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Bagian E — Penanganan" error={errors.penanganan}>
          <div className="space-y-2">
            {opsiPenanganan.map((item) => (
              <label key={item.id_penanganan} className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  disabled={isEditMode}
                  checked={penanganan.includes(item.id_penanganan)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPenanganan((prev) => [...prev, item.id_penanganan]);
                    } else {
                      setPenanganan((prev) => prev.filter((pid) => pid !== item.id_penanganan));
                    }
                    setErrors((prev) => ({ ...prev, penanganan: "" }));
                  }}
                  className="accent-green-600"
                />
                {item.opsi_penanganan}
              </label>
            ))}
          </div>

          {errors.penanganan && (
            <p className="text-sm text-red-600 mt-2">{errors.penanganan}</p>
          )}
        </Card>

        {!isEditMode && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Screening"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getDiagnosaStyle(diagnosa) {
  if (!diagnosa) return "text-gray-500";
  if (diagnosa === "Scabies") return "text-red-600 font-semibold";
  if (diagnosa === "Bukan_Scabies") return "text-green-600 font-semibold";
  if (diagnosa === "Kemungkinan_Scabies" || diagnosa === "Perlu_Evaluasi_Lebih_Lanjut") {
    return "text-yellow-600 font-semibold";
  }
  return "text-gray-600";
}

function Info({ label, value }) {
  return (
    <div>
      <label className="text-sm text-green-600">{label}</label>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Card({ title, children, error }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 space-y-4 border ${error ? "border-red-500" : "border-transparent"}`}>
      <h2 className="text-lg font-bold text-green-600">{title}</h2>
      {children}
    </div>
  );
}

function Section({ title, data, handleChange, handleNumberChange, disabled, jawaban, error }) {
  return (
    <Card title={title} error={error}>
      {data.map((item, index) => (
        <div key={item.id_pertanyaan_screening} className="pb-4">
          <p className="mb-3">
            {index + 1}. {item.pertanyaan} <span className="text-red-500">*</span>
          </p>

          {item.tipe_jawaban === "NUMBER" ? (
            <NumberInput
              item={item}
              disabled={disabled}
              jawaban={jawaban}
              handleNumberChange={handleNumberChange}
            />
          ) : (
            <div className="flex gap-6">
              <Radio item={item} value="ya" handleChange={handleChange} disabled={disabled} jawaban={jawaban} />
              <Radio item={item} value="tidak" handleChange={handleChange} disabled={disabled} jawaban={jawaban} />
            </div>
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </Card>
  );
}

function Radio({ item, value, handleChange, disabled, jawaban }) {
  const selected = jawaban.find((j) => j.id_pertanyaan_screening === item.id_pertanyaan_screening);
  const isChecked = selected?.jawaban === (value === "ya");
  return (
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name={`pertanyaan-${item.id_pertanyaan_screening}`}
        value={value}
        checked={isChecked}
        disabled={disabled}
        onChange={(e) => handleChange(item.id_pertanyaan_screening, e.target.value)}
      />
      {value === "ya" ? "Ya" : "Tidak"}
    </label>
  );
}

function NumberInput({ item, disabled, jawaban, handleNumberChange }) {
  const selected = jawaban.find((j) => j.id_pertanyaan_screening === item.id_pertanyaan_screening);
  return (
    <div className="flex items-center w-44">
      <input
        type="number"
        min="0"
        max="30"
        placeholder="Max 30"
        className="border border-r-0 border-gray-500 rounded-l-lg px-3 py-2 w-full outline-none placeholder:text-[14px] placeholder:italic"
        disabled={disabled}
        value={selected?.nilai_number ?? ""}
        onChange={(e) => {
          const value = e.target.value;

          if (value === "") {
            handleNumberChange(item.id_pertanyaan_screening, "");
            return;
          }

          const numberValue = Number(value);
          if (numberValue <= 30) {
            handleNumberChange(item.id_pertanyaan_screening, numberValue);
          }
        }}
      />
      <span className="bg-gray-100 border border-l-0 border-gray-500 rounded-r-lg px-3 py-2 text-gray-600">
        hari
      </span>
    </div>
  );
}

function AnatomiPreview({ predileksiMap }) {
  const isActive = (key) => Boolean(predileksiMap[key]);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex justify-center">
      <svg viewBox="0 0 160 380" className="w-40 h-auto">
        <circle cx="80" cy="30" r="18" fill={isActive("kepala") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="72" y="48" width="16" height="14" rx="6" fill={isActive("leher") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="50" y="62" width="60" height="44" rx="20" fill={isActive("dada") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="58" y="104" width="44" height="46" rx="18" fill={isActive("perut") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="30" y="70" width="18" height="95" rx="10" fill={isActive("tangan_kiri") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="112" y="70" width="18" height="95" rx="10" fill={isActive("tangan_kanan") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="66" y="150" width="28" height="30" rx="12" fill={isActive("selangkangan") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="52" y="178" width="22" height="80" rx="12" fill={isActive("paha_kiri") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="86" y="178" width="22" height="80" rx="12" fill={isActive("paha_kanan") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="56" y="258" width="16" height="92" rx="10" fill={isActive("betis_kiri") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="88" y="258" width="16" height="92" rx="10" fill={isActive("betis_kanan") ? "#ff0c0c" : "#d1d5db"} />
      </svg>
    </div>
  );
}
                      
    