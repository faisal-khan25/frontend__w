import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import TopHeader from "../../components/dashboard/employee/TopHeader";
import Sidebar from "../../components/dashboard/employee/Sidebar";
import ProfileCard from "../../components/dashboard/employee/ProfileCard";
import ProfileEditor from "../../components/dashboard/employee/ProfileEditor";
import PerformanceCards from "../../components/dashboard/employee/PerformanceCards";
import ComingSoonCard from "../../components/dashboard/employee/ComingSoonCard";
import AttendanceWidget from "../../components/dashboard/AttendanceWidget";
import LeaveWidget from "../../components/dashboard/LeaveWidget";
import HolidaysWidget from "../../components/dashboard/HolidaysWidget";
import NotificationsWidget from "../../components/dashboard/NotificationsWidget";
import TasksWidget from "../../components/dashboard/TasksWidget";
import DocumentsWidget from "../../components/dashboard/DocumentsWidget";
import PayrollWidget from "../../components/dashboard/PayrollWidget";
import * as leaveService from "../../services/leaveService";
import * as notificationService from "../../services/notificationService";
import { setUser } from "../../redux/authSlice";
import { useDispatch } from "react-redux";
import {
  Users,
} from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  function handleUserUpdated(updatedUser) {
    dispatch(setUser(updatedUser));
  }

  
  useEffect(() => {
    let cancelled = false;
    leaveService
      .getMyLeaves("PENDING")
      .then((res) => {
        if (!cancelled) setPendingLeaves(res.length);
      })
      .catch(() => {});
    notificationService
      .getMyNotifications({ unreadOnly: true, pageSize: 1 })
      .then((res) => {
        if (!cancelled) setUnreadNotifications(res.unreadCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div id="top" className="min-h-screen bg-canvas">
      <TopHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          badges={{ pendingLeaves, unreadNotifications }}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-muted mt-1">Here's what's happening with your workspace today.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ProfileCard user={user} />
            <AttendanceWidget />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <PerformanceCards user={user} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ComingSoonCard
              id="team-leave"
              icon={Users}
              title="Team Members On Leave"
              description="Requires a team/manager relationship and an org-wide leave feed - not yet exposed to the employee API."
            />
            <LeaveWidget />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <HolidaysWidget />
            <NotificationsWidget />
          </div>

          <ProfileEditor user={user} onUserUpdated={handleUserUpdated} />

          <div className="grid lg:grid-cols-2 gap-6">
            <TasksWidget />
            <DocumentsWidget />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 pb-6">
            <PayrollWidget />
          </div>
        </main>
      </div>
    </div>
  );
}
