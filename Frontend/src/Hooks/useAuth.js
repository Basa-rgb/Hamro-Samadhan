import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";

// Always called inside AuthProvider, so the context is never null here
//
// isAdmin and isDepartmentAdmin are derived from the role the server sent with
// /auth/me. They gate what the portal shows, never what it can do: every
// restricted screen is also behind requireAdmin on the server, so hiding a menu
// is a courtesy and the permission is the actual control
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    const { user } = context;

    const flags = useMemo(
        () => ({
            isAdmin: user?.role === "admin",
            isDepartmentAdmin: user?.role === "department_admin",
            // Null for a full admin, set for a department admin
            departmentName: user?.department?.name || null,
        }),
        [user],
    );

    return { ...context, ...flags };
};