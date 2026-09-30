import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center card card-pad p-10">
        <div className="w-12 h-12 rounded-full bg-coral-bg flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} className="text-coral" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-ink mb-2">403</h1>
        <p className="text-muted mb-6">You don't have permission to view this page.</p>
        <Link to="/login" className="text-primary-600 font-semibold hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
