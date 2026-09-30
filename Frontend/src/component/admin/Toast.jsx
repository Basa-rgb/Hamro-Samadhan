import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const TONE = {
    success: {
        wrap: "bg-green-50 border-green-200",
        icon: "text-green-600",
        text: "text-green-800",
        Icon: CheckCircle2,
    },
    error: {
        wrap: "bg-red-50 border-red-200",
        icon: "text-red-600",
        text: "text-red-800",
        Icon: AlertCircle,
    },
};

// Fixed to the bottom right so it never pushes the page around
const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;

    const { wrap, icon, text, Icon } = TONE[toast.type] || TONE.error;

    return (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm">
            <div
                className={`flex items-start gap-3 ${wrap} border rounded-xl px-4 py-3 shadow-lg`}
                role="status"
            >
                <Icon size={20} className={`shrink-0 mt-0.5 ${icon}`} />

                <p className={`text-sm flex-1 ${text}`}>{toast.message}</p>

                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss notification"
                    className={`shrink-0 ${icon} hover:opacity-70 cursor-pointer`}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;