import { useCallback, useEffect, useRef, useState } from "react";

// One toast at a time, enough to confirm a save and show why it failed.
// The timer is cleared on unmount, so a toast that fires while the admin is
// already navigating away never sets state on an unmounted component.
export const useToast = () => {
    const [ toast, setToast ] = useState(null);
    const timer = useRef(null);

    const clearToast = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }

        setToast(null);
    }, []);

    const showToast = useCallback((type, message) => {
        if (timer.current) clearTimeout(timer.current);

        setToast({ type, message });

        timer.current = setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return { toast, showToast, clearToast };
};