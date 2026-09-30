import React, { useState, useEffect } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import Stamp from "../assets/stamp.png";
import BgImg from "../assets/temple.png";
import { useTranslation } from "react-i18next";
import flag from "../assets/flag.gif";
import NepaliDate from "nepali-date-converter";
import { NavLink } from "react-router-dom";
import { X, Menu } from "lucide-react";

const Navbar = () => {
  const { t, i18n } = useTranslation(); // FIXED: added i18n
  const [now, setNow] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const adDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const adTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const bs = new NepaliDate(now);
  const bsDateEn = bs.format("dddd, MMMM DD, YYYY", "en");
  const bsDateNe = bs.format("dddd, MMMM DD, YYYY", "np");

  const navLinks = [
    {
      name: t("nav.home"),
      path: "/",
    },
    {
      name: t("nav.reportIssue"),
      path: "/report",
    },
    {
      name: t("nav.trackReport"),
      path: "/track",
    },
    {
      name: t("nav.howItWorks"),
      path: "/how-it-works",
    },
  ];

  return (
    <>
      {/* ==================== Top Bar ==================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white w-full px-4 sm:px-6 py-2 shadow-xs gap-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <h2 className="text-blue-700 text-sm sm:text-lg font-semibold">
            {t("topBarText.topic")}
          </h2>
          <span className="bg-blue-300 h-5 sm:h-6 w-0.5"></span>
          <h2 className="text-blue-700 text-sm sm:text-lg font-semibold">
            {t("topBarText.topics")}
          </h2>
        </div>
        <LanguageSwitcher />
      </div>

      {/* ==================== Government Header ==================== */}
      <div className="w-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 bg-[#264F8B] flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4 sm:gap-6 p-4 sm:p-5">
          <img
            src={Stamp}
            alt="Government stamp"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
          />
          <div className="text-white font-bold text-center sm:text-left">
            <h3 className="text-sm sm:text-base">{t("government.name")}</h3>
            <h1 className="text-xl sm:text-2xl lg:text-3xl">
              {t("government.service")}
            </h1>
            <h3 className="text-sm sm:text-base">{t("government.location")}</h3>
          </div>
        </div>

        <div
          className="w-full md:w-2/3 min-h- bg-cover bg-center bg-no-repeat relative bg-blue-500"
          style={{ backgroundImage: `url(${BgImg})` }}
        >
          <div className="absolute inset-0 bg-blue-900/20"></div>
          <div className="relative z-10 flex justify-end items-center mt-8 p-4 gap-4 mr-5">
            <img src={flag} alt="flag" className="w-12 h-auto" />
            <h2 className="flex flex-col gap-y-1 text-xs font-bold leading-tight text-white sm:text-sm md:text-base lg:text-xl">
              {i18n.language === "en" ? (
                <span>
                  A.D.: {adDate} at {adTime}
                </span>
              ) : (
                <span>वि.सं.: {bsDateNe}</span>
              )}

              {i18n.language === "en" ? (
                <span>Nepal Samvat: 1146 NALATHWA PUNHI - 15</span>
              ) : (
                <span>नेपाल संवत्: ११४६ नलाथ्व पुन्हि - १५</span>
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* ==================== Navigation ==================== */}
      <nav className="sticky top-0 z-50 bg-white text-black shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm lg:text-base font-medium rounded-md transition ${
                      isActive
                        ? "text-blue-700 font-semibold"
                        : "text-gray-700 hover:text-blue-700"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden ml-auto p-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <span className="text-2xl">
                  <X />
                </span>
              ) : (
                <span className="text-2xl">
                  <Menu />
                </span>
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-md text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
