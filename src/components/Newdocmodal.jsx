import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import WorkspaceModal from "./workspace/common/WorkspaceModal";
import { docsApi, sheetsApi, slidesApi } from "../lib/docsApi";

const CONFIG = {
  doc: { label: "document", create: docsApi.createDoc, path: "docs" },
  sheet: { label: "spreadsheet", create: sheetsApi.createSheet, path: "sheets" },
  slide: { label: "presentation", create: slidesApi.createDeck, path: "slides" },
};

export default function NewDocModal({ kind, parentId = null, onClose }) {
  const { label, create, path } = CONFIG[kind];
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    setSaving(true);
    try {
      const result = await create({ name: name.trim() || undefined, parentId });
      toast.success(`New ${label} created`);
      onClose();
      navigate(`/workspace/${path}/${result.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Couldn't create ${label}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceModal
      title={`New ${label}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "Create"}
          </button>
        </>
      }
    >
      <label className="field-label mb-1.5 block">Name</label>
      <input
        autoFocus
        className="input-field"
        placeholder={`Untitled ${label}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
      />
    </WorkspaceModal>
  );
}