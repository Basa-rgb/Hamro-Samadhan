import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { getFaqs } from "../../services/FaqService";

const Faq = () => {
  const { t, i18n } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Questions live in the database, so the page picks up edits without a rebuild
    const loadFaqs = async () => {
      try {
        const response = await getFaqs();
        setFaqs(response.faqs);
      } catch {
        setErrorMsg(t("faq.errors.loadFaqs"));
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, [t]);

  // A question may only be written in English so far, the other language
  // falls back to it rather than showing a blank panel.
  const text = (faq, field) => {
    const isNe = i18n.language === "ne";

    return (isNe && faq[`${field}Ne`]) || faq[field];
  };

  const toggle = (id) => setOpen((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <div className="py-12 md:py-16 px-4 text-center bg-white border-b border-gray-200">
        <h1 className="text-blue-600 text-2xl md:text-4xl font-extrabold">
          {t("faq.header.title")}
        </h1>

        <p className="text-gray-500 text-sm md:text-base mt-3 max-w-2xl mx-auto">
          {t("faq.header.subtitle")}
        </p>
      </div>

      {/* ==================== QUESTIONS ==================== */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {loading ? (
          <div className="flex justify-center items-center gap-3 py-16 text-gray-500">
            <Loader2 size={20} className="animate-spin" />

            <span className="text-sm">{t("faq.loading")}</span>
          </div>
        ) : errorMsg ? (
          <p className="text-center text-sm text-red-600 py-16">{errorMsg}</p>
        ) : faqs.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-16">
            {t("faq.empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = open === faq._id;

              return (
                <div
                  key={faq._id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    isOpen
                      ? "border-blue-600 bg-white"
                      : "border-gray-300 bg-white hover:border-blue-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(faq._id)}
                    aria-expanded={isOpen}
                    className="w-full flex justify-between items-center gap-4 p-5 text-left cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                      {text(faq, "question")}
                    </h3>

                    {isOpen ? (
                      <ChevronUp className="text-blue-600 shrink-0 cursor-pointer" />
                    ) : (
                      <ChevronDown className="text-blue-600 shrink-0 cursor-pointer" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
                      {text(faq, "answer")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== CTA ==================== */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            to="/report"
            className="px-8 py-4 border-2 border-black font-extrabold hover:bg-[#264F8B] hover:text-white hover:border-black transition-all duration-300 cursor-pointer"
          >
            {t("faq.cta.reportButton")}
          </Link>

          <Link
            to="/guidelines"
            className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-extrabold hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer"
          >
            {t("faq.cta.guidelinesButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Faq;
