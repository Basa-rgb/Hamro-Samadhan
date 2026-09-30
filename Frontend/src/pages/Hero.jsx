
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 md:py-20">

      {/* Badge */}
      <div className="flex justify-center mb-6">
        <span className="px-6 py-3 border-3 border-b-red-500 rounded-md text-white bg-[#264F8B] text-lg font-semibold tracking-wide">
          {t("hero.badge")}
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl md:text-5xl font-extrabold flex justify-center items-center gap-2 tracking-tight">
        <span>
          <span className="text-[#264F8B]">H</span>amro
        </span>

        <span>
          <span className="text-[#264F8B]">S</span>amadhan
        </span>
      </h1>

      <div className="flex flex-col justify-center items-center mt-8 max-w-2xl mx-auto text-center">

        <h2 className="text-2xl md:text- font-semibold text-gray-900 leading-snug">
          {t("hero.title")}{" "}
          <span className="text-[#264F8B]">
            {t("hero.highlight")}
          </span>
        </h2>

        <p className="text-gray-500 text- md:text-base mt-4 leading-relaxed">
          {t("hero.description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">

          <Link
            to="/report"
            className="px-8 py-4 border-2 font-extrabold hover:bg-[#264F8B] hover:text-white hover:border-black transition-all duration-300 cursor-pointer"
          >
            {t("hero.reportButton")}
          </Link>

        </div>

      </div>
    </div>
  );
};

export default Hero;
