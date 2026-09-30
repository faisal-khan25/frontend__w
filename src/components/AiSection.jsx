import { Sparkles, FileSearch, AudioLines, Search } from "lucide-react";

const aiFeatures = [
  { icon: Sparkles, title: "AI assistant", desc: "Answers questions and drafts work from company knowledge.", tone: "primary" },
  { icon: FileSearch, title: "Resume ATS analyzer", desc: "Screens applicants against a role in seconds.", tone: "sky" },
  { icon: AudioLines, title: "Meeting summary", desc: "Turns a recording into decisions and owners.", tone: "mint" },
  { icon: Search, title: "Smart search", desc: "Finds the file, message, or policy, not just the keyword.", tone: "violet" },
];

const iconTone = {
  primary: "bg-primary-50 text-primary-600",
  sky: "bg-sky-bg text-sky",
  mint: "bg-mint-bg text-mint",
  violet: "bg-violet-bg text-violet",
};

export default function AiSection() {
  return (
    <section id="ai" className="relative bg-canvas overflow-hidden">
      <div className="absolute -top-32 right-0 w-[420px] h-[420px] bg-primary-100 blur-3xl opacity-50 pointer-events-none rounded-full" />
      <div className="container-page relative section">
        <span className="eyebrow">AI, built in</span>
        <h2 className="section-title mt-3 mb-10 max-w-lg">Assistance where the work already is</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card card-hover card-pad">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${iconTone[f.tone]}`}>
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold mb-2 text-sm text-ink">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
