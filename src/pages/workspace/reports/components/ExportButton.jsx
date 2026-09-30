import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { reportsApi } from "../../../../lib";

export default function ExportButton({ type, filters = {} }) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const { blob, fileName } = await reportsApi.exportReport(type, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't export this report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn-outline btn-sm" onClick={handleExport} disabled={busy}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Export CSV
    </button>
  );
}
