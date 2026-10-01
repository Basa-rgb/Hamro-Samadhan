import api from './api';

// The complaint types a citizen can pick.
//
// These live in the database now, not in a constant, so an admin can add or retire
// one from the portal and the public form follows immediately. The single request
// is cached by CategoriesProvider for the life of the page and refetched when an
// admin changes something.
export const getCategories = async () => {
    const response = await api.get('/categories');

    return response.data;
};