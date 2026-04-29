import { useEffect, useRef } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

const DEFAULT_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const normalizeHtml = (html = "") => {
  const trimmed = html.trim();
  return trimmed === "<p><br></p>" ? "" : trimmed;
};

const setEditorHtml = (quill, html) => {
  const normalized = normalizeHtml(html);
  if (!normalized) {
    quill.setText("", "silent");
    return;
  }
  quill.clipboard.dangerouslyPasteHTML(normalized, "silent");
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  modules = DEFAULT_MODULES,
}) {
  const { quill, quillRef } = useQuill({
    modules,
    placeholder,
    theme: "snow",
  });
  const latestOnChangeRef = useRef(onChange);

  useEffect(() => {
    latestOnChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!quill) return;

    const initialValue = normalizeHtml(value);
    if (normalizeHtml(quill.root.innerHTML) !== initialValue) {
      setEditorHtml(quill, initialValue);
    }

    const handleTextChange = () => {
      latestOnChangeRef.current?.(normalizeHtml(quill.root.innerHTML));
    };

    quill.on("text-change", handleTextChange);
    return () => {
      quill.off("text-change", handleTextChange);
    };
  }, [quill]);

  useEffect(() => {
    if (!quill) return;
    const nextValue = normalizeHtml(value);
    if (normalizeHtml(quill.root.innerHTML) !== nextValue) {
      setEditorHtml(quill, nextValue);
    }
  }, [quill, value]);

  return <div ref={quillRef} className={className} />;
}
