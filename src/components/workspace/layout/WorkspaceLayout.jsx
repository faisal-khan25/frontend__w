import { useState } from "react";
import { Outlet } from "react-router-dom";
import WorkspaceTopbar from "../../WorkspaceTopbar";
import WorkspaceSidebar from "../../WorkspaceSidebar";
import IncomingCallOverlay from "../call/IncomingCallOverlay";
import useCallSocket from "../../../hooks/useCallSocket";

export default function WorkspaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useCallSocket();

  return (
    <div className="min-h-screen bg-canvas">
      <WorkspaceTopbar onMenuClick={() => setMobileOpen(true)} />
      <div className="flex">
        <WorkspaceSidebar
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <IncomingCallOverlay />
    </div>
  );
}
