import React, { useState } from "react";
import {
  Search,
  MapPin,
  Clock3,
  Flag,
  Building2,
  CalendarDays,
  Copy,
  Check,
  Loader2,
  ImageOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import NepaliDate from "nepali-date-converter";
import { getReportById, getReportToken } from "../../services/ReportService";
import { useClipboard } from "../Hooks/useClipboard";
import useCategoryLabel from "../Hooks/useCategoryLabel";

// The API stores statuses in SCREAMING_SNAKE, these pick the colour of each
// one so the badge and the timeline dot always agree with each other
const STATUS_BADGE = {
  PENDING: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

const PRIORITY_BADGE = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-red-50 text-red-600",
  URGENT: "bg-red-600 text-white",
};

const TIMELINE_TYPE = {
  PENDING: "completed",
  UNDER_REVIEW: "review",
  IN_PROGRESS: "progress",
  RESOLVED: "completed",
  REJECTED: "rejected",
};

const DOT_COLOR = {
  completed: "bg-green-500",
  review: "bg-blue-500",
  progress: "bg-orange-400",
  rejected: "bg-red-500",
};

const CARD_COLOR = {
  completed: "bg-green-50",
  review: "bg-blue-50",
  progress: "bg-orange-50",
  rejected: "bg-red-50",
};

// Once a report is closed there is nothing left to wait for
const CLOSED_STATUSES = ["RESOLVED", "REJECTED"];

const TrackReport = () => {
  const { t, i18n } = useTranslation();
  const { copied, copy } = useClipboard();
  // A report stores its category as the value, so the readable name is resolved
  // here. Reads the i18n keys first and falls back to the API, which is what lets
  // an admin add a category without a translation file
  const getCategoryLabel = useCategoryLabel();

  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searched, setSearched] = useState(false);

  // Dates come from the API as ISO strings, the Nepali view needs the Bikram
  // Sambat calendar so the library only covers the date, Intl covers the time
  const formatDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    if (i18n.language === "ne") {
      const bs = new NepaliDate(date);
      const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      return `${bs.format("DD MMMM YYYY", "np")}, ${time}`;
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Submitting the form runs the lookup, so the ID can also be sent with Enter
  const trackReport = async (e) => {
    e.preventDefault();

    const id = reportId.trim().toUpperCase();

    if (!id) {
      setErrorMsg(t("track.errors.idRequired"));
      setReport(null);
      setSearched(true);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // The token is only in localStorage if this browser submitted the report,
      // so the photo and details come back for the person who filed it and stay
      // hidden for anyone tracking an id they were given
      const response = await getReportById(id, getReportToken(id));

      setReport(response.report);
      setReportId(response.report.reportId);
    } catch (error) {
      setReport(null);

      if (error.response?.status === 404) {
        setErrorMsg(t("track.errors.notFound"));
      } else {
        setErrorMsg(
          error.response?.data?.message || t("track.errors.generic"),
        );
      }
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  // Clears the result and the input, so another report can be looked up
  const resetSearch = () => {
    setReportId("");
    setReport(null);
    setErrorMsg("");
    setSearched(false);
  };

  const hasCoordinates =
    report?.location?.latitude != null && report?.location?.longitude != null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HERO ==================== */}
      <section className="relative bg-blue-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-0 bottom-0 w-96 h-32 bg-blue-100 rounded-tr-full" />
          <div className="absolute right-0 bottom-0 w-[500px] h-40 bg-blue-100 rounded-tl-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-14 pb-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-white shadow-sm">
              <MapPin size={42} strokeWidth={2} className="text-blue-700" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800">
            {t("track.header.title")}
          </h2>

          <p className="text-gray-600 mt-4 text-base md:text-lg">
            {t("track.header.subtitle")}
          </p>

          {/* ==================== SEARCH BOX ==================== */}
          <div className="mt-9 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <form className="flex flex-col md:flex-row gap-4" onSubmit={trackReport}>
              {/* Input */}
              <div className="relative flex-1">
                <Search
                  size={21}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={reportId}
                  onChange={(e) => {
                    setReportId(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder={`${t("track.search.label")} (e.g. ${t("track.search.placeholder")})`}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="md:w-56 flex items-center justify-center gap-2 px-6 py-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t("track.search.loading")}
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    {t("track.search.submit")}
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4">
              {t("track.search.noLogin")}
            </p>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
          {/* =====================================================
              LEFT SIDE
          ====================================================== */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6">
            {loading ? (
              <div className="flex justify-center items-center gap-3 py-20 text-gray-500">
                <Loader2 size={20} className="animate-spin" />

                <span className="text-sm">{t("track.loading")}</span>
              </div>
            ) : !searched ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                  <Search size={20} />
                </div>

                <h3 className="font-bold text-gray-900 mt-4">
                  {t("track.empty.title")}
                </h3>

                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  {t("track.empty.body")}
                </p>

                <ol className="mt-5 max-w-md mx-auto text-left space-y-2">
                  {[1, 2, 3].map((step) => (
                    <li key={step} className="flex gap-3">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {step}
                      </span>

                      <span className="text-sm text-gray-700">
                        {t(`track.empty.step${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : errorMsg ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Search size={20} />
                </div>

                <p className="text-sm text-red-600 mt-4">{errorMsg}</p>

                <button
                  type="button"
                  onClick={resetSearch}
                  className="mt-4 text-sm font-semibold text-blue-700 underline hover:text-blue-900 cursor-pointer"
                >
                  {t("track.reset")}
                </button>
              </div>
            ) : report ? (
              <>
                {/* Report found */}
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <Check size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold text-green-700">
                      {t("track.found.title")}
                    </h3>

                    <p className="text-sm text-green-600">
                      {t("track.found.body")}
                    </p>
                  </div>
                </div>

                {/* Report ID */}
                <div className="mt-5 rounded-xl border border-blue-100 overflow-hidden">
                  <div className="bg-blue-50 px-5 py-4">
                    <p className="text-xs font-semibold text-gray-600">
                      {t("track.result.reportId")}
                    </p>

                    <div className="flex items-center gap-3 mt-1">
                      <h3 className="text-xl font-extrabold text-blue-900">
                        {report.reportId}
                      </h3>

                      <button
                        type="button"
                        onClick={() => copy(report.reportId)}
                        className="text-blue-700 hover:text-blue-900 cursor-pointer"
                        title={copied ? t("track.result.copied") : t("track.result.copyId")}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* ==================== SUMMARY ==================== */}
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-5 border-b border-gray-200">
                      {/* Status */}
                      <div className="flex gap-3">
                        <Clock3 className="text-blue-900 shrink-0" size={22} />

                        <div>
                          <p className="text-xs text-gray-500">
                            {t("track.labels.status")}
                          </p>

                          <span
                            className={`inline-block mt-1 px-3 py-1 rounded-md text-sm font-semibold ${
                              STATUS_BADGE[report.status] ||
                              STATUS_BADGE.PENDING
                            }`}
                          >
                            {t(`track.status.${report.status}.label`, {
                              defaultValue: report.status,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="flex gap-3">
                        <Flag className="text-blue-900 shrink-0" size={22} />

                        <div>
                          <p className="text-xs text-gray-500">
                            {t("track.priority.label")}
                          </p>

                          <span
                            className={`inline-block mt-1 px-3 py-1 rounded-md text-sm font-semibold ${
                              PRIORITY_BADGE[report.priority] ||
                              PRIORITY_BADGE.MEDIUM
                            }`}
                          >
                            {t(`track.priority.${report.priority}`, {
                              defaultValue: report.priority,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Department */}
                      <div className="flex gap-3">
                        <Building2 className="text-blue-900 shrink-0" size={22} />

                        <div>
                          <p className="text-xs text-gray-500">
                            {t("track.result.department")}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-800">
                            {report.assignedDepartment?.name ||
                              t("track.result.notAssigned")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ==================== LOCATION ==================== */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-5 py-5 border-b border-gray-200">
                      <div>
                        <div className="flex gap-3">
                          <MapPin className="text-blue-900 shrink-0" size={22} />

                          <div>
                            <p className="text-xs text-gray-500">
                              {t("track.place.title")}
                            </p>

                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {report.location?.address ||
                                t("track.result.noAddress")}
                            </p>

                            {hasCoordinates && (
                              <p className="text-xs text-gray-500 mt-2">
                                {t("track.labels.latitude")}:{" "}
                                {report.location.latitude}
                                <span className="mx-2">|</span>
                                {t("track.labels.longitude")}:{" "}
                                {report.location.longitude}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Created */}
                        <div className="flex gap-3 mt-6">
                          <CalendarDays className="text-blue-900 shrink-0" size={22} />

                          <div>
                            <p className="text-xs text-gray-500">
                              {t("track.labels.createdAt")}
                            </p>

                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {formatDateTime(report.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Map placeholder */}
                      <div className="h-28 md:h-24 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin size={30} className="mx-auto text-red-500" />

                          <p className="text-xs text-gray-500 mt-1">
                            {t("track.place.title")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ==================== ISSUE DETAILS ==================== */}
                    <div className="pt-5">
                      <h3 className="font-bold text-gray-900 mb-4">
                        {t("track.issue.title")}
                      </h3>

                      <div className="flex flex-col sm:flex-row gap-5">
                        {/* Image */}
                        {report.photo?.url ? (
                          <img
                            src={report.photo.url}
                            alt={t("track.result.photoAlt")}
                            className="w-full sm:w-32 h-28 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full sm:w-32 h-28 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-center px-3">
                            <ImageOff size={22} className="text-blue-400" />

                            <p className="text-xs text-gray-500 mt-1">
                              {t("track.issue.noPhoto")}
                            </p>
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1">
                          <div className="mb-3">
                            <p className="text-xs text-gray-500">
                              {t("track.labels.title")}
                            </p>

                            <p className="text-sm font-medium text-gray-800">
                              {report.title}
                            </p>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs text-gray-500">
                              {t("track.categoryLabel")}
                            </p>

                            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                              {getCategoryLabel(report.category)}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              {t("track.labels.description")}
                            </p>

                            <p className="text-sm text-gray-700 leading-relaxed mt-1 whitespace-pre-line">
                              {report.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* =====================================================
              RIGHT SIDE — TRACKING TIMELINE
          ====================================================== */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-7">
              {t("track.timeline.title")}
            </h2>

            {!report?.updates?.length ? (
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="font-semibold text-gray-800">
                  {t("track.result.noUpdate")}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  {t("track.timeline.expectedBody")}
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[14px] top-3 bottom-5 w-[2px] bg-gray-200"></div>

                <div className="space-y-5">
                  {report.updates.map((update, index) => {
                    const type =
                      TIMELINE_TYPE[update.status] || TIMELINE_TYPE.PENDING;

                    return (
                      <div key={update._id ?? index} className="relative flex gap-5">
                        {/* Timeline dot */}
                        <div
                          className={`relative z-10 w-7 h-7 shrink-0 rounded-full flex items-center justify-center border-4 border-white ${
                            DOT_COLOR[type]
                          }`}
                        >
                          {type === "completed" && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>

                        {/* Update card */}
                        <div className={`flex-1 rounded-xl p-5 ${CARD_COLOR[type]}`}>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(update.createdAt)}
                          </p>

                          <h3 className="font-bold text-gray-900 mt-2">
                            {t(`track.status.${update.status}.label`, {
                              defaultValue: update.status,
                            })}
                          </h3>

                          {update.message && (
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                              {update.message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Future update */}
                  {!CLOSED_STATUSES.includes(report.status) && (
                    <div className="relative flex gap-5">
                      <div className="relative z-10 w-7 h-7 shrink-0 rounded-full bg-white border-2 border-gray-400"></div>

                      <div className="flex-1 bg-gray-50 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-800">
                          {t("track.timeline.expected")}
                        </h3>

                        <p className="text-sm text-gray-500 mt-2">
                          {t("track.timeline.expectedBody")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackReport;