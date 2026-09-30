import { useState } from "react";
import {
  LogOut,
  Pencil,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import ConfirmDialog from "../common/ConfirmDialog";
import GroupAvatar from "./GroupAvatar";
import EditGroupModal from "./EditGroupModal";
import AddMembersModal from "./AddMembersModal";
import ManageMembersModal from "./ManageMembersModal";
import { groupApi } from "../../../lib/groupApi";

export default function GroupInfoPanel({ group, currentUserId, onClose, onChanged, onLeft }) {
  const isAdmin = Boolean(group.isGroupAdmin) || group.myRole === "GROUP_ADMIN";

  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [confirm, setConfirm] = useState(null);

  async function leaveGroup() {
    try {
      await groupApi.leaveGroup(group.id);
      toast.success(`You left "${group.name}"`);
      onLeft(group.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't leave the group");
    } finally {
      setConfirm(null);
    }
  }

  async function deleteGroup() {
    try {
      await groupApi.deleteGroup(group.id);
      toast.success(`"${group.name}" deleted`);
      onLeft(group.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't delete the group");
    } finally {
      setConfirm(null);
    }
  }

  const previewMembers = (group.members || []).slice(0, 6);

  return (
    <>
      <WorkspaceModal title="Group details" onClose={onClose} size="lg">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <GroupAvatar name={group.name} icon={group.icon} iconType={group.iconType} size="xl" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-bold text-ink text-lg truncate">
                  {group.name}
                </h3>
                {isAdmin && (
                  <button onClick={() => setShowEdit(true)} className="btn-outline btn-sm shrink-0">
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>
              <p className="text-sm text-muted mt-1">{group.description || "No description"}</p>
              <p className="text-xs text-faint mt-2">
                {group.memberCount} member{group.memberCount === 1 ? "" : "s"} · Created{" "}
                {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="label">Members</h4>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={() => setShowAdd(true)} className="btn-outline btn-sm">
                    <UserPlus size={13} /> Add
                  </button>
                )}
                <button onClick={() => setShowManage(true)} className="btn-outline btn-sm">
                  <UserCog size={13} /> {isAdmin ? "Manage" : "View"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
              {previewMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface">
                  {member.user?.profileImage ? (
                    <img
                      src={member.user.profileImage}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 shrink-0 flex items-center justify-center text-xs font-bold">
                      {(member.user?.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {member.user?.name || "Unknown"}
                      {member.userId === currentUserId && (
                        <span className="text-faint font-normal"> (you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {member.user?.department || member.user?.email}
                    </p>
                  </div>
                  {member.role === "GROUP_ADMIN" && (
                    <span className="badge-primary shrink-0">Admin</span>
                  )}
                </div>
              ))}
              {(group.memberCount || 0) > previewMembers.length && (
                <button
                  onClick={() => setShowManage(true)}
                  className="w-full px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 text-left"
                >
                  View all {group.memberCount} members →
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
            <button
              onClick={() =>
                setConfirm({
                  type: "leave",
                  title: "Leave group",
                  message: `Leave "${group.name}"? You'll stop receiving its messages.`,
                })
              }
              className="btn-outline btn-sm"
            >
              <LogOut size={13} /> Leave group
            </button>

            {isAdmin && (
              <button
                onClick={() =>
                  setConfirm({
                    type: "delete",
                    title: "Delete group",
                    message: `Delete "${group.name}" for everyone? This can't be undone.`,
                  })
                }
                className="btn-coral btn-sm"
              >
                <Trash2 size={13} /> Delete group
              </button>
            )}
          </div>
        </div>
      </WorkspaceModal>

      {showEdit && (
        <EditGroupModal group={group} onClose={() => setShowEdit(false)} onSaved={onChanged} />
      )}

      {showAdd && (
        <AddMembersModal group={group} onClose={() => setShowAdd(false)} onAdded={onChanged} />
      )}

      {showManage && (
        <ManageMembersModal
          group={group}
          currentUserId={currentUserId}
          onClose={() => setShowManage(false)}
          onChanged={onChanged}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger
          confirmLabel={confirm.type === "leave" ? "Leave" : "Delete"}
          onClose={() => setConfirm(null)}
          onConfirm={() => (confirm.type === "leave" ? leaveGroup() : deleteGroup())}
        />
      )}
    </>
  );
}
