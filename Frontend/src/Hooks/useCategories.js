import { useContext } from 'react';
import { CategoriesContext } from '../context/CategoriesContext';

// Reads the complaint types loaded by CategoriesProvider.
//
// Throws outside the provider rather than returning null, because the alternative
// is every screen having to guard for a context that will never be there and a
// missing provider showing up as an empty dropdown instead of an error
const useCategories = () => {
    const context = useContext(CategoriesContext);

    if (!context) {
        throw new Error(
            'useCategories must be used inside a CategoriesProvider',
        );
    }

    return context;
};

export default useCategories;