import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  return (
    <div className="flex items-center gap-2 text-sm ">
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={
          isEn
            ? "font-bold text-[#264F8B] cursor-pointer"
            : "text-gray-500 hover:text-black cursor-pointer"
        }
      >
        EN
      </button>
      <span className="text-gray-300 cursor-pointer">|</span>
      <button
        onClick={() => i18n.changeLanguage("ne")}
        className={
          !isEn
            ? "font-bold cursor-pointer text-[#264F8B]"
            : "text-gray-500 hover:text-black cursor-pointer"
        }
      >
        नेपाली
      </button>
    </div>
  );
};

export default LanguageSwitcher;
