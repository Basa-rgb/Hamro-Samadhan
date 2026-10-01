import React, { useEffect, useState } from "react";
import {
  X,
  MapPin,
  CalendarDays,
  User,
  Phone,
  Mail,
  Building2,
  ImageOff,
  History,
} from "lucide-react";
import {
  getReportById,
  getReportUpdates,
} from "../../../services/AdminService";
import { Spinner, StatusBadge, PriorityBadge, ErrorBanner } from "./ui";
import { getStatusLabel } from "./reportMeta";
import useCategoryLabel from "../../Hooks/useCategoryLabel";

// Declared outside the panel, a component built during render would be a new
// type on every render and would remount its subtree each time
const Field = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3">
    <Icon size={16} className="text-gray-400 shrink-0 mt-0.5" />

    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>

      <div className="text-sm text-gray-800 mt-0.5 break-words">{children}</div>
    </div>
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Slide-over with everything known about one report, including the contact
// details and the storage id that the public tracking page deliberately hides.
// The panel is mounted with a key, so opening a different report resets the
// data and the spinner starts fresh
const ReportDetailPanel = ({ reportId, onClose, onChanged }) => {
  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // Resolved from the API, not from a local list, so a category added in the
  // portal is labelled correctly here without a deploy
  const getCategoryLabel = useCategoryLabel();

  // The manual refresh bumps the token, which re-runs the effect below
  const handleRefresh = () => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  };

  // The request lives inside the effect, so a panel closed mid request never
  // sets state on an unmounted component
  useEffect(() => {
    let active = true;

    const fetchReport = async () => {
      try {
        // Both are needed, the report and its full change history
        const [reportResponse, updatesResponse] = await Promise.all([
          getReportById(reportId),
          getReportUpdates(reportId),
        ]);

        if (!active) return;

        setErrorMsg("");
        setReport(reportResponse.report);
        setUpdates(updatesResponse.updates);
      } catch (error) {
        if (!active) return;

        setReport(null);
        setUpdates([]);

        setErrorMsg(
          error.response?.data?.message || "Could not load this report.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      active = false;
    };
  }, [reportId, reloadToken]);

  // Escape closes the panel, which is what an admin expects from an overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    // The page behind must not scroll while the panel is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="relative w-full sm:max-w-xl bg-white h-full overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Report details"
      >
        {/* ==================== HEADER ==================== */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-blue-800">
              {report?.reportId || "Loading..."}
            </p>

            <h2 className="text-lg font-extrabold text-gray-900 mt-0.5 truncate">
              {report?.title || "Report details"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
              <Spinner />

              <span className="text-sm">Loading report...</span>
            </div>
          ) : (
            <>
              <ErrorBanner
                message={errorMsg}
                onDismiss={() => setErrorMsg("")}
              />

              {report && (
                <>
                  {/* ==================== SUMMARY ==================== */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Status</p>

                      <div className="mt-1.5">
                        <StatusBadge value={report.status} />
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Priority</p>

                      <div className="mt-1.5">
                        <PriorityBadge value={report.priority} />
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Department</p>

                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {report.assignedDepartment?.name || "Not assigned"}
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Category</p>

                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {getCategoryLabel(report.category)}
                      </p>
                    </div>
                  </div>

                  {/* ==================== DESCRIPTION ==================== */}
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-gray-600">
                      Description
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mt-1.5 whitespace-pre-line">
                      {report.description}
                    </p>
                  </div>

                  {/* ==================== PHOTO ==================== */}
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-gray-600">Photo</p>

                    {report.photo?.url ? (
                      <a
                        href={report.photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-2"
                      >
                        <img
                          src={report.photo.url}
                          alt="Attached by the reporter"
                          className="w-full h-56 object-cover rounded-xl border border-gray-200"
                        />
                      </a>
                    ) : (
                      <div className="mt-2 h-24 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                        <ImageOff size={20} />

                        <p className="text-xs mt-1">No photo attached</p>
                      </div>
                    )}
                  </div>

                  {/* ==================== FACTS ==================== */}
                  <div className="mt-5 pt-5 border-t border-gray-200 flex flex-col gap-4">
                    <Field icon={MapPin} label="Location">
                      {report.location?.address || "Not provided"}
                      {report.location?.latitude != null &&
                        report.location?.longitude != null && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {report.location.latitude},{" "}
                            {report.location.longitude}
                          </p>
                        )}
                    </Field>

                    <Field icon={CalendarDays} label="Submitted">
                      {formatDateTime(report.createdAt)}
                    </Field>

                    <Field icon={CalendarDays} label="Last updated">
                      {formatDateTime(report.updatedAt)}
                    </Field>

                    {/* Internal only, never shown to the citizen */}
                    <Field icon={User} label="Reporter">
                      {report.reporter?.name}
                    </Field>

                    <Field icon={Mail} label="Reporter email">
                      <a
                        href={`mailto:${report.reporter?.email}`}
                        className="text-blue-700 hover:underline"
                      >
                        {report.reporter?.email}
                      </a>
                    </Field>

                    <Field icon={Phone} label="Reporter phone">
                      <a
                        href={`tel:${report.reporter?.phone}`}
                        className="text-blue-700 hover:underline"
                      >
                        {report.reporter?.phone}
                      </a>
                    </Field>
                  </div>

                  {/* ==================== HISTORY ==================== */}
                  <div className="mt-6 pt-5 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-blue-700" />

                      <h3 className="font-bold text-gray-900">
                        Change history
                      </h3>
                    </div>

                    {!updates.length ? (
                      <p className="text-sm text-gray-500 mt-3">
                        No changes recorded yet.
                      </p>
                    ) : (
                      <ol className="mt-4 flex flex-col gap-4">
                        {updates.map((update) => (
                          <li
                            key={update._id}
                            className="border-l-2 border-blue-200 pl-4"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-800">
                                {getStatusLabel(update.status)}
                              </span>

                              <span className="text-xs text-gray-400">
                                {formatDateTime(update.createdAt)}
                              </span>
                            </div>

                            {update.message && (
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                {update.message}
                              </p>
                            )}

                            {update.updatedBy && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Building2 size={12} />
                                {update.updatedBy.name}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleRefresh();
                      onChanged?.();
                    }}
                    className="mt-6 text-sm font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    Refresh this report
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ReportDetailPanel;
