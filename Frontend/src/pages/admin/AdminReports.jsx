import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Search,
    RefreshCw,
    FileText,
    X,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
} from "lucide-react";
import {
    getReports,
    getDepartments,
    updateReportStatus,
    updateReportPriority,
    assignDepartment,
} from "../../../services/AdminService";
import {
    PageHeader,
    Spinner,
    EmptyState,
    ErrorBanner,
    StatusBadge,
    FIELD_CLASS,
    LABEL_CLASS,
    PRIMARY_BUTTON_CLASS,
    SECONDARY_BUTTON_CLASS,
} from "../../component/admin/ui";
import Toast from "../../component/admin/Toast";
import ReportDetailPanel from "../../component/admin/ReportDetailPanel";
import {
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    getCategoryLabel,
} from "../../component/admin/reportMeta";
import { useToast } from "../../Hooks/useToast";

const PAGE_SIZE = 20;

// Compact page numbers around the current page, so a long list never renders
// hundreds of buttons
const buildPageList = (current, total) => {
    const pages = [];

    for (let page = 1; page <= total; page += 1) {
        const isEdge = page === 1 || page === total;
        const isNear = Math.abs(page - current) <= 1;

        if (isEdge || isNear) {
            pages.push(page);
        } else if (pages[pages.length - 1] !== "gap") {
            pages.push("gap");
        }
    }

    return pages;
};

const AdminReports = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();

    // The filters live in the URL, so a link from the dashboard, or a shared
    // link from a colleague, opens on exactly the same view
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const page = Number(searchParams.get("page")) || 1;
    const detailId = searchParams.get("report");

    // The text box is separate so typing does not fire a request per keystroke
    const [ searchInput, setSearchInput ] = useState(
        searchParams.get("search") || "",
    );
    const search = searchParams.get("search") || "";

    const [ reports, setReports ] = useState([]);
    const [ total, setTotal ] = useState(0);
    const [ totalPages, setTotalPages ] = useState(1);
    const [ loading, setLoading ] = useState(true);
    const [ errorMsg, setErrorMsg ] = useState("");

    const [ departments, setDepartments ] = useState([]);
    const [ busyRowId, setBusyRowId ] = useState(null);
    const [ reloadToken, setReloadToken ] = useState(0);

    // The status dialog, because a status change also carries a note that is
    // emailed to the reporter
    const [ statusDialog, setStatusDialog ] = useState(null);

    const { toast, showToast, clearToast } = useToast();

    // Writes a filter back to the URL. page always resets to 1 when a filter
    // changes, otherwise the admin can land on an empty page.
    // The spinner is raised here, from the click or keystroke that caused the
    // change, rather than inside the effect that follows it
    const updateParams = useCallback(
        (changes, { keepPage = false } = {}) => {
            setLoading(true);

            setSearchParams(
                (previous) => {
                    const next = new URLSearchParams(previous);

                    Object.entries(changes).forEach(([key, value]) => {
                        if (value) {
                            next.set(key, value);
                        } else {
                            next.delete(key);
                        }
                    });

                    if (!keepPage) next.delete("page");

                    return next;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    // No leading setLoading, the spinner is raised by the interaction that changed
    // a filter, and the banner is cleared once a request succeeds
    useEffect(() => {
        let active = true;

        const fetchReports = async () => {
            try {
                const response = await getReports({
                    page,
                    limit: PAGE_SIZE,
                    status: status || undefined,
                    priority: priority || undefined,
                    search: search || undefined,
                });

                if (!active) return;

                setErrorMsg("");
                setReports(response.reports);
                setTotal(response.total);
                setTotalPages(response.totalPages);
            } catch (error) {
                if (!active) return;

                setReports([]);
                setErrorMsg(
                    error.response?.data?.message || "Could not load the reports.",
                );
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchReports();

        return () => {
            active = false;
        };
    }, [page, status, priority, search, reloadToken]);

    // The manual refresh bumps the token, which re-runs the effect above
    const loadReports = () => {
        setLoading(true);
        setReloadToken((token) => token + 1);
    };

    // The department list is only needed for the assignment dropdowns
    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const response = await getDepartments();

                setDepartments(response.departments);
            } catch {
                // Assignment still works from the list, it just cannot be picked
                setDepartments([]);
            }
        };

        loadDepartments();
    }, []);

    // 400ms after the last keystroke, so typing a report id costs one request
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== search) {
                updateParams({ search: searchInput.trim() });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchInput, search, updateParams]);

    const activeFilterCount = [status, priority, search].filter(Boolean).length;

    const clearFilters = () => {
        setSearchInput("");
        setLoading(true);
        setSearchParams({}, { replace: true });
    };

    const formatDateTime = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Row level edits refresh only the row that changed, so the page does not
    // jump back to the top while an admin is working down a list
    const patchRow = (id, changes) => {
        setReports((previous) =>
            previous.map((report) =>
                report._id === id ? { ...report, ...changes } : report,
            ),
        );
    };

    const handleStatusSave = async () => {
        const { report, nextStatus, message } = statusDialog;

        setBusyRowId(report._id);

        try {
            await updateReportStatus(report._id, nextStatus, message);

            patchRow(report._id, { status: nextStatus });

            showToast("success", `${report.reportId} moved to ${nextStatus.replace(/_/g, " ").toLowerCase()}.`);
            setStatusDialog(null);
        } catch (error) {
            showToast(
                "error",
                error.response?.data?.message || "Could not update the status.",
            );
        } finally {
            setBusyRowId(null);
        }
    };

    const handlePriorityChange = async (report, nextPriority) => {
        if (nextPriority === report.priority) return;

        const previous = report.priority;

        setBusyRowId(report._id);

        // Shown straight away, reverted if the server refuses
        patchRow(report._id, { priority: nextPriority });

        try {
            await updateReportPriority(report._id, nextPriority);

            showToast("success", `${report.reportId} priority set to ${nextPriority.toLowerCase()}.`);
        } catch (error) {
            patchRow(report._id, { priority: previous });

            showToast(
                "error",
                error.response?.data?.message || "Could not update the priority.",
            );
        } finally {
            setBusyRowId(null);
        }
    };

    const handleDepartmentChange = async (report, departmentId) => {
        if (!departmentId) return;

        const previous = report.assignedDepartment;
        const chosen = departments.find((item) => item._id === departmentId);
        // The dropdown is built from the same list, so this only matters if the
        // list changed mid request. Never read .name off an undefined match
        const chosenName = chosen?.name || "the selected department";

        setBusyRowId(report._id);

        patchRow(report._id, {
            assignedDepartment: chosen
                ? { _id: chosen._id, name: chosen.name }
                : null,
        });

        try {
            await assignDepartment(report._id, departmentId);

            showToast("success", `${report.reportId} assigned to ${chosenName}.`);
        } catch (error) {
            patchRow(report._id, { assignedDepartment: previous });

            showToast(
                "error",
                error.response?.data?.message || "Could not assign the department.",
            );
        } finally {
            setBusyRowId(null);
        }
    };

    const pageList = useMemo(
        () => buildPageList(page, totalPages),
        [page, totalPages],
    );

    return (
        <div>
            <PageHeader
                title="Reports"
                subtitle={
                    loading
                        ? "Loading..."
                        : `${total} ${total === 1 ? "report" : "reports"} match the current filters`
                }
                action={
                    <button
                        type="button"
                        onClick={loadReports}
                        disabled={loading}
                        className={SECONDARY_BUTTON_CLASS}
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                }
            />

            {/* ==================== FILTERS ==================== */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                        <label htmlFor="search" className={LABEL_CLASS}>
                            Search
                        </label>

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />

                            <input
                                id="search"
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Report ID or title"
                                className={`${FIELD_CLASS} pl-10`}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status" className={LABEL_CLASS}>
                            Status
                        </label>

                        <select
                            id="status"
                            value={status}
                            onChange={(e) => updateParams({ status: e.target.value })}
                            className={FIELD_CLASS}
                        >
                            <option value="">All statuses</option>

                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className={LABEL_CLASS}>
                            Priority
                        </label>

                        <select
                            id="priority"
                            value={priority}
                            onChange={(e) => updateParams({ priority: e.target.value })}
                            className={FIELD_CLASS}
                        >
                            <option value="">All priorities</option>

                            {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            {activeFilterCount} filter
                            {activeFilterCount === 1 ? "" : "s"} applied
                        </p>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                            <X size={13} />
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg("")} />
            </div>

            {/* ==================== TABLE ==================== */}
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {loading && !reports.length ? (
                    <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
                        <Spinner />

                        <span className="text-sm">Loading reports...</span>
                    </div>
                ) : !reports.length ? (
                    <EmptyState
                        icon={FileText}
                        title="No reports found"
                        body={
                            activeFilterCount
                                ? "No report matches these filters. Try clearing them."
                                : "Citizen reports will appear here as they are filed."
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-5xl">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                        Report
                                    </th>

                                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                        Priority
                                    </th>

                                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                        Department
                                    </th>

                                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                        Submitted
                                    </th>

                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {reports.map((report) => {
                                    const isBusy = busyRowId === report._id;

                                    return (
                                        <tr
                                            key={report._id}
                                            className={`align-top ${
                                                isBusy ? "opacity-60" : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <td className="px-4 py-3.5 max-w-sm">
                                                <p className="text-xs font-bold text-blue-800">
                                                    {report.reportId}
                                                </p>

                                                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                                    {report.title}
                                                </p>

                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {getCategoryLabel(report.category)}
                                                </p>
                                            </td>

                                            {/* Clicking opens the note dialog, the
                                                change is mailed to the reporter */}
                                            <td className="px-4 py-3.5">
                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        setStatusDialog({
                                                            report,
                                                            nextStatus: report.status,
                                                            message: "",
                                                        })
                                                    }
                                                    title="Change status"
                                                    className="cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <StatusBadge value={report.status} />
                                                </button>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={report.priority}
                                                    disabled={isBusy}
                                                    onChange={(e) =>
                                                        handlePriorityChange(
                                                            report,
                                                            e.target.value,
                                                        )
                                                    }
                                                    aria-label={`Priority for ${report.reportId}`}
                                                    className="text-xs font-semibold px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 cursor-pointer"
                                                >
                                                    {PRIORITY_OPTIONS.map((option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={
                                                        report.assignedDepartment?._id || ""
                                                    }
                                                    disabled={isBusy}
                                                    onChange={(e) =>
                                                        handleDepartmentChange(
                                                            report,
                                                            e.target.value,
                                                        )
                                                    }
                                                    aria-label={`Department for ${report.reportId}`}
                                                    className="text-xs font-semibold px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 cursor-pointer max-w-44"
                                                >
                                                    {/* Placeholder only. There is no
                                                        unassign endpoint, so it must
                                                        not look selectable */}
                                                    <option value="" disabled>
                                                        Unassigned
                                                    </option>

                                                    {departments
                                                        // Retired departments keep
                                                        // their old reports, so an
                                                        // existing assignment has
                                                        // to stay selectable
                                                        .filter(
                                                            (department) =>
                                                                department.isActive ||
                                                                department._id ===
                                                                    report
                                                                        .assignedDepartment
                                                                        ?._id,
                                                        )
                                                        .map((department) => (
                                                            <option
                                                                key={department._id}
                                                                value={department._id}
                                                            >
                                                                {department.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                                                {formatDateTime(report.createdAt)}
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateParams(
                                                            { report: report._id },
                                                            { keepPage: true },
                                                        )
                                                    }
                                                    className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer whitespace-nowrap"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ==================== PAGINATION ==================== */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">
                            Page {page} of {totalPages}
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => updateParams({ page: page - 1 }, { keepPage: true })}
                                disabled={page <= 1 || loading}
                                aria-label="Previous page"
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {pageList.map((item, index) =>
                                item === "gap" ? (
                                    <span
                                        key={`gap-${index}`}
                                        className="px-1 text-xs text-gray-400"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() =>
                                            updateParams({ page: item }, { keepPage: true })
                                        }
                                        aria-current={item === page ? "page" : undefined}
                                        className={`min-w-9 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                            item === page
                                                ? "bg-blue-700 text-white border-blue-700"
                                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ),
                            )}

                            <button
                                type="button"
                                onClick={() => updateParams({ page: page + 1 }, { keepPage: true })}
                                disabled={page >= totalPages || loading}
                                aria-label="Next page"
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ==================== STATUS DIALOG ==================== */}
            {statusDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setStatusDialog(null)}
                        aria-hidden="true"
                    />

                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Change report status"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                <MessageSquare size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900">
                                    Change status
                                </h3>

                                <p className="text-xs text-gray-500 mt-0.5">
                                    {statusDialog.report.reportId}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStatusDialog(null)}
                                aria-label="Close"
                                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 flex flex-col gap-4">
                            <div>
                                <label htmlFor="nextStatus" className={LABEL_CLASS}>
                                    New status
                                </label>

                                <select
                                    id="nextStatus"
                                    value={statusDialog.nextStatus}
                                    onChange={(e) =>
                                        setStatusDialog({
                                            ...statusDialog,
                                            nextStatus: e.target.value,
                                        })
                                    }
                                    className={FIELD_CLASS}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="message" className={LABEL_CLASS}>
                                    Note for the reporter
                                </label>

                                <textarea
                                    id="message"
                                    rows={4}
                                    maxLength={1000}
                                    value={statusDialog.message}
                                    onChange={(e) =>
                                        setStatusDialog({
                                            ...statusDialog,
                                            message: e.target.value,
                                        })
                                    }
                                    placeholder="Optional. This is emailed to the citizen and shown on the tracking page."
                                    className={`${FIELD_CLASS} resize-y`}
                                />

                                <p className="text-[11px] text-gray-400 mt-1">
                                    {statusDialog.message.length}/1000
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setStatusDialog(null)}
                                className={SECONDARY_BUTTON_CLASS}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleStatusSave}
                                disabled={
                                    busyRowId === statusDialog.report._id ||
                                    statusDialog.nextStatus ===
                                        statusDialog.report.status
                                }
                                className={PRIMARY_BUTTON_CLASS}
                            >
                                {busyRowId === statusDialog.report._id ? (
                                    <>
                                        <Spinner size={16} />
                                        Saving...
                                    </>
                                ) : (
                                    "Save and notify"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detailId && (
                // key forces a fresh mount per report, so opening a different one starts
                // from a clean loading state instead of showing the last report
                <ReportDetailPanel
                    key={detailId}
                    reportId={detailId}
                    onClose={() => updateParams({ report: "" }, { keepPage: true })}
                    onChanged={loadReports}
                />
            )}

            <Toast toast={toast} onDismiss={clearToast} />
        </div>
    );
};

export default AdminReports;