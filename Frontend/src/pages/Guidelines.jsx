import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, X, MapPin, Camera, User } from "lucide-react";

const tips = [
  { key: "precise", icon: MapPin },
  { key: "photo", icon: Camera },
  { key: "contact", icon: User },
];

const Guidelines = () => {
  const { t } = useTranslation();
  const doList = t("guidelines.include.do", { returnObjects: true });
  const dontList = t("guidelines.include.dont", { returnObjects: true });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <div className="py-12 md:py-16 px-4 text-center bg-white border-b border-gray-200">
        <h1 className="text-blue-600 text-2xl md:text-4xl font-extrabold">
          {t("guidelines.header.title")}
        </h1>

        <p className="text-gray-500 text-sm md:text-base mt-3 max-w-2xl mx-auto">
          {t("guidelines.header.subtitle")}
        </p>
      </div>

      {/* ==================== MAIN ==================== */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* Tips */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center">
          {t("guidelines.tips.title")}
        </h2>

        <p className="text-sm text-gray-500 mt-2 text-center max-w-2xl mx-auto">
          {t("guidelines.tips.subtitle")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
          {tips.map((tip) => {
            const Icon = tip.icon;

            return (
              <div
                key={tip.key}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Icon size={24} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-5 text-center">
                  {t(`guidelines.tips.${tip.key}.title`)}
                </h3>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed text-center">
                  {t(`guidelines.tips.${tip.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Do and Don't */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-green-700">
              <Check size={20} />
              {t("guidelines.include.doTitle")}
            </h3>

            <ul className="mt-5 space-y-3">
              {doList.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <Check size={16} className="text-green-600 shrink-0 mt-0.5" />

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-red-700">
              <X size={20} />
              {t("guidelines.include.dontTitle")}
            </h3>

            <ul className="mt-5 space-y-3">
              {dontList.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <X size={16} className="text-red-600 shrink-0 mt-0.5" />

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ==================== CTA ==================== */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/report"
            className="px-8 py-4 border-2 border-black font-extrabold hover:bg-[#264F8B] hover:text-white hover:border-black transition-all duration-300 cursor-pointer"
          >
            {t("guidelines.cta.reportButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;
