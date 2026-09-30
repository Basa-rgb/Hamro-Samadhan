import React, { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Lock, Mail, LogIn, ShieldCheck } from "lucide-react";
import Stamp from "../../assets/stamp.png";
import { useAuth } from "../../Hooks/useAuth";
import { Spinner, ErrorBanner } from "../../component/admin/ui";

const AdminLogin = () => {
    const { login, status } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ showPassword, setShowPassword ] = useState(false);
    const [ errorMsg, setErrorMsg ] = useState("");
    const [ submitting, setSubmitting ] = useState(false);

    // Where the guard was heading before it bounced them here
    const from = location.state?.from?.pathname || "/admin";

    // An admin who is already signed in has no reason to see this page.
    // Redirected declaratively, navigating during render is not safe
    if (status === "authenticated") {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (submitting) return;

        setErrorMsg("");
        setSubmitting(true);

        try {
            await login(email.trim(), password);

            navigate(from, { replace: true });
        } catch (error) {
            // The backend returns the same message for a wrong password and an
            // unknown email, so there is nothing more specific to show
            setErrorMsg(
                error.response?.data?.message || "Unable to sign in. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7 sm:p-8">
                    <div className="text-center">
                        <img
                            src={Stamp}
                            alt=""
                            className="w-16 h-16 object-contain mx-auto"
                        />

                        <h1 className="text-2xl font-extrabold text-gray-900 mt-3">
                            Admin Portal
                        </h1>

                        <p className="text-sm text-gray-500 mt-1.5 flex items-center justify-center gap-1.5">
                            <ShieldCheck size={15} className="text-blue-700" />
                            Sign in to manage citizen reports
                        </p>
                    </div>

                    <div className="mt-6">
                        <ErrorBanner
                            message={errorMsg}
                            onDismiss={() => setErrorMsg("")}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-gray-600 mb-1.5"
                            >
                                Email address
                            </label>

                            <div className="relative">
                                <Mail
                                    size={18}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errorMsg) setErrorMsg("");
                                    }}
                                    placeholder="admin@hamrosamadhan.com"
                                    autoComplete="username"
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold text-gray-600 mb-1.5"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errorMsg) setErrorMsg("");
                                    }}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-600 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {submitting ? (
                                <>
                                    <Spinner size={18} />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign in
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 text-center mt-6">
                        Sessions expire after 15 minutes of inactivity.
                    </p>
                </div>

                <div className="text-center mt-5">
                    <Link
                        to="/"
                        className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                        Back to the public site
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;