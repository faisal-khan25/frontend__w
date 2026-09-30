import { Link } from "react-router-dom";
import AuthIllustration from "./AuthIllustration";


export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  promoTitle = "Work smarter.\nWork together.",
  promoDescription = "One platform for your team's mail, chat, drive, meetings and HR — built for how modern companies actually work.",
}) {
  return (
    <div className="min-h-screen w-full bg-canvas flex font-body text-ink antialiased">
      
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-700 to-primary-900">
        <div className="absolute inset-0 bg-hero-radial pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12 xl:px-16 xl:py-16">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 border border-white/25 font-display font-bold">
              S
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Shnoor</span>
          </Link>

          <div className="max-w-sm">
            <h2 className="font-display text-4xl xl:text-[42px] font-extrabold leading-[1.1] text-white whitespace-pre-line">
              {promoTitle}
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70">
              {promoDescription}
            </p>
          </div>

          <div>
            <AuthIllustration />
          </div>
        </div>
      </div>

      
      <div className="flex-1 flex flex-col">
        
        <div className="lg:hidden flex items-center gap-2.5 px-6 pt-6">
          <Link to="/" className="inline-flex items-center gap-2.5 text-primary-700">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 font-display font-bold text-primary-700">
              S
            </span>
            <span className="font-display text-base font-bold tracking-tight">Shnoor</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-8">
              <h1 className="font-display text-[28px] sm:text-[30px] font-extrabold tracking-tight text-ink">
                {title}
              </h1>
              {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
            </div>

            {children}

            {footer && (
              <div className="mt-8 flex items-center justify-between text-sm">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
