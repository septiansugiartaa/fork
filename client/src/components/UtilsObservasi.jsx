export const getObservasiCategory = (score = 0) => {
  if (score >= 6) return "Baik";
  if (score >= 4) return "Cukup";
  return "Kurang";
};

export const formatObservasiWaktu = (waktu = "") => waktu || "-";

export const formatObservasiTindakLanjut = (value = "") => {
  const normalized = value
    .toString()
    .trim()
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (!normalized) return "-";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const getObservasiBadgeClass = (scoreOrCategory, variant = "solid") => {
  const category = typeof scoreOrCategory === "number" ? getObservasiCategory(scoreOrCategory) : scoreOrCategory;

  const variants = {
    solid: {
      Baik: "bg-green-100 text-green-700 border border-green-200",
      Cukup: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      Kurang: "bg-red-100 text-red-700 border border-red-200"
    },
    text: {
      Baik: "text-green-600 font-semibold",
      Cukup: "text-yellow-600 font-semibold",
      Kurang: "text-red-600 font-semibold"
    }
  };

  return variants[variant]?.[category] || "text-gray-600";
};

export const getObservasiScoreLabel = (score = 0) => `${score} - ${getObservasiCategory(score)}`;

export const getObservasiPdfColor = (scoreOrCategory) => {
  const category = typeof scoreOrCategory === "number" ? getObservasiCategory(scoreOrCategory) : scoreOrCategory;

  if (category === "Baik") return [21, 128, 61];
  if (category === "Cukup") return [161, 98, 7];
  if (category === "Kurang") return [185, 28, 28];
  return [55, 65, 81];
};