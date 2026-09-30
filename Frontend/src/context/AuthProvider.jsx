import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { setUnauthorizedHandler } from "../../services/api";
import {
    getMe,
    login as loginRequest,
    logout as logoutRequest,
} from "../../services/AdminService";

// The single source of truth for the admin session.
//
// The token itself lives in an httpOnly cookie, so there is nothing to store
// here. The provider only remembers who is signed in, and re-checks that with
// the server on every page load so a stale page never looks signed in.
const AuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    const [ status, setStatus ] = useState("loading");

    // Logout fires a request that 401s when the session is already gone, and
    // that 401 would call back into here. The flag stops the loop
    const endingSession = useRef(false);

    const clearSession = useCallback(() => {
        setUser(null);
        setStatus("anonymous");
    }, []);

    const logout = useCallback(async () => {
        if (endingSession.current) return;

        endingSession.current = true;

        try {
            await logoutRequest();
        } catch {
            // Nothing to revoke if the session had already expired
        } finally {
            clearSession();
            endingSession.current = false;
        }
    }, [clearSession]);

    // A 401 from any admin request means the 15 minute session ran out, so the
    // user is sent back to the login page without touching the screen they are on
    useEffect(() => {
        setUnauthorizedHandler(clearSession);

        return () => setUnauthorizedHandler(null);
    }, [clearSession]);

    // On mount, ask the server whether the cookie is still good
    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            try {
                const response = await getMe();

                if (!active) return;

                setUser(response.user);
                setStatus("authenticated");
            } catch {
                // No cookie, an expired cookie, or the account was disabled
                if (!active) return;

                clearSession();
            }
        };

        restoreSession();

        return () => {
            // Stops a slow response from setting state after unmount
            active = false;
        };
    }, [clearSession]);

    const login = useCallback(async (email, password) => {
        const response = await loginRequest(email, password);

        setUser(response.user);
        setStatus("authenticated");

        return response.user;
    }, []);

    const value = useMemo(
        () => ({ user, status, login, logout }),
        [user, status, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;