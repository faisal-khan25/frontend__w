import { useEffect, useState } from "react";
import { Check, Loader2, Search as SearchIcon } from "lucide-react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import { groupApi } from "../../../lib/groupApi";

export default function AddMembersModal({ group, onClose, onAdded }) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      groupApi
        .searchPeople(query.trim(), { groupId: group.id })
        .then((list) => {
          if (!cancelled) setPeople(list);
        })
        .catch(() => {
          if (!cancelled) setPeople([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, group.id]);

  function toggle(person) {
    if (person.isMember) return;
    setSelected((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person]
    );
  }

  async function submit() {
    if (!selected.length) return;
    setSubmitting(true);
    try {
      await groupApi.addMembers(
        group.id,
        selected.map((p) => p.id)
      );
      toast.success(`${selected.length} member${selected.length > 1 ? "s" : ""} added`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't add members");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WorkspaceModal
      title={`Add members to ${group.name}`}
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
            onClick={submit}
            disabled={!selected.length || submitting}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Add {selected.length || ""} member{selected.length === 1 ? "" : "s"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((person) => (
              <span
                key={person.id}
                className="inline-flex items-center gap-1.5 rounded-pill bg-primary-50 text-primary-700 pl-2.5 pr-1.5 py-1 text-xs font-medium"
              >
                {person.name}
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

        <div className="max-h-80 overflow-y-auto rounded-xl border border-line divide-y divide-line">
          {loading && (
            <div className="flex items-center justify-center py-8 text-faint">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}

          {!loading && people.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">No people found.</p>
          )}

          {!loading &&
            people.map((person) => {
              const isSelected = selected.some((p) => p.id === person.id);
              const disabled = person.isMember;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => toggle(person)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : isSelected
                      ? "bg-primary-50"
                      : "hover:bg-canvas"
                  }`}
                >
                  {person.profileImage ? (
                    <img
                      src={person.profileImage}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 shrink-0 flex items-center justify-center text-xs font-bold">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {person.name}
                      {person.membershipStatus === "LEFT" && (
                        <span className="text-faint font-normal"> · previously left</span>
                      )}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {person.email}
                      {person.department ? ` · ${person.department}` : ""}
                      {person.role ? ` · ${person.role}` : ""}
                    </p>
                  </div>
                  {disabled ? (
                    <span className="badge shrink-0 text-[11px]">Already in</span>
                  ) : (
                    isSelected && <Check size={16} className="text-primary-600 shrink-0" />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </WorkspaceModal>
  );
}
