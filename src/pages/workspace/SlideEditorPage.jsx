import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, RefreshCw, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { slidesApi } from "../../lib/docsApi";

const DEFAULT_SLIDE = { id: 1, title: "", content: "", bg: "#ffffff" };

const BG_COLORS = ["#ffffff", "#f8f7ff", "#f0f9ff", "#f0fdf4", "#fffbeb", "#fff1f2"];

export default function SlideEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [title, setTitle] = useState("Untitled presentation");
  const [slides, setSlides] = useState([{ ...DEFAULT_SLIDE }]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    slidesApi.getDeck(id)
      .then((data) => {
        setDeck(data);
        setTitle(data.name || "Untitled presentation");
        setSlides(data.content?.slides?.length ? data.content.slides : [{ ...DEFAULT_SLIDE }]);
      })
      .catch(() => toast.error("Couldn't load presentation"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function updateSlide(field, value) {
    setSlides((prev) => prev.map((s, i) => i === activeIdx ? { ...s, [field]: value } : s));
  }

  function addSlide() {
    const newSlide = { id: Date.now(), title: "", content: "", bg: "#ffffff" };
    setSlides((prev) => [...prev, newSlide]);
    setActiveIdx(slides.length);
  }

  function removeSlide(idx) {
    if (slides.length === 1) { toast.error("A presentation needs at least one slide"); return; }
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.min(prev, slides.length - 2));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await slidesApi.updateDeck(id, { name: title, content: { slides } });
      toast.success("Presentation saved");
    } catch { toast.error("Couldn't save presentation"); }
    finally { setSaving(false); }
  }

  const active = slides[activeIdx] || slides[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface shrink-0">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <input
          className="flex-1 font-display font-bold text-lg text-ink bg-transparent border-none outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled presentation"
        />
        <span className="text-xs text-faint">{activeIdx + 1} / {slides.length}</span>
        <button onClick={handleSave} disabled={saving || loading} className="btn-primary btn-sm">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted p-6"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="w-48 shrink-0 border-r border-line bg-canvas overflow-y-auto flex flex-col gap-2 p-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id || i}
                onClick={() => setActiveIdx(i)}
                className={`relative rounded-lg border-2 p-2 text-left transition-colors ${i === activeIdx ? "border-primary" : "border-line hover:border-primary-300"}`}
                style={{ backgroundColor: slide.bg || "#ffffff" }}
              >
                <p className="text-[10px] font-semibold text-ink truncate">{slide.title || `Slide ${i + 1}`}</p>
                <p className="text-[9px] text-muted truncate mt-0.5">{slide.content || "Empty"}</p>
                <span className="absolute top-1 right-1 text-[9px] text-faint">{i + 1}</span>
              </button>
            ))}
            <button onClick={addSlide} className="rounded-lg border-2 border-dashed border-line hover:border-primary-300 py-3 flex items-center justify-center gap-1 text-xs text-faint hover:text-primary transition-colors">
              <Plus size={13} /> Add slide
            </button>
          </div>

          <div className="flex-1 flex flex-col min-w-0 p-6 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-faint">Background:</span>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateSlide("bg", c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${active.bg === c ? "border-primary scale-110" : "border-line"}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <button
                onClick={() => removeSlide(activeIdx)}
                className="ml-auto btn-ghost btn-sm text-coral"
                title="Remove this slide"
              >
                <Trash2 size={14} /> Remove slide
              </button>
            </div>

            <div
              className="flex-1 rounded-2xl border border-line shadow-card flex flex-col p-8 gap-4 overflow-hidden"
              style={{ backgroundColor: active.bg || "#ffffff" }}
            >
              <input
                className="text-2xl font-display font-bold text-ink bg-transparent border-none outline-none border-b border-dashed border-line pb-2 focus:border-primary"
                placeholder="Slide title"
                value={active.title || ""}
                onChange={(e) => updateSlide("title", e.target.value)}
              />
              <textarea
                className="flex-1 text-base text-ink bg-transparent border-none outline-none resize-none focus:outline-none"
                placeholder="Slide content — type your notes, bullets, or body text here…"
                value={active.content || ""}
                onChange={(e) => updateSlide("content", e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx((i) => i - 1)}
                className="btn-ghost btn-sm disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                disabled={activeIdx === slides.length - 1}
                onClick={() => setActiveIdx((i) => i + 1)}
                className="btn-ghost btn-sm disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
