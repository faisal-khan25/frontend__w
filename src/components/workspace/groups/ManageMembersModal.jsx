import { useEffect, useState } from "react";
import { Loader2, Shield, ShieldOff, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { groupApi } from "../../../lib/groupApi";

export default function ManageMembersModal({ group, currentUserId, onClose, onChanged }) {
  const [members, setMembers] = useState(group.members || []);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function load(includeInactive = showHistory) {
    setLoading(true);
    try {
      const list = await groupApi.listMembers(group.id, { includeInactive });
      setMembers(list);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(showHistory);
  }, [showHistory]);

  function handleError(err, fallback) {
    toast.error(err.response?.data?.error || fallback);
  }

  async function toggleRole(member) {
    const nextRole = member.role === "GROUP_ADMIN" ? "MEMBER" : "GROUP_ADMIN";
    setBusyUserId(member.userId);
    try {
      await groupApi.changeMemberRole(group.id, member.userId, nextRole);
      toast.success(
        `${member.user?.name || "Member"} is now ${
          nextRole === "GROUP_ADMIN" ? "a group admin" : "a member"
        }`
      );
      await load();
      onChanged();
    } catch (err) {
      handleError(err, "Couldn't change that role");
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeMember(member) {
    setBusyUserId(member.userId);
    try {
      await groupApi.removeMember(group.id, member.userId);
      toast.success(`${member.user?.name || "Member"} removed`);
      await load();
      onChanged();
    } catch (err) {
      handleError(err, "Couldn't remove that member");
    } finally {
      setBusyUserId(null);
      setConfirm(null);
    }
  }

  return (
    <>
      <WorkspaceModal title={`Members of ${group.name}`} onClose={onClose} size="lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              {members.filter((m) => m.status !== "LEFT").length} active member
              {members.filter((m) => m.status !== "LEFT").length === 1 ? "" : "s"}
            </p>
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
                className="rounded border-line"
              />
              Show past members
            </label>
          </div>

          <div className="rounded-xl border border-line divide-y divide-line overflow-hidden max-h-[26rem] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 text-faint">
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}

            {!loading &&
              members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const busy = busyUserId === member.userId;
                const isAdmin = member.role === "GROUP_ADMIN";
                const isPast = member.status === "LEFT";

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 px-3 py-2.5 bg-surface ${isPast ? "opacity-60" : ""}`}
                  >
                    {member.user?.profileImage ? (
                      <img
                        src={member.user.profileImage}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 shrink-0 flex items-center justify-center text-xs font-bold">
                        {(member.user?.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {member.user?.name || "Unknown"}
                        {isSelf && <span className="text-faint font-normal"> (you)</span>}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {member.user?.email}
                        {member.user?.department ? ` · ${member.user.department}` : ""}
                        {member.appRole ? ` · ${member.appRole}` : ""}
                      </p>
                    </div>

                    {isPast ? (
                      <span className="badge shrink-0 text-[11px]">Left</span>
                    ) : (
                      <>
                        {isAdmin && <span className="badge-primary shrink-0">Group admin</span>}

                        {!isSelf && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {busy ? (
                              <Loader2 size={14} className="animate-spin text-faint mx-2" />
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleRole(member)}
                                  title={isAdmin ? "Demote to member" : "Promote to group admin"}
                                  aria-label={
                                    isAdmin
                                      ? `Demote ${member.user?.name} to member`
                                      : `Promote ${member.user?.name} to group admin`
                                  }
                                  className="p-1.5 rounded-lg text-faint hover:text-primary-600 hover:bg-primary-50"
                                >
                                  {isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirm({
                                      member,
                                      title: "Remove member",
                                      message: `Remove ${member.user?.name} from "${group.name}"?`,
                                    })
                                  }
                                  title="Remove from group"
                                  aria-label={`Remove ${member.user?.name}`}
                                  className="p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg"
                                >
                                  <UserMinus size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </WorkspaceModal>

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger
          confirmLabel="Remove"
          onClose={() => setConfirm(null)}
          onConfirm={() => removeMember(confirm.member)}
        />
      )}
    </>
  );
}
