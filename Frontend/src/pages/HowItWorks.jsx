import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PencilLine, MapPin, Send, Search } from "lucide-react";

const steps = [
  { key: "describe", icon: PencilLine },
  { key: "locate", icon: MapPin },
  { key: "submit", icon: Send },
  { key: "track", icon: Search },
];

const HowItWorks = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <div className="py-12 md:py-16 px-4 text-center bg-white border-b border-gray-200">
        <h1 className="text-blue-600 text-2xl md:text-4xl font-extrabold">
          {t("howItWorks.header.title")}
        </h1>

        <p className="text-gray-500 text-sm md:text-base mt-3 max-w-2xl mx-auto">
          {t("howItWorks.header.subtitle")}
        </p>
      </div>

      {/* ==================== STEPS ==================== */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
              >
                <span className="absolute top-5 right-6 text-3xl font-extrabold text-gray-100">
                  {index + 1}
                </span>

                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Icon size={24} />
                </div>

                <h2 className="text-lg font-bold text-gray-900 mt-5 text-center">
                  {t(`howItWorks.steps.${step.key}.title`)}
                </h2>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed text-center">
                  {t(`howItWorks.steps.${step.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* ==================== CTA ==================== */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/report"
            className="px-8 py-4 border-2 border-black font-extrabold hover:bg-[#264F8B] hover:text-white hover:border-black transition-all duration-300 cursor-pointer"
          >
            {t("howItWorks.cta.reportButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
