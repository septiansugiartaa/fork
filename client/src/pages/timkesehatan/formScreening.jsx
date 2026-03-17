import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FormScreening() {
  const { id, screeningId } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!screeningId;

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
  const [errors, setErrors] = useState({
    bagianA: "",
    bagianB: "",
    penanganan: ""
  });
  const [fotoError, setFotoError] = useState("");

  const anatomiAreaOptions = [
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

  const validateForm = () => {
    let newErrors = {
      bagianA: "",
      bagianB: "",
      penanganan: ""
    };

    let isValid = true;

    if (!isEditMode) {
      const jawabanA = jawaban.filter(j =>
        bagianA.some(a => a.id_pertanyaan_screening === j.id_pertanyaan_screening)
      );

      if (jawabanA.length !== bagianA.length) {
        newErrors.bagianA = "Semua pertanyaan Bagian A wajib dijawab";
        isValid = false;
      }

      for (const item of bagianB) {
        const found = jawaban.find(
          j => j.id_pertanyaan_screening === item.id_pertanyaan_screening
        );

        if (!found) {
          newErrors.bagianB = "Semua pertanyaan Bagian B wajib dijawab";
          isValid = false;
          break;
        }
      }

      if (penanganan.length === 0) {
        newErrors.penanganan = "Minimal pilih 1 penanganan";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const bagianBIds = bagianB.map(
      b => b.id_pertanyaan_screening
    );
    
    const totalYa = jawaban.filter(
      j =>
        bagianBIds.includes(j.id_pertanyaan_screening) &&
        j.jawaban === true
    ).length;

    let hasil = "Bukan_Scabies";

    if (totalYa > 4) hasil = "Scabies";
    else if (totalYa >= 2) hasil = "Perlu_Evaluasi_Lebih_Lanjut";

    setDiagnosaOtomatis(hasil);

  }, [jawaban, bagianB]);

  const fetchData = async () => {
    try {
      const [pertanyaanRes, santriRes, penangananRes, riwayatRes] = await Promise.all([
        api.get(
          "/timkesehatan/screening/pertanyaan"),
        api.get(
          `/timkesehatan/screening/santri/${id}/detail`),
        api.get(
          "/timkesehatan/screening/penanganan"),
        api.get(
          `/timkesehatan/screening/santri/${id}/screening`, {
          params: { page: 1, limit: 1 }
        })
      ]);

      setBagianA(pertanyaanRes.data.data.bagianA);
      setBagianB(pertanyaanRes.data.data.bagianB);
      setSantri(santriRes.data.data);
      setOpsiPenanganan(penangananRes.data.data);
      setRiwayatScreeningCount(riwayatRes.data?.pagination?.total || 0);

      // MODE EDIT
      if (isEditMode) {
        const screeningRes = await api.get(
          `/timkesehatan/screening/${screeningId}`);

        const screening = screeningRes.data.data;

        setJawaban(
          screening.detail_screening.map(d => ({
            id_pertanyaan_screening: d.id_pertanyaan_screening,
            jawaban: d.jawaban,
            nilai_number: d.nilai_number
          }))
        );

        setDiagnosaManual(screening.diagnosa);

        setPenanganan(
          screening.screening_penanganan.map(p => p.id_penanganan)
        );

        try {
          const parsedCatatan = screening.catatan ? JSON.parse(screening.catatan) : null;
          setAreaPredileksi(parsedCatatan?.area_predileksi || []);
        } catch {
          setAreaPredileksi([]);
        }

        if (screening.foto_predileksi) {
          setPreview(
            `/uploads/screening/${screening.foto_predileksi}`
          );
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (id_pertanyaan, value) => {
    if (isEditMode) return;

    setJawaban(prev => {
      const filtered = prev.filter(
        j => j.id_pertanyaan_screening !== id_pertanyaan
      );

      return [
        ...filtered,
        {
          id_pertanyaan_screening: id_pertanyaan,
          nilai_number: value === "" ? null : Number(value)
        }
      ];
    });
  };

  const handleChange = (id_pertanyaan, value) => {
    if (isEditMode) return;

    setJawaban((prev) => {
      const filtered = prev.filter(
        (j) => j.id_pertanyaan_screening !== id_pertanyaan
      );

      return [
        ...filtered,
        {
          id_pertanyaan_screening: id_pertanyaan,
          jawaban: value === "ya",
        },
      ];
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (fotoError) {
        setSubmitting(false);
        return;
      }

      const formData = new FormData();

      if (foto) {
        formData.append("foto", foto);
      }

      if (isEditMode) {

        await api.put(
          `/timkesehatan/screening/${screeningId}/foto`,
          formData
        );

      } else {

        if (!validateForm()) {
          setSubmitting(false);
          return;
        }

        const finalDiagnosa = diagnosaManual || diagnosaOtomatis;

        formData.append("id_santri", id);
        formData.append("jawaban", JSON.stringify(jawaban));
        formData.append("diagnosaManual", finalDiagnosa);
        formData.append("penanganan", JSON.stringify(penanganan));
        formData.append("areaPredileksi", JSON.stringify(areaPredileksi));

        await api.post(
          "/timkesehatan/screening/create",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
      }

      navigate(`/timkesehatan/daftarSantriScreening/${id}`);

    } catch (err) {
      console.error("Submit Error:", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !santri)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );

  const toggleAreaPredileksi = (key) => {
    if (isEditMode) return;
    setAreaPredileksi((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const isActiveArea = (key) => areaPredileksi.includes(key);

  const getDiagnosaStyle = (diagnosa) => {
    if (!diagnosa) return "text-gray-500";

    if (diagnosa === "Scabies")
      return "text-red-600 font-semibold";

    if (diagnosa === "Bukan_Scabies")
      return "text-green-600 font-semibold";

    if (
      diagnosa === "Kemungkinan_Scabies" ||
      diagnosa === "Perlu_Evaluasi_Lebih_Lanjut"
    )
      return "text-yellow-600 font-semibold";

    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold ml-4">
          {isEditMode ? "Update Foto Predileksi" : "Formulir Screening"}
        </h1>
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

        <Section
          title="Bagian A — Riwayat 14-30 Hari Terakhir"
          data={bagianA}
          handleChange={handleChange}
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

        <Card title="Bagian C — Gambar Predileksi" error={fotoError}>
          <p>Unggah Gambar Predileksi</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setFotoError("");

              if (!file) return;

              const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp"
              ];

              // VALIDASI FORMAT
              if (!allowedTypes.includes(file.type)) {
                setFoto(null);
                setPreview(null);
                setFotoError("Format gambar harus JPG, JPEG, PNG, atau WEBP");
                return;
              }

              // VALIDASI SIZE (2MB)
              if (file.size > 2 * 1024 * 1024) {
                setFoto(null);
                setPreview(null);
                setFotoError("Ukuran Gambar Maksimal 2 MB");
                return;
              }

              setFoto(file);
              setPreview(URL.createObjectURL(file));
            }}
            className="border rounded-lg p-2"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="w-40 mt-4 rounded-lg border"
            />
          )}
          {fotoError && (
            <p className="text-sm text-red-600 mt-2">
              {fotoError}
            </p>
          )}
        </Card>

        <Card title="Bagian C2 — Area Predileksi (Anatomi)">
          <p className="text-sm text-gray-600 mb-4">
            Centang area yang terindikasi. Area yang dipilih akan berubah warna pada diagram.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="grid grid-cols-2 gap-2">
              {anatomiAreaOptions.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isActiveArea(item.key)}
                    onChange={() => toggleAreaPredileksi(item.key)}
                    disabled={isEditMode}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex justify-center">
              <svg viewBox="0 0 160 380" className="w-40 h-auto">
                <circle cx="80" cy="30" r="18" fill={isActiveArea("kepala") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="72" y="48" width="16" height="14" rx="6" fill={isActiveArea("leher") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="50" y="62" width="60" height="44" rx="20" fill={isActiveArea("dada") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="58" y="104" width="44" height="46" rx="18" fill={isActiveArea("perut") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="30" y="70" width="18" height="95" rx="10" fill={isActiveArea("tangan_kiri") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="112" y="70" width="18" height="95" rx="10" fill={isActiveArea("tangan_kanan") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="66" y="150" width="28" height="30" rx="12" fill={isActiveArea("selangkangan") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="52" y="178" width="22" height="80" rx="12" fill={isActiveArea("paha_kiri") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="86" y="178" width="22" height="80" rx="12" fill={isActiveArea("paha_kanan") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="56" y="258" width="16" height="92" rx="10" fill={isActiveArea("betis_kiri") ? "#ff0c0c" : "#d1d5db"} />
                <rect x="88" y="258" width="16" height="92" rx="10" fill={isActiveArea("betis_kanan") ? "#ff0c0c" : "#d1d5db"} />
              </svg>
            </div>
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
            <option value="Perlu_Evaluasi_Lebih_Lanjut">
              Perlu Evaluasi Lebih Lanjut
            </option>
            <option value="Bukan_Scabies">Bukan Scabies</option>
          </select>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Rekomendasi Sistem Berdasarkan Skor:
            </p>
            <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
              <p className="text-sm text-gray-600">
                Rekomendasi Sistem Berdasarkan Skor:
              </p>
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
                      setPenanganan(prev => [...prev, item.id_penanganan]);
                    } else {
                      setPenanganan(prev =>
                        prev.filter(id => id !== item.id_penanganan)
                      );
                    }
                    setErrors(prev => ({ ...prev, penanganan: "" }));
                  }}
                  className="accent-green-600"
                />
                {item.opsi_penanganan}
              </label>
            ))}
          </div>

          {errors.penanganan && (
            <p className="text-sm text-red-600 mt-2">
              {errors.penanganan}
            </p>
          )}
        </Card>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl disabled:opacity-50"
          >
            {submitting
              ? "Menyimpan..."
              : isEditMode
              ? "Update Foto"
              : "Simpan Screening"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* COMPONENTS */

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
    <div className={`
      bg-white rounded-2xl shadow-lg p-6 space-y-4 border
      ${error ? "border-red-500" : "border-transparent"}
    `}>
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
            {index + 1}. {item.pertanyaan} <span className="text-red-500"> *</span>
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
              <Radio
                item={item}
                value="ya"
                handleChange={handleChange}
                disabled={disabled}
                jawaban={jawaban}
              />
              <Radio
                item={item}
                value="tidak"
                handleChange={handleChange}
                disabled={disabled}
                jawaban={jawaban}
              />
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </Card>
  );
}

function Radio({ item, value, handleChange, disabled, jawaban }) {
  const selected = jawaban.find(
    j => j.id_pertanyaan_screening === item.id_pertanyaan_screening
  );

  const isChecked = selected?.jawaban === (value === "ya");

  return (
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name={`pertanyaan-${item.id_pertanyaan_screening}`}
        value={value}
        checked={isChecked}
        disabled={disabled}
        onChange={(e) =>
          handleChange(item.id_pertanyaan_screening, e.target.value)
        }
      />
      {value === "ya" ? "Ya" : "Tidak"}
    </label>
  );
}

function NumberInput({ item, disabled, jawaban, handleNumberChange }) {
  const selected = jawaban.find(
    j => j.id_pertanyaan_screening === item.id_pertanyaan_screening
  );

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
          const val = e.target.value;

          if (val === "") {
            handleNumberChange(item.id_pertanyaan_screening, "");
            return;
          }

          const numberVal = Number(val);

          if (numberVal <= 30) {
            handleNumberChange(
              item.id_pertanyaan_screening,
              numberVal
            );
          }
        }}
      />
      <span className="bg-gray-100 border border-l-0 border-gray-500 rounded-r-lg px-3 py-2 text-gray-600">
        hari
      </span>
    </div>
  );
}