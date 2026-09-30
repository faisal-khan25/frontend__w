import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import GroupAvatar from "./GroupAvatar";
import { groupApi } from "../../../lib/groupApi";

const ICON_CHOICES = ["💬", "🚀", "🛠️", "☕", "📊", "🧪", "🎯", "🔒", "👥", "📣"];

export default function EditGroupModal({ group, onClose, onSaved }) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [icon, setIcon] = useState(group.iconType === "EMOJI" ? group.icon : ICON_CHOICES[0]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  function handleError(err, fallback) {
    const data = err.response?.data;
    if (data?.fields) setErrors(data.fields);
    toast.error(data?.error || fallback);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ name: "Group name is required" });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await groupApi.updateGroup(group.id, {
        name: trimmed,
        description: description.trim(),
        icon,
      });
      toast.success("Group updated");
      onSaved();
      onClose();
    } catch (err) {
      handleError(err, "Couldn't update the group");
    } finally {
      setSaving(false);
    }
  }

  async function uploadIcon(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaving(true);
    try {
      const updated = await groupApi.uploadIcon(group.id, file);
      toast.success("Group icon updated");
      setIcon(updated.icon);
      onSaved();
    } catch (err) {
      handleError(err, "Couldn't upload the icon");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceModal
      title="Edit group"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />} Save changes
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <GroupAvatar name={name || group.name} icon={icon} size="xl" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload a custom group image"
              title="Upload a custom image"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-soft hover:bg-primary-600"
            >
              <Upload size={12} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={uploadIcon}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="label" htmlFor="edit-group-name">
              Group name <span className="text-coral">*</span>
            </label>
            <input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className={`input-field ${errors.name ? "input-field-error" : ""}`}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="label">Icon</span>
          <div className="flex flex-wrap gap-1.5">
            {ICON_CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setIcon(choice)}
                aria-label={`Use ${choice} as the group icon`}
                aria-pressed={icon === choice}
                className={`h-9 w-9 rounded-xl text-base flex items-center justify-center transition-colors ${
                  icon === choice
                    ? "bg-primary-100 ring-2 ring-primary-300"
                    : "bg-canvas hover:bg-primary-50"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
          <p className="text-xs text-faint">
            Or upload a custom image using the button on the avatar above.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="label" htmlFor="edit-group-description">
            Description
          </label>
          <textarea
            id="edit-group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="What's this group for?"
            className="input-field resize-none"
          />
        </div>
      </div>
    </WorkspaceModal>
  );
}
