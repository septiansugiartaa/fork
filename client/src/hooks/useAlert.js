import { useState, useCallback } from "react";

/**
 * useAlert — menggantikan 43 deklarasi showAlert yang tersebar di seluruh halaman.
 *
 * Cara pakai:
 *   const { message, showAlert, clearAlert } = useAlert();
 *
 * Di JSX, render <AlertToast message={message} onClose={clearAlert} />
 */
export function useAlert(duration = 3000) {
  const [message, setMessage] = useState({ type: "", text: "" });

  const showAlert = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), duration);
  }, [duration]);

  const clearAlert = useCallback(() => {
    setMessage({ type: "", text: "" });
  }, []);

  return { message, showAlert, clearAlert };
}
