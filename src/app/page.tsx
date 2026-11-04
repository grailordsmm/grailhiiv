import type { Metadata } from "next";
import Link from "next/link";
import { Reveal, AnimatedHeading } from "@/components/animation";
import ServiceIcon from "@/components/service-icon";
import ProcessIcon from "@/components/process-icon";
import { FeaturedWork } from "@/components/featured-work";
import { HomeShowcase } from "@/components/home-showcase";
import { SmoothAnchorLink } from "@/components/smooth-anchor";

export const metadata: Metadata = {
  title: "GrailHiiv",
  description:
    "I create and manage social content, email campaigns, and marketing workflows that help businesses reach their audience and keep opportunities moving.",
  robots: { index: false, follow: false },
};

const services = [
  {
    title: "Social Media Management",
    description:
      "Build a stronger online presence through strategic content planning, creation, publishing, and audience engagement.",
  },
  {
    title: "Website Management",
    description:
      "Keep your WordPress website updated, maintained, and easy for visitors to navigate.",
  },
  {
    title: "CRM & Lead Management",
    description:
      "Organize contacts, track opportunities, and manage follow-ups to keep potential customers moving forward.",
  },
  {
    title: "Marketing Automation",
    description:
      "Simplify repetitive marketing tasks with connected tools and automated workflows.",
  },
];

const processSteps = [
  {
    title: "Tell me what you need",
    iconClass: "process-message-icon",
    description:
      "Share your business goals, current challenges, and what you'd like to improve. I'll help identify where my services can make the most difference.",
  },
  {
    title: "Get a plan that fits",
    iconClass: "process-plan-icon",
    description:
      "I'll recommend a practical approach based on your priorities, with clear deliverables, pricing, and expectations before we begin.",
  },
  {
    title: "Let me handle the work",
    iconClass: "process-work-icon",
    description:
      "Once we agree on the plan, I'll personally manage the work while keeping you informed and involved in important decisions.",
  },
  {
    title: "Know what's working",
    iconClass: "process-results-icon",
    description:
      "I'll review the work and relevant results, share useful insights, and recommend improvements to help you move forward.",
  },
];

export default function Page() {
  return (
    <main id="main-content">
      <section className="home-hero px-4 pt-4 pb-2">
        <div className="home-hero-grid max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-6 items-stretch">
          <div className="flex flex-col justify-center py-4 md:py-16 gap-6 md:gap-10 md:h-full">
            <AnimatedHeading className="home-hero-heading text-2xl md:max-w-[540px] leading-none tracking-[-2.5px]">
              Social media and{" "}
              <span className="text-[#b2b2b2]">
                marketing systems that help
              </span>{" "}
              brands connect and grow.
            </AnimatedHeading>
            <Reveal immediate={true}>
              <p className="text-md md:max-w-[540px] leading-relaxed text-gray-400">
                {
                  "I create and manage social content, email campaigns, and marketing workflows that help businesses reach their audience and keep opportunities moving."
                }
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-4">
                <SmoothAnchorLink
                  className="text-md underline underline-offset-4 text-gray-400 hover:text-[#111111] transition-colors"
                  href="#work"
                >
                  View my work
                </SmoothAnchorLink>
                <Link
                  className="text-md underline underline-offset-4 text-gray-400 hover:text-[#111111] transition-colors"
                  href="/pricing"
                >
                  Explore services
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal immediate={true} className="home-hero-showcase">
            <div className="home-showcase">
              <HomeShowcase />
            </div>
          </Reveal>
        </div>
      </section>
      <section className="px-4 py-16 md:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-4">
          <h2 className="section-heading md:sticky md:self-start md:top-4 text-lg leading-[36.4px] tracking-[-0.64px] text-black">
            {"Info"}
          </h2>
          <Reveal immediate={false}>
            <div>
              <p className="text-md leading-relaxed text-gray-500">
                {
                  "I'm a digital marketing specialist with a background in social media, SEO, and website management. My work brings content and marketing systems together."
                }
              </p>
              <Link
                className="inline-block mt-4 text-md underline underline-offset-4 text-gray-400 hover:text-[#111111] transition-colors"
                href="/about"
              >
                {"More about me"}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="px-4 py-16 md:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-heading text-lg leading-[36.4px] tracking-[-0.64px] text-black mb-6 md:mb-8">
            {"Services"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {services.map((service, index) => (
              <Reveal
                className="service-card flex flex-col gap-28 border border-gray-200 rounded-lg p-6"
                immediate={false}
                delay={index * 0.12}
                key={service.title}
              >
                <div className="flex flex-col">
                  <p className="text-xs text-gray-400">
                    {String(index + 1).padStart(3, "0")}
                  </p>
                  <ServiceIcon index={index} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-[#111111]">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mt-4">
                    {service.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section
        id="work"
        tabIndex={-1}
        className="px-4 py-16 md:py-24 border-t border-gray-100"
      >
        <Reveal className="max-w-5xl mx-auto" immediate={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-4 mb-6 md:mb-8">
            <h2 className="section-heading md:sticky md:self-start md:top-4 text-lg leading-[36.4px] tracking-[-0.64px] text-black">
              {"Work"}
            </h2>
            <div>
              <p className="text-md leading-relaxed text-gray-500">
                {
                  "A selection of social media, email, and marketing projects for authors and businesses."
                }
              </p>
              <Link
                className="inline-block mt-4 text-md underline underline-offset-4 text-gray-400 hover:text-[#111111] transition-colors"
                href="/work"
              >
                {"View all work"}
              </Link>
            </div>
          </div>
          <FeaturedWork />
        </Reveal>
      </section>
      <section
        className="px-4 py-16 md:py-24 border-t border-gray-100"
        aria-labelledby="how-i-work-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-4 mb-6 md:mb-8">
            <h2
              id="how-i-work-heading"
              className="section-heading text-lg leading-[36.4px] tracking-[-0.64px] text-black"
            >
              How I work
            </h2>
            <p className="text-md leading-relaxed text-gray-500">
              Working together should be simple. From understanding your needs
              to putting the right solutions in place, I keep the process clear
              and focused on your business.
            </p>
          </div>
          <div className="process-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <svg
              className="process-connector process-connector-horizontal"
              viewBox="0 0 1000 70"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className="process-connector-line"
                d="M55 35 C140 4 190 66 305 35 S440 4 555 35 S690 66 805 35"
              />
              <path
                className="process-connector-dots"
                d="M55 35 C140 4 190 66 305 35 S440 4 555 35 S690 66 805 35"
              />
            </svg>
            <div className="process-tablet-route" aria-hidden="true">
              <div className="process-tablet-route-first">
                <span />
                <span />
                <span />
              </div>
              <div className="process-tablet-route-second">
                <span />
                <span />
              </div>
            </div>
            {processSteps.map((step, index) => (
              <Reveal
                className="service-card process-card flex flex-col gap-28 border border-gray-200 rounded-lg p-6"
                immediate={false}
                delay={index * 0.12}
                key={step.title}
              >
                <div className="flex flex-col">
                  <p className="text-xs text-gray-400">
                    {String(index + 1).padStart(3, "0")}
                  </p>
                  <ProcessIcon
                    index={index}
                    className={`process-icon w-20 h-20 md:w-25 md:h-25 mt-6 ${step.iconClass}`}
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-[#111111]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mt-4">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
