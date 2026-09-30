import { useEffect, useRef, useState } from "react";
import { Loader2, Search as SearchIcon, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import GroupAvatar from "./GroupAvatar";
import { groupApi } from "../../../lib/groupApi";

const ICON_CHOICES = ["💬", "🚀", "🛠️", "☕", "📊", "🧪", "🎯", "🔒", "👥", "📣"];

export default function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);

  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPeopleLoading(true);
    const timer = setTimeout(() => {
      groupApi
        .searchPeople(query.trim())
        .then((list) => {
          if (!cancelled) setPeople(list);
        })
        .catch(() => {
          if (!cancelled) setPeople([]);
        })
        .finally(() => {
          if (!cancelled) setPeopleLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function toggle(person) {
    setSelected((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person]
    );
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ name: "Group name is required" });
      nameRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const group = await groupApi.createGroup({
        name: trimmed,
        description: description.trim() || undefined,
        icon,
        memberIds: selected.map((p) => p.id),
      });
      toast.success(`"${group.name}" created`);
      onCreated(group);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setErrors(data.fields);
      toast.error(data?.error || "Couldn't create the group");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WorkspaceModal
      title="New group"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create group
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <GroupAvatar name={name || "New group"} icon={icon} size="xl" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="label" htmlFor="group-name">
              Group name <span className="text-coral">*</span>
            </label>
            <input
              id="group-name"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              maxLength={150}
              placeholder="e.g. DevOps Team"
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
            You can upload a custom image after the group is created.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="label" htmlFor="group-description">
            Description
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. DevOps and deployment discussion"
            className="input-field resize-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="label">Members</span>
            <span className="text-xs text-faint">
              {selected.length} selected — you'll be the admin
            </span>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((person) => (
                <span
                  key={person.id}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-primary-50 text-primary-700 pl-2.5 pr-1.5 py-1 text-xs font-medium"
                >
                  {person.name}
                  <button
                    type="button"
                    onClick={() => toggle(person)}
                    aria-label={`Remove ${person.name}`}
                    className="rounded-full p-0.5 hover:bg-primary-100"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by name, email, or department"
              aria-label="Search people"
              className="w-full rounded-pill border border-line bg-canvas pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-line divide-y divide-line">
            {peopleLoading && (
              <div className="flex items-center justify-center py-6 text-faint">
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}

            {!peopleLoading && people.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">
                No people found.
              </p>
            )}

            {!peopleLoading &&
              people.map((person) => {
                const isSelected = selected.some((p) => p.id === person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggle(person)}
                    aria-pressed={isSelected}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isSelected ? "bg-primary-50" : "hover:bg-canvas"
                    }`}
                  >
                    {person.profileImage ? (
                      <img
                        src={person.profileImage}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 shrink-0 flex items-center justify-center text-xs font-bold">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {person.department || person.email}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-primary-600 shrink-0" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </WorkspaceModal>
  );
}
