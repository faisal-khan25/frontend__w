import { useState } from "react";
import { requestDemo } from "../lib/api";

export default function DemoCta() {
  const [form, setForm] = useState({ name: "", workEmail: "", company: "" });
  const [status, setStatus] = useState("idle");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await requestDemo(form);
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <section id="demo" className="relative bg-deepest overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-[420px] bg-radial-glow pointer-events-none" style={{ transform: "rotate(180deg)" }} />
      <div className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="glass-strong rounded-panel shadow-panel p-10 md:p-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="font-mono text-xs tracking-widest uppercase text-mint">Get started</span>
            <h2 className="font-display text-3xl font-semibold mt-3 mb-3 text-paper">
              See it running on your company's own data
            </h2>
            <p className="text-haze">
              A working demo, set up with your org chart and one real workflow.
            </p>
          </div>

          {status === "sent" ? (
            <div className="flex items-center gap-3 font-mono text-sm text-mint">
              <span className="h-2 w-2 rounded-full bg-mint glow-dot animate-pulseSoft" />
              Thanks — we'll reach out shortly.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={onChange}
                  placeholder="Full name"
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-[10px] px-4 py-3 text-sm text-paper placeholder:text-dim focus:outline-none focus:border-mint/50 focus:ring-2 focus:ring-mint/20 transition"
                />
                <input
                  name="company"
                  required
                  value={form.company}
                  onChange={onChange}
                  placeholder="Company"
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-[10px] px-4 py-3 text-sm text-paper placeholder:text-dim focus:outline-none focus:border-mint/50 focus:ring-2 focus:ring-mint/20 transition"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="email"
                  name="workEmail"
                  required
                  value={form.workEmail}
                  onChange={onChange}
                  placeholder="you@company.com"
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-[10px] px-4 py-3 text-sm text-paper placeholder:text-dim focus:outline-none focus:border-mint/50 focus:ring-2 focus:ring-mint/20 transition"
                />
                <button
                  disabled={status === "loading"}
                  className="bg-gradient-to-r from-mint to-cyan text-deepest px-6 py-3 rounded-[10px] text-sm font-semibold whitespace-nowrap shadow-glow-sm hover:brightness-110 transition disabled:opacity-60"
                >
                  {status === "loading" ? "Sending…" : "Request a demo"}
                </button>
              </div>
              {status === "error" && (
                <p className="text-xs text-rose-300">
                  Couldn't reach the server. Check the backend is running and try again.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}