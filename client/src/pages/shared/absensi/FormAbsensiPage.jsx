import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../config/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import AlertToast from "../../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";

export default function FormAbsensiPage({ rolePrefix }) {
    const { id, id_heading } = useParams();
    const navigate = useNavigate();
    const { message, showAlert, clearAlert } = useAlert();

    const [kamar, setKamar] = useState(null);
    const [santri, setSantri] = useState([]);
    const [items, setItems] = useState([]);
    const [jawaban, setJawaban] = useState([]);
    const [editMode,setEditMode]=useState(false)
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({
        checklist: ""
    });

    const validateForm = () => {
        let newErrors = {
            checklist: ""
        };

        let isValid = true;
        const wajibItems = items.slice(0, items.length - 1);
        for (const item of wajibItems) {
            const found = jawaban.find(
                j => j.id_item === item.id_item
            );

            if (!found) {
                newErrors.checklist = "Semua checklist wajib dijawab kecuali pertanyaan terakhir";
                isValid = false;
                break;
            }
        }
        setErrors(newErrors);
        return isValid;
    };

    useEffect(()=>{
        if(id_heading){
            setEditMode(true)
        }
        fetchData()
    },[id_heading])

    const fetchData = async () => {
        try {
            const [kamarRes, santriRes, itemRes] = await Promise.all([
                api.get(`/${rolePrefix}/absensi/kamar/${id}/detail`),
                api.get(`/${rolePrefix}/absensi/kamar/${id}/santri`),
                api.get(`/${rolePrefix}/absensi/item-kebersihan`)
            ])

            setKamar(kamarRes.data.data)
            setSantri(santriRes.data.data)
            setItems(itemRes.data.data)

            if(id_heading){
                fetchEditData()
            }

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchEditData = async () => {
        try{
            const res = await api.get(
            `/${rolePrefix}/absensi/${id_heading}`
            )

            const data = res.data.data
            const jawabanEdit = data.absensi_detail.map(d => ({
            id_item: d.id_item,
            status: d.status === "Tidak_Dilakukan"
                ? "Tidak Dilakukan"
                : "Dilakukan"
            }))
            setJawaban(jawabanEdit)

        }catch(err){
            console.error(err)
        }
    }

    const formatGender = (gender) => {
        if (!gender) return "-";
        if (gender === "Laki_laki") return "Laki-laki";
        if (gender === "Perempuan") return "Perempuan";
        return gender;
    };

    const handleChange = (itemId, value) => {
        setJawaban(prev => {
        const filtered = prev.filter(
            j => j.id_item !== itemId
        );
        return [
            ...filtered,
            {
            id_item: itemId,
            status: value
            }
        ];
        });
    };

    const handleSubmit = async () => {
        if (!validateForm()) return
        try{
            setSubmitting(true)
            let res
            if(editMode){
                res = await api.put(
                    `/${rolePrefix}/absensi/update/${id_heading}`,
                    {
                    id_kamar:id,
                    jawaban:JSON.stringify(jawaban)
                    }
                )
    
            } else{
                res = await api.post(
                    `/${rolePrefix}/absensi/create`,
                    {
                    id_kamar:id,
                    jawaban:JSON.stringify(jawaban)
                    }
                )
            }
            showAlert("success", res.data.message)
            navigate(`/${rolePrefix}/daftarAbsensiKamar/${id}`)
        }catch(err){
            if(err.response?.data?.message){
                showAlert("error", err.response.data.message)
            }else{
                showAlert("error", "Gagal menyimpan absensi")
            }
        }finally{
            setSubmitting(false)
        }
    }

    if (loading)
        return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-green-600" size={40}/>
        </div>
        );

        const formatWaktu = (waktu) => {
            if (!waktu) return "";
            return waktu.replaceAll("_", " ");
        };
    return (

        <div className="min-h-screen bg-gray-50 pb-10">
            <AlertToast message={message} onClose={clearAlert} />

        <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24}/>
            </button>
            <h1 className="text-2xl font-bold ml-4">
                {editMode ? "Edit Absensi Kebersihan" : "Form Absensi Kebersihan"}
            </h1>
        </div>

        <div className="max-w-6xl mx-auto px-4 space-y-8">

            {/* DATA KAMAR */}

            <Card title="Data Kamar">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                <Info label="Nama Kamar" value={kamar.kamar}/>
                <Info label="Gender" value={formatGender(kamar.gender)}/>
                <Info label="Lokasi" value={kamar.lokasi || "-"}/>

            </div>

            </Card>

            {/* DAFTAR SANTRI */}
            <Card title="Daftar Santri">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                    {santri.map(s => (
                        <div
                            key={s.users.id}
                            className="p-3 border rounded-lg"
                        >
                            <p className="font-semibold">
                            {s.users.nama}
                            </p>
                            <p className="text-sm text-gray-500">
                            {s.users.nip}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* CHECKLIST */}
            <Card title="Checklist Kebersihan" error={errors.checklist}>
                {items.map((item, index) => (
                    <div key={item.id_item} className="pb-4">
                        <p className="mb-3">
                            {index + 1}. {item.nama_item}
                            {item.waktu_pengerjaan && (
                                <span className="ml-2 text-gray-500 italic text-sm">
                                ({formatWaktu(item.waktu_pengerjaan)})
                                </span>
                            )}
                        </p>

                        <div className="flex gap-6">
                            <Radio
                                item={item}
                                value="Dilakukan"
                                handleChange={handleChange}
                                jawaban={jawaban}
                            />

                                <Radio
                                item={item}
                                value="Tidak Dilakukan"
                                handleChange={handleChange}
                                jawaban={jawaban}
                            />
                        </div>
                    </div>
                ))}
                {errors.checklist && (
                    <p className="text-sm text-red-600 mt-2">
                        {errors.checklist}
                    </p>
                )}
            </Card>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
                >
                    {submitting ? "Menyimpan..." : "Simpan Absensi"}
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

    function Radio({ item, value, handleChange, jawaban }) {
        const selected = jawaban.find(
            j => j.id_item === item.id_item
        );

        const isChecked = selected?.status === value;

        return (
            <label className="flex items-center gap-2">

            <input
                type="radio"
                name={`item-${item.id_item}`}
                checked={isChecked}
                onChange={() =>
                handleChange(item.id_item, value)
                }
            />

            {value}

            </label>
        );
    }
