import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { docsApi } from "../../lib/docsApi";
import RichTextEditor from "../../components/workspace/common/RichTextEditor";
import ErrorState from "../../components/workspace/common/ErrorState";

export default function DocEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    docsApi.getDoc(id)
      .then((data) => {
        setDoc(data);
        setTitle(data.name || "Untitled document");
        setContent(data.content || "");
      })
      .catch(() => {
        setError("Couldn't load this document.");
        toast.error("Couldn't load document");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const requests = [docsApi.updateDocContent(id, content)];
      if (title.trim() && title !== doc?.name) {
        requests.push(docsApi.renameDoc(id, title.trim()));
      }
      const [contentResult] = await Promise.all(requests);
      setDoc((prev) => ({ ...prev, ...contentResult, name: title.trim() || prev?.name }));
      toast.success("Document saved");
    } catch { toast.error("Couldn't save document"); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <input
          className="flex-1 font-display font-bold text-xl text-ink bg-transparent border-none outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
        />
        <button onClick={handleSave} disabled={saving || loading} className="btn-primary btn-sm">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-muted"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
      )}
      {!loading && error && <ErrorState description={error} onRetry={load} />}
      {!loading && !error && (
        <RichTextEditor value={content} onChange={setContent} minHeight="calc(100vh - 220px)" />
      )}
    </div>
  );
}