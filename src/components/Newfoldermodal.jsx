import { useState } from "react";
import toast from "react-hot-toast";
import WorkspaceModal from "./workspace/common/WorkspaceModal";
import { driveApi } from "../lib/driveApi";

export default function NewFolderModal({ parentId = null, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    setSaving(true);
    try {
      await driveApi.createFolder({ name: name.trim(), parentId });
      toast.success("Folder created");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create folder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceModal
      title="New folder"
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
      <label className="field-label mb-1.5 block">Folder name</label>
      <input
        autoFocus
        className="input-field"
        placeholder="Untitled folder"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
      />
    </WorkspaceModal>
  );
}