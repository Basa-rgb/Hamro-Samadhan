import { createContext } from 'react';

// The complaint types, loaded once and shared by every screen that needs them.
//
// The context itself is null, the same pattern AuthContext uses, so useCategories
// can throw if it is called outside the provider instead of silently handing back
// an empty list that looks like "no categories exist".
export const CategoriesContext = createContext(null);