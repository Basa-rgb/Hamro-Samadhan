import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    Clock3,
    Inbox,
    CheckCircle2,
    Building2,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    ArrowRight,
} from "lucide-react";
import { getAdminStats } from "../../../services/AdminService";
import {
    StatCard,
    PageHeader,
    Spinner,
    EmptyState,
    ErrorBanner,
    StatusBadge,
    PriorityBadge,
    SECONDARY_BUTTON_CLASS,
} from "../../component/admin/ui";
import {
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    STATUS_BAR,
    PRIORITY_BAR,
    getStatusLabel,
    getPriorityLabel,
} from "../../component/admin/reportMeta";

// Counted by the server in one round trip, so the page stays fast as the table
// grows. A manual refresh is offered because this is a live queue
const AdminDashboard = () => {
    const [ stats, setStats ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ errorMsg, setErrorMsg ] = useState("");
    const [ reloadToken, setReloadToken ] = useState(0);

    // The manual refresh bumps the token, which re-runs the effect below. Raising
    // the spinner here, from the click, keeps it off the effect path
    const handleRefresh = () => {
        setLoading(true);
        setReloadToken((token) => token + 1);
    };

    // The request lives inside the effect rather than in a useCallback, so the
    // in-flight result is dropped when the page unmounts mid request
    useEffect(() => {
        let active = true;

        const loadStats = async () => {
            try {
                const response = await getAdminStats();

                if (!active) return;

                setErrorMsg("");
                setStats(response.stats);
            } catch (error) {
                if (!active) return;

                setErrorMsg(
                    error.response?.data?.message || "Could not load the dashboard.",
                );
            } finally {
                if (active) setLoading(false);
            }
        };

        loadStats();

        return () => {
            active = false;
        };
    }, [reloadToken]);

    const formatDateTime = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    // Bars are scaled against the tallest day, so a quiet week still reads as a
    // chart instead of seven flat lines
    const trendMax = stats
        ? Math.max(1, ...stats.trend.map((day) => day.count))
        : 1;

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Live view of citizen reports across every department"
                action={
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className={SECONDARY_BUTTON_CLASS}
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                }
            />

            <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg("")} />

            {loading && !stats ? (
                <div className="flex items-center justify-center gap-3 py-24 text-gray-500">
                    <Spinner />

                    <span className="text-sm">Loading dashboard...</span>
                </div>
            ) : !stats ? null : (
                <>
                    {/* ==================== STAT CARDS ==================== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <StatCard
                            icon={FileText}
                            label="Total reports"
                            value={stats.total}
                hint="All time"
                            tone="blue"
                        />

                        <StatCard
                            icon={Clock3}
                            label="Open"
                            value={stats.open}
                            hint="Pending, under review, in progress"
                            tone="amber"
                        />

                        <StatCard
                            icon={Inbox}
                            label="Unassigned"
                            value={stats.unassigned}
                            hint="Open reports with no department"
                            tone={stats.unassigned > 0 ? "red" : "green"}
                        />

                        <StatCard
                            icon={CheckCircle2}
                            label="Resolved this week"
                            value={stats.resolvedThisWeek}
                            hint={`Last 7 days, ${stats.activeDepartments} active ${
                                stats.activeDepartments === 1 ? "department" : "departments"
                            }`}
                            tone="green"
                        />
                    </div>

                    {/* A count the admin can act on right away */}
                    {stats.unassigned > 0 && (
                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
                            <AlertCircle size={20} className="text-red-600 shrink-0" />

                            <p className="text-sm text-red-800 flex-1">
                                {stats.unassigned} open{" "}
                                {stats.unassigned === 1 ? "report has" : "reports have"}{" "}
                                no department assigned.
                            </p>

                            <Link
                                to="/admin/reports?status=PENDING"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-red-700 hover:text-red-900"
                            >
                                Review them
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    )}

                    {/* ==================== BREAKDOWN + TREND ==================== */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                            <h2 className="font-bold text-gray-900">
                                Reports by status
                            </h2>

                            <div className="mt-5 flex flex-col gap-4">
                                {STATUS_OPTIONS.map((option) => {
                                    const count = stats.byStatus[option.value] || 0;

                                    // Scaled against the whole, so the bars read as
                                    // a share of all reports
                                    const width = stats.total
                                        ? Math.round((count / stats.total) * 100)
                                        : 0;

                                    return (
                                        <div key={option.value}>
                                            <div className="flex items-center justify-between text-sm mb-1.5">
                                                <span className="font-semibold text-gray-700">
                                                    {getStatusLabel(option.value)}
                                                </span>

                                                <span className="text-gray-500 tabular-nums">
                                                    {count}
                                                </span>
                                            </div>

                                            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        STATUS_BAR[option.value]
                                                    }`}
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                            <h2 className="font-bold text-gray-900">
                                Reports by priority
                            </h2>

                            <div className="mt-5 flex flex-col gap-4">
                                {PRIORITY_OPTIONS.map((option) => {
                                    const count = stats.byPriority[option.value] || 0;

                                    const width = stats.total
                                        ? Math.round((count / stats.total) * 100)
                                        : 0;

                                    return (
                                        <div key={option.value}>
                                            <div className="flex items-center justify-between text-sm mb-1.5">
                                                <span className="font-semibold text-gray-700">
                                                    {getPriorityLabel(option.value)}
                                                </span>

                                                <span className="text-gray-500 tabular-nums">
                                                    {count}
                                                </span>
                                            </div>

                                            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        PRIORITY_BAR[option.value]
                                                    }`}
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ==================== 7 DAY TREND ==================== */}
                    <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-700" />

                            <h2 className="font-bold text-gray-900">
                                New reports, last 7 days
                            </h2>
                        </div>

                        <div className="mt-6 flex items-end gap-2 sm:gap-4 h-40">
                            {stats.trend.map((day) => {
                                const date = new Date(`${day.date}T00:00:00Z`);
                                const label = Number.isNaN(date.getTime())
                                    ? day.date
                                    : date.toLocaleDateString("en-US", {
                                          weekday: "short",
                                          timeZone: "UTC",
                                      });

                                // A zero day still needs a visible stub
                                const height = day.count
                                    ? Math.max(6, Math.round((day.count / trendMax) * 100))
                                    : 2;

                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
                                    >
                                        <span className="text-xs font-bold text-gray-600 tabular-nums">
                                            {day.count}
                                        </span>

                                        <div
                                            className="w-full max-w-12 rounded-t-lg bg-blue-500 hover:bg-blue-600 transition"
                                            style={{ height: `${height}%` }}
                                            title={`${label}: ${day.count} new`}
                                        />

                                        <span className="text-[11px] text-gray-500">
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ==================== RECENT REPORTS ==================== */}
                    <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
                            <h2 className="font-bold text-gray-900">
                                Latest reports
                            </h2>

                            <Link
                                to="/admin/reports"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900"
                            >
                                View all
                                <ArrowRight size={15} />
                            </Link>
                        </div>

                        {!stats.recent.length ? (
                            <EmptyState
                                icon={Building2}
                                title="No reports yet"
                                body="Once citizens start filing complaints they will show up here."
                            />
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {stats.recent.map((report) => (
                                    <li
                                        key={report._id}
                                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-blue-800">
                                                    {report.reportId}
                                                </span>

                                                <StatusBadge value={report.status} />

                                                <PriorityBadge value={report.priority} />
                                            </div>

                                            <p className="text-sm font-semibold text-gray-800 mt-1.5 truncate">
                                                {report.title}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatDateTime(report.createdAt)}
                                                {report.assignedDepartment?.name
                                                    ? `, ${report.assignedDepartment.name}`
                                                    : ", no department"}
                                            </p>
                                        </div>

                                        <Link
                                            to={`/admin/reports?report=${report._id}`}
                                            className="text-sm font-semibold text-blue-700 hover:text-blue-900 shrink-0"
                                        >
                                            Open
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;