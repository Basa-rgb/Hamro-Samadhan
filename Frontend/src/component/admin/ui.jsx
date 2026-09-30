import React from "react";
import { Loader2 } from "lucide-react";
import {
    STATUS_BADGE,
    PRIORITY_BADGE,
    getStatusLabel,
    getPriorityLabel,
} from "./reportMeta";

// Small pieces the three admin screens all need, kept together so a badge or
// a spinner looks the same everywhere

export const Spinner = ({ size = 20, className = "" }) => (
    <Loader2 size={size} className={`animate-spin ${className}`} />
);

export const StatusBadge = ({ value }) => {
    if (!value) return null;

    return (
        <span
            className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${
                STATUS_BADGE[value] || STATUS_BADGE.PENDING
            }`}
        >
            {getStatusLabel(value)}
        </span>
    );
};

export const PriorityBadge = ({ value }) => {
    if (!value) return null;

    return (
        <span
            className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${
                PRIORITY_BADGE[value] || PRIORITY_BADGE.MEDIUM
            }`}
        >
            {getPriorityLabel(value)}
        </span>
    );
};

const TONE = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
};

export const StatCard = ({ icon: Icon, label, value, hint, tone = "blue" }) => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}
                </p>

                <p className="text-3xl font-extrabold text-gray-900 mt-2">
                    {value}
                </p>

                {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
            </div>

            {Icon && (
                <div
                    className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
                        TONE[tone] || TONE.blue
                    }`}
                >
                    <Icon size={22} />
                </div>
            )}
        </div>
    </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>

            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {action}
    </div>
);

export const EmptyState = ({ icon: Icon, title, body }) => (
    <div className="py-14 text-center">
        {Icon && (
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Icon size={24} />
            </div>
        )}

        <p className="font-semibold text-gray-800 mt-4">{title}</p>

        {body && <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{body}</p>}
    </div>
);

// Banners for a failed action, kept inline rather than as a popup
export const ErrorBanner = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 flex-1">{message}</p>

            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                >
                    Dismiss
                </button>
            )}
        </div>
    );
};

// The shared shape for the filter and form controls
export const FIELD_CLASS =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60 disabled:cursor-not-allowed";

export const LABEL_CLASS = "block text-xs font-semibold text-gray-600 mb-1.5";

export const PRIMARY_BUTTON_CLASS =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-600 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100";

export const SECONDARY_BUTTON_CLASS =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100";