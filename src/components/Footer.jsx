import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-line">
      <div className="container-page py-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">U</span>
          </div>
          <span className="text-xs font-medium text-faint">© 2026 Shnoor. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-xs font-medium text-faint">
          <Link to="#" className="hover:text-primary-600 transition-colors">Privacy</Link>
          <Link to="#" className="hover:text-primary-600 transition-colors">Terms</Link>
          <Link to="#" className="hover:text-primary-600 transition-colors">Status</Link>
        </div>
      </div>
    </footer>
  );
}
