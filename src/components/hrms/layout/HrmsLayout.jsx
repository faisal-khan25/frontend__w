import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import TopHeader from "../../dashboard/employee/TopHeader";
import Sidebar from "../../dashboard/employee/Sidebar";
import * as leaveService from "../../../services/leaveService";
import * as notificationService from "../../../services/notificationService";

// Shared HRMS shell: persistent top header + sidebar, page content in <Outlet />.
export default function HrmsLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Sidebar badge counts; refreshed on every page change so they stay current.
  useEffect(() => {
    let cancelled = false;
    leaveService
      .getMyLeaves("PENDING")
      .then((res) => !cancelled && setPendingLeaves(res.length))
      .catch(() => {});
    notificationService
      .getMyNotifications({ unreadOnly: true, pageSize: 1 })
      .then((res) => !cancelled && setUnreadNotifications(res.unreadCount))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Return to the top of the page when switching modules.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <TopHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          badges={{ pendingLeaves, unreadNotifications }}
        />
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}