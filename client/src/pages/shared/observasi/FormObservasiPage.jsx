import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Loader2 } from "lucide-react";
import api from "../../../config/api";
import ObservasiScoreTable from "../../../components/SkorObservasi";
import {
  getObservasiBadgeClass,
  getObservasiCategory,
  getObservasiScoreLabel
} from "../../../components/UtilsObservasi";

function Card({ title, children, error }) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm border p-5 sm:p-6 ${error ? "border-red-500" : "border-gray-100"}`}>
      <h2 className="text-lg sm:text-xl font-bold text-green-600 mb-6">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
      {error ? <p className="text-sm text-red-600 mt-4">{error}</p> : null}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-green-600/80 mb-1">{label}</p>
      <p className="font-semibold text-gray-800">{value || "-"}</p>
    </div>
  );
}

const OTHER_TINDAK_LANJUT_VALUE = "LAINNYA";

const normalizeTindakLanjutValue = (value = "") => value
  .toString()
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "") || OTHER_TINDAK_LANJUT_VALUE;

const getTindakLanjutOptionValue = (option = {}) => {
  if (option.isCustom) return OTHER_TINDAK_LANJUT_VALUE;
  return normalizeTindakLanjutValue(option.value);
};

const buildTindakLanjutPayload = (selectedValues = [], customText = "") => ({
  selected: Array.from(new Set(selectedValues.map(normalizeTindakLanjutValue))),
  customText: customText.trim()
});

export default function FormObservasiPage({ rolePrefix }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [santri, setSantri] = useState(null);
  const [pertanyaan, setPertanyaan] = useState([]);
  const [opsiWaktu, setOpsiWaktu] = useState([]);
  const [opsiTindakLanjut, setOpsiTindakLanjut] = useState([]);
  const [waktu, setWaktu] = useState("");
  const [jawaban, setJawaban] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState([]);
  const [tindakLanjutLainnya, setTindakLanjutLainnya] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ waktu: "", pertanyaan: "", tindakLanjut: "" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pertanyaanRes, santriRes, waktuRes, tindakLanjutRes] = await Promise.all([
          api.get(`/${rolePrefix}/observasi/pertanyaan`),
          api.get(`/${rolePrefix}/observasi/santri/${id}/detail`),
          api.get(`/${rolePrefix}/observasi/waktu`),
          api.get(`/${rolePrefix}/observasi/tindak-lanjut`)
        ]);

        setPertanyaan(pertanyaanRes.data.data || []);
        setSantri(santriRes.data.data);
        setOpsiWaktu(waktuRes.data.data || []);
        setOpsiTindakLanjut(tindakLanjutRes.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, rolePrefix]);

  const totalYa = useMemo(
    () => jawaban.filter((item) => item.jawaban === true).length,
    [jawaban]
  );

  const skorKategori = useMemo(() => getObservasiCategory(totalYa), [totalYa]);

  const handleJawabanChange = (idPertanyaan, value) => {
    setJawaban((prev) => {
      const filtered = prev.filter((item) => item.id_pertanyaan_observasi !== idPertanyaan);
      return [...filtered, { id_pertanyaan_observasi: idPertanyaan, jawaban: value === "ya" }];
    });
    setErrors((prev) => ({ ...prev, pertanyaan: "" }));
  };

  const handleToggleTindakLanjut = (value, checked) => {
    setTindakLanjut((prev) => {
        if (checked) return Array.from(new Set([...prev, value]));
        return prev.filter((item) => item !== value);
    });
    if (value === OTHER_TINDAK_LANJUT_VALUE && !checked) {
        setTindakLanjutLainnya("");
    }
    setErrors((prev) => ({ ...prev, tindakLanjut: "" }));
  };

  const validateForm = () => {
    const newErrors = { waktu: "", pertanyaan: "", tindakLanjut: "" };
    let isValid = true;

    if (!waktu) {
      newErrors.waktu = "Waktu observasi wajib dipilih";
      isValid = false;
    }

    if (jawaban.length !== pertanyaan.length) {
      newErrors.pertanyaan = "Semua pertanyaan observasi wajib dijawab";
      isValid = false;
    }

    if (tindakLanjut.length === 0) {
      newErrors.tindakLanjut = "Minimal pilih 1 tindak lanjut";
      isValid = false;
    }

    if (tindakLanjut.includes(OTHER_TINDAK_LANJUT_VALUE) && !tindakLanjutLainnya.trim()) {
    newErrors.tindakLanjut = "Tindak lanjut lainnya wajib diisi";
    isValid = false;
  }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
        setSubmitting(true);
        const tindakLanjutPayload = buildTindakLanjutPayload(tindakLanjut, tindakLanjutLainnya);

        await api.post(`/${rolePrefix}/observasi/create`, {
        id_santri: Number(id),
        waktu,
        jawaban,
        catatan,
        tindakLanjut: tindakLanjutPayload
        });
        navigate(`/${rolePrefix}/daftarSantriObservasi/${id}`);
    } catch (error) {
        console.error(error.response?.data || error);
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
    <div className="min-h-screen bg-gray-50 pb-10 space-y-6">
      <div className="flex items-center gap-3 mb-6 px-3 sm:px-4 md:px-6">
        <button onClick={() => navigate(`/${rolePrefix}/daftarSantriObservasi/${id}`)}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Form Observasi Cuci Tangan</h1>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8">
        <Card title="Data Diri Santri">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Info label="Nama Santri" value={santri.nama} />
            <Info label="NIS" value={santri.nip} />
            <Info label="Kelas" value={santri.kelas?.kelas || "-"} />
            <Info label="Kamar" value={santri.kamar?.kamar || "-"} />
          </div>
        </Card>

        <Card title="Bagian A — Waktu Observasi" error={errors.waktu}>
          <div className="max-w-md">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock3 size={16} className="text-green-600" />
              Pilih waktu pelaksanaan observasi
            </label>
            <select
              value={waktu}
              onChange={(event) => {
                setWaktu(event.target.value);
                setErrors((prev) => ({ ...prev, waktu: "" }));
              }}
              className={`w-full rounded-2xl border px-4 py-3 outline-none bg-white ${errors.waktu ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-green-500"}`}
            >
              <option value="">Pilih waktu observasi</option>
              {opsiWaktu.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card title="Bagian B — Pertanyaan Perilaku Cuci Tangan" error={errors.pertanyaan}>
          <div className="space-y-4">
            {pertanyaan.map((item, index) => {
              const selected = jawaban.find((entry) => entry.id_pertanyaan_observasi === item.id_pertanyaan_observasi);
              return (
                <div key={item.id_pertanyaan_observasi} className="pb-4 border-b border-gray-50 last:border-0">
                  <p className="text-gray-800 font-medium mb-3">
                    {index + 1}. {item.pertanyaan} <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["ya", "tidak"].map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${
                          selected?.jawaban === (option === "ya")
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pertanyaan-${item.id_pertanyaan_observasi}`}
                          value={option}
                          checked={selected?.jawaban === (option === "ya")}
                          onChange={(event) => handleJawabanChange(item.id_pertanyaan_observasi, event.target.value)}
                          className="text-green-600"
                        />
                        <span className="font-medium">{option === "ya" ? "Ya" : "Tidak"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Bagian C — Skor Penilaian">
          <div className="space-y-5">
            <ObservasiScoreTable />
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
              <p className="text-sm text-gray-500 mb-2">Skor Otomatis</p>
              <div className={`inline-flex items-center rounded-2xl px-4 py-3 text-sm sm:text-base font-bold ${getObservasiBadgeClass(skorKategori)}`}>
                {getObservasiScoreLabel(totalYa)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Skor dihitung otomatis berdasarkan total jawaban Ya pada bagian pertanyaan observasi.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Bagian D — Catatan Pengamat">
          <textarea
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500 resize-none"
            placeholder="Tambahkan catatan pengamat bila diperlukan..."
          />
        </Card>

        <Card title="Bagian E — Tindak Lanjut" error={errors.tindakLanjut}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opsiTindakLanjut.map((item) => {
                    const optionValue = getTindakLanjutOptionValue(item);
                    const isChecked = tindakLanjut.includes(optionValue);
                    return (
                    <label
                        key={optionValue}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${
                        isChecked ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"
                        }`}
                    >
                        <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => handleToggleTindakLanjut(optionValue, event.target.checked)}
                        className="rounded text-green-600"
                        />
                        <span className="text-gray-700 font-medium">{item.label}</span>
                    </label>
                    );
                })}
                </div>

                {tindakLanjut.includes(OTHER_TINDAK_LANJUT_VALUE) && (
                <div className="space-y-2">
                    <label htmlFor="tindak-lanjut-lainnya" className="text-sm font-medium text-gray-700">
                    Isi tindak lanjut lainnya <span className="text-red-500">*</span>
                    </label>
                    <textarea
                    id="tindak-lanjut-lainnya"
                    value={tindakLanjutLainnya}
                    onChange={(event) => {
                        setTindakLanjutLainnya(event.target.value);
                        setErrors((prev) => ({ ...prev, tindakLanjut: "" }));
                    }}
                    rows={3}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        errors.tindakLanjut ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                    }`}
                    placeholder="Contoh: Pendampingan tambahan oleh wali asrama setelah salat Magrib."
                    />
                </div>
                )}
            </div>
            </Card>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-3 rounded-xl font-semibold shadow-lg transition inline-flex items-center gap-2"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            Submit Observasi
          </button>
        </div>
      </div>
    </div>
  );
}
