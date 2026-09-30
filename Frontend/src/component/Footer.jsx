import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";

import {
  ShieldCheck,
  ChevronRight,
  FileText,
  Search,
  CircleHelp,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";

const quickLinks = [
  { key: "home", to: "/" },
  { key: "reportIssue", to: "/report" },
  { key: "trackReport", to: "/track" },
  { key: "howItWorks", to: "/how-it-works" },
  { key: "about", to: "/about" },
];

const citizenServices = [
  { key: "reportIssue", icon: FileText, to: "/report" },
  { key: "trackReport", icon: Search, to: "/track" },
  { key: "faq", icon: CircleHelp, to: "/faq" },
  { key: "guidelines", icon: AlertCircle, to: "/guidelines" },
];

const contactInfo = [
  { key: "email", icon: Mail },
  { key: "phone", icon: Phone },
  { key: "address", icon: MapPin },
  { key: "hours", icon: Clock },
];

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-6 gap-10 bg-[#080F1B]">
      {/* ================= Section 1: Brand ================= */}
      <div className="space-y-8">
        {/* Logo & Description */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            <span className="text-blue-500">H</span>amro{" "}
            <span className="text-blue-500">S</span>amadhan
          </h1>

          <p className="mt-3 text-gray-400 leading-relaxed max-w-xs">
            {t("footer.brand.description")}
          </p>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {t("footer.social.title")}
          </h3>

          <div className="flex gap-3">
            <span className="p-3 rounded-full border border-slate-700 text-gray-300 hover:text-blue-400 hover:border-blue-500 transition-all duration-300 cursor-pointer">
              <FaFacebook size={18} />
            </span>

            <span className="p-3 rounded-full border border-slate-700 text-gray-300 hover:text-blue-400 hover:border-blue-500 transition-all duration-300 cursor-pointer">
              <FaTwitter size={18} />
            </span>

            <span className="p-3 rounded-full border border-slate-700 text-gray-300 hover:text-blue-400 hover:border-blue-500 transition-all duration-300 cursor-pointer">
              <FaInstagram size={18} />
            </span>

            <span className="p-3 rounded-full border border-slate-700 text-gray-300 hover:text-blue-400 hover:border-blue-500 transition-all duration-300 cursor-pointer">
              <FaYoutube size={18} />
            </span>
          </div>
        </div>

        {/* Trust & Security */}
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
          <h3 className="text-lg font-semibold text-white mb-4">
            {t("footer.trust.title")}
          </h3>

          <div className="flex items-start gap-4">
            <div className="text-blue-500">
              <ShieldCheck size={38} />
            </div>

            <div>
              <h4 className="text-white font-medium">
                {t("footer.trust.heading")}
              </h4>

              <p className="text-sm text-gray-400 mt-1">
                {t("footer.trust.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Section 2: Quick Links ================= */}
      <div>
        <h3 className="text-white font-bold uppercase">
          {t("footer.quickLinks.title")}
        </h3>

        <div className="w-10 h-[2px] bg-blue-500 my-3"></div>

        <ul className="space-y-5">
          {quickLinks.map((link) => (
            <li
              key={link.key}
              className="group flex items-center gap-2 text-white text-lg hover:text-blue-400 transition"
            >
              <Link to={link.to} className="flex items-center gap-2">
                <ChevronRight
                  size={22}
                  className="shrink-0 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5 group-hover:text-blue-500"
                />

                <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  {t(`footer.quickLinks.${link.key}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ================= Section 3: Citizen Services ================= */}
      <div>
        <h3 className="text-lg text-white uppercase">
          {t("footer.citizenServices.title")}
        </h3>

        <div className="w-10 h-[2px] my-3 bg-blue-500"></div>

        <ul className="space-y-7">
          {citizenServices.map((item) => {
            const Icon = item.icon;

            return (
              <li
                key={item.key}
                className="group flex items-center gap-4 text-white text-lg"
              >
                <Link
                  to={item.to}
                  className="flex items-center gap-4 hover:text-blue-400 transition"
                >
                  <Icon size={22} className="text-blue-500 shrink-0" />

                  <span>{t(`footer.citizenServices.${item.key}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ================= Section 4: Contact ================= */}
      <div>
        <h3 className="text-lg text-white uppercase">
          {t("footer.contact.title")}
        </h3>

        <div className="w-10 h-[2px] my-3 bg-blue-500"></div>

        <ul className="space-y-6">
          {contactInfo.map((item) => {
            const Icon = item.icon;

            return (
              <li
                key={item.key}
                className="flex items-start gap-4 text-white text-lg hover:text-blue-400 cursor-pointer transition"
              >
                <Icon size={22} className="text-blue-500 shrink-0 mt-1" />

                <span>{t(`footer.contact.${item.key}`)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ================= Horizontal Border ================= */}
      <hr className="col-span-full border-0 h-[1px] bg-gray-600 my-2" />

      {/* ================= Bottom Features ================= */}
      <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 px-6 py-6 lg:border-r border-slate-700">
          <FileText size={40} className="text-blue-500 shrink-0" />

          <div>
            <h3 className="text-white text-lg font-semibold">
              {t("footer.features.easyReporting.title")}
            </h3>

            <p className="text-gray-400 text-sm">
              {t("footer.features.easyReporting.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-6 lg:border-r border-slate-700">
          <Search size={40} className="text-blue-500 shrink-0" />

          <div>
            <h3 className="text-white text-lg font-semibold">
              {t("footer.features.trackReports.title")}
            </h3>

            <p className="text-gray-400 text-sm">
              {t("footer.features.trackReports.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-6 lg:border-r border-slate-700">
          <ShieldCheck size={40} className="text-blue-500 shrink-0" />

          <div>
            <h3 className="text-white text-lg font-semibold">
              {t("footer.features.secureInformation.title")}
            </h3>

            <p className="text-gray-400 text-sm">
              {t("footer.features.secureInformation.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-6">
          <CircleHelp size={40} className="text-blue-500 shrink-0" />

          <div>
            <h3 className="text-white text-lg font-semibold">
              {t("footer.features.citizenSupport.title")}
            </h3>

            <p className="text-gray-400 text-sm">
              {t("footer.features.citizenSupport.description")}
            </p>
          </div>
        </div>
      </div>

      {/* ================= Second Border ================= */}
      <hr className="col-span-full border-0 h-[1px] bg-gray-600 my-2" />

      {/* ================= Copyright & Policies ================= */}
      <div className="col-span-full flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-400 text-center">
          {t("footer.bottom.copyright")}
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <a href="#" className="text-gray-500 hover:text-white transition">
            {t("footer.bottom.privacy")}
          </a>

          <span className="text-gray-600 hidden md:block">|</span>

          <a href="#" className="text-gray-500 hover:text-white transition">
            {t("footer.bottom.terms")}
          </a>

          <span className="text-gray-600 hidden md:block">|</span>

          <a href="#" className="text-gray-500 hover:text-white transition">
            {t("footer.bottom.sitemap")}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
