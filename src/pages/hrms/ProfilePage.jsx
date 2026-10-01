import { useDispatch } from "react-redux";
import useAuth from "../../hooks/useAuth";
import { setUser } from "../../redux/authSlice";
import HrmsPage from "../../components/hrms/layout/HrmsPage";
import ProfileCard from "../../components/dashboard/employee/ProfileCard";
import ProfileEditor from "../../components/dashboard/employee/ProfileEditor";

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  return (
    <HrmsPage title="Profile" subtitle="View and update your personal details.">
      <ProfileCard user={user} />
      <ProfileEditor user={user} onUserUpdated={(updated) => dispatch(setUser(updated))} />
    </HrmsPage>
  );
}