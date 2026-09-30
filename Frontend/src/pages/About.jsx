import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Handshake, ShieldCheck } from "lucide-react";
import HeroImg from "../assets/heroImg.webp";


const values = [
  { key: "transparency", icon: Eye },
  { key: "community", icon: Handshake },
  { key: "trust", icon: ShieldCheck },
];

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <div className="py-12 md:py-16 px-4 text-center bg-white border-b border-gray-200">
        <h1 className="text-blue-600 text-2xl md:text-4xl font-extrabold">
          {t("about.header.title")}
        </h1>

        <p className="text-gray-500 text-sm md:text-base mt-3 max-w-2xl mx-auto">
          {t("about.header.subtitle")}
        </p>
      </div>

      {/* ==================== MISSION ==================== */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative">
            <img
              src={HeroImg}
              alt={t("about.mission.imageAlt")}
              className="w-full rounded-2xl"
            />

          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {t("about.mission.title")}
            </h2>

            <p className="text-sm md:text-base text-gray-500 mt-3 leading-relaxed">
              {t("about.mission.description")}
            </p>
          </div>
        </div>

        {/* ==================== VALUES ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.key}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Icon size={24} />
                </div>

                <h2 className="text-lg font-bold text-gray-900 mt-5 text-center">
                  {t(`about.values.${value.key}.title`)}
                </h2>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed text-center">
                  {t(`about.values.${value.key}.description`)}
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
            {t("about.cta.reportButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
