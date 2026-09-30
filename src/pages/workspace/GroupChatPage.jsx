import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GroupList from "../../components/workspace/groups/GroupList";
import GroupChatWindow from "../../components/workspace/groups/GroupChatWindow";
import CreateGroupModal from "../../components/workspace/groups/CreateGroupModal";
import GroupInfoPanel from "../../components/workspace/groups/GroupInfoPanel";
import useGroupChat from "../../hooks/useGroupChat";
import useAuth from "../../hooks/useAuth";

export default function GroupChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    groups,
    groupsLoading,
    groupsError,
    loadGroups,
    canCreateGroup,
    activeGroupId,
    setActiveGroupId,
    activeGroup,
    refreshActiveGroup,
    messages,
    messagesLoading,
    hasMore,
    loadingMore,
    loadOlderMessages,
    sendMessage,
    sendAttachment,
    retryAttachment,
    typingUsers,
    notifyTyping,
    notifyStoppedTyping,
  } = useGroupChat();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const groupParam = searchParams.get("g");
  useEffect(() => {
    if (groupParam && groupParam !== activeGroupId) {
      setActiveGroupId(groupParam);
    }
  }, [groupParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGroups({ search: search.trim() || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadGroups]);

  function openGroup(groupId) {
    setActiveGroupId(groupId);
    setSearchParams(groupId ? { g: groupId } : {}, { replace: true });
  }

  function closeGroup() {
    setActiveGroupId(null);
    setSearchParams({}, { replace: true });
  }

  function handleCreated(group) {
    loadGroups();
    openGroup(group.id);
  }

  function handleLeftGroup() {
    closeGroup();
    loadGroups();
  }

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)]">
        <GroupList
          groups={groups}
          loading={groupsLoading}
          error={groupsError}
          activeGroupId={activeGroupId}
          onSelect={openGroup}
          onCreate={() => setShowCreate(true)}
          canCreateGroup={canCreateGroup}
          search={search}
          onSearchChange={setSearch}
          onRetry={() => loadGroups({ search: search.trim() || undefined })}
          className={activeGroupId ? "hidden md:flex" : "flex w-full md:w-72"}
        />

        <GroupChatWindow
          group={activeGroup}
          messages={messages}
          loading={messagesLoading}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadOlder={loadOlderMessages}
          onSend={sendMessage}
          onSendAttachment={sendAttachment}
          onRetryAttachment={retryAttachment}
          typingUsers={typingUsers}
          onTyping={notifyTyping}
          onStoppedTyping={notifyStoppedTyping}
          currentUserId={user?.id}
          onOpenInfo={() => setShowInfo(true)}
          onBack={closeGroup}
          onMessageDeleted={() => {
          }}
          className={activeGroupId ? "flex" : "hidden md:flex"}
        />
      </div>

      {showCreate && canCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {showInfo && activeGroup && (
        <GroupInfoPanel
          group={activeGroup}
          currentUserId={user?.id}
          onClose={() => setShowInfo(false)}
          onChanged={() => {
            refreshActiveGroup();
            loadGroups({ search: search.trim() || undefined });
          }}
          onLeft={handleLeftGroup}
        />
      )}
    </>
  );
}
