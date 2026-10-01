import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { CategoriesContext } from './CategoriesContext';
import { getCategories } from '../../services/CategoryService';

// The complaint types, loaded once for the whole app.
//
// This replaced a hardcoded array in src/constants/categories.js. That list had
// to be edited by hand on both sides of the wire, so adding a type meant a code
// change, and the two copies drifted apart. Here the database is the only copy.
//
// Two things this deliberately does not do:
//
// It does not cache across a reload. The list is small, one request on load is
// cheaper than the bug that comes from a stale cache, and an admin who adds a
// category sees it on the next page load.
//
// It does not block the app on failure. If the request fails the provider keeps
// the error and hands back an empty list, and the report form shows the reason
// with a retry button instead of silently rendering an empty dropdown. An empty
// dropdown that looks normal is what the old hardcoded list was there to avoid.
const CategoriesProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getCategories();

            setCategories(response.categories || []);
        } catch (requestError) {
            setCategories([]);

            setError(
                requestError.response?.data?.message ||
                    'Could not load the complaint types.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // value is the key a report stores and a department's list is matched on,
    // label and labelNe are what a person reads. lookup makes "which label belongs
    // to this stored value" a single map read instead of a find on every row
    const lookup = useMemo(
        () =>
            categories.reduce((map, category) => {
                map[category.value] = category;

                return map;
            }, {}),
        [categories],
    );

    const value = useMemo(
        () => ({
            categories,
            lookup,
            loading,
            error,
            reload: load,
        }),
        [categories, lookup, loading, error, load],
    );

    return (
        <CategoriesContext.Provider value={value}>
            {children}
        </CategoriesContext.Provider>
    );
};

export default CategoriesProvider;