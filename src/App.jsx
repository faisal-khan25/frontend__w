import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  MessageSquare,
  Video,
  FolderOpen,
  FileText,
  Calendar,
  LayoutGrid,
  Clock,
  Umbrella,
  Wallet,
  UserPlus,
  TrendingUp,
  Laptop,
} from "lucide-react";


import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import IndustryStrip from "./components/IndustryStrip";
import FeatureSection from "./components/FeatureSection";
import RolesStrip from "./components/RolesStrip";
import AiSection from "./components/AiSection";
import SecuritySection from "./components/SecuritySection";
import Footer from "./components/Footer";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import useAuth from "./hooks/useAuth";
import { getCurrentUser } from "./services/authService";
import { setUser, logout as logoutAction } from "./redux/authSlice";


const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const OTPVerification = lazy(() => import("./pages/auth/OTPVerification"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Forbidden = lazy(() => import("./pages/errors/Forbidden"));
const PlaceholderDashboard = lazy(() => import("./pages/dashboard/PlaceholderDashboard"));
const EmployeeDashboard = lazy(() => import("./pages/dashboard/EmployeeDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));

const HrmsCalendarPage = lazy(() => import("./pages/dashboard/CalendarPage"));


const WorkspaceLayout = lazy(() => import("./components/workspace/layout/WorkspaceLayout"));
const WorkspaceDashboard = lazy(() => import("./pages/workspace/WorkspaceDashboard"));
const MailPage = lazy(() => import("./pages/workspace/MailPage"));
const DrivePage = lazy(() => import("./pages/workspace/DrivePage"));
const CalendarPage = lazy(() => import("./pages/workspace/CalendarPage"));
const ChatPage = lazy(() => import("./pages/workspace/ChatPage"));
const GroupChatPage = lazy(() => import("./pages/workspace/GroupChatPage"));
const MeetPage = lazy(() => import("./pages/workspace/MeetPage"));
const MeetRoomPage = lazy(() => import("./pages/workspace/MeetRoomPage"));
const NotificationsPage = lazy(() => import("./pages/workspace/NotificationsPage"));
const DocEditorPage = lazy(() => import("./pages/workspace/DocEditorPage"));
const SheetEditorPage = lazy(() => import("./pages/workspace/SheetEditorPage"));
const SlideEditorPage = lazy(() => import("./pages/workspace/SlideEditorPage"));
const SearchResultsPage = lazy(() => import("./pages/workspace/SearchResultsPage"));


const ReportsDashboard = lazy(() => import("./pages/workspace/reports/ReportsDashboard"));
const EmployeeReport = lazy(() => import("./pages/workspace/reports/EmployeeReport"));
const AttendanceReport = lazy(() => import("./pages/workspace/reports/AttendanceReport"));
const LeaveReport = lazy(() => import("./pages/workspace/reports/LeaveReport"));
const TaskReport = lazy(() => import("./pages/workspace/reports/TaskReport"));
const PayrollReport = lazy(() => import("./pages/workspace/reports/PayrollReport"));
const DepartmentReport = lazy(() => import("./pages/workspace/reports/DepartmentReport"));
const DocumentReport = lazy(() => import("./pages/workspace/reports/DocumentReport"));
const CustomReport = lazy(() => import("./pages/workspace/reports/CustomReport"));


function RouteFallback() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-canvas">
      <div
        className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}


const workspaceFeatures = [
  { icon: MessageSquare, title: "Team chat", desc: "Direct messages, group channels, and company-wide announcements in one thread." },
  { icon: Video, title: "Video meetings", desc: "Screen share, whiteboard, live captions, and automatic recordings." },
  { icon: FolderOpen, title: "Drive", desc: "Nested folders, version history, and role-based file permissions." },
  { icon: FileText, title: "Docs", desc: "Real-time collaborative editing with comments and suggestions." },
  { icon: Calendar, title: "Calendar", desc: "Meetings, holidays, birthdays, and leave in a single view." },
  { icon: LayoutGrid, title: "Projects", desc: "Kanban and sprint boards with time tracking built in." },
];

const hrmsFeatures = [
  { icon: Clock, title: "Attendance", desc: "Check-in, break tracking, and overtime, reconciled automatically." },
  { icon: Umbrella, title: "Leave", desc: "Apply, approve, and track balances against company policy." },
  { icon: Wallet, title: "Payroll", desc: "Salary structures, payslips, and tax deductions, run on schedule." },
  { icon: UserPlus, title: "Recruitment", desc: "Postings, applicant tracking, and interview scheduling." },
  { icon: TrendingUp, title: "Performance", desc: "Goals, KPIs, and review cycles tied to real work." },
  { icon: Laptop, title: "Assets", desc: "Laptops, ID cards, and equipment, assigned and returned cleanly." },
];

function LandingPage() {
  return (
    <div className="w-full">
      <Navbar />
      <Hero />
      <IndustryStrip />
      <FeatureSection
        id="workspace"
        eyebrow="Workspace"
        title="Where the work actually happens"
        description="Chat, meet, write, and plan without switching apps or losing context."
        features={workspaceFeatures}
      />
      <FeatureSection
        id="hrms"
        eyebrow="HRMS"
        title="Where the company runs itself"
        description="Every HR process, from first day to last, handled without a spreadsheet."
        features={hrmsFeatures}
        inverted
      />
      <RolesStrip />
      <AiSection />
      <SecuritySection />
      <Footer />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) dispatch(setUser(user));
      })
      .catch((err) => {
       
        if (!cancelled && err.response?.status === 401) {
          dispatch(logoutAction());
        }
      });

    return () => {
      cancelled = true;
    };
    
  }, [isAuthenticated, token]);

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/otp-verification" element={<OTPVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/403" element={<Forbidden />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <PlaceholderDashboard label="HR Dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <PlaceholderDashboard label="Manager Dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <HrmsCalendarPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <WorkspaceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkspaceDashboard />} />
        <Route path="mail" element={<MailPage />} />
        <Route path="drive" element={<DrivePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="groups" element={<GroupChatPage />} />
        <Route path="meet" element={<MeetPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="docs/:id" element={<DocEditorPage />} />
        <Route path="sheets/:id" element={<SheetEditorPage />} />
        <Route path="slides/:id" element={<SlideEditorPage />} />

        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <ReportsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/employees"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <EmployeeReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/attendance"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <AttendanceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/leave"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <LeaveReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/tasks"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <TaskReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/payroll"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <PayrollReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/departments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <DepartmentReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/documents"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <DocumentReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/custom"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "MANAGER"]}>
              <CustomReport />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/workspace/meet/:id"
        element={
          <ProtectedRoute>
            <MeetRoomPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}