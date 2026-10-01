import { useTranslation } from 'react-i18next';
import useCategories from './useCategories';

// Turns a stored category value into something a person can read.
//
// The order matters and is deliberate:
//
// 1. An i18n key, if one exists. The starter types keep the hand written
//    translations in src/locales, so switching to Nepali is instant and does not
//    need a database round trip.
// 2. The label from the database. A type an admin added in the portal has no
//    translation key, so its labelNe is used on the Nepali site and its label
//    everywhere else.
// 3. The raw value. A retired or deleted category on an old report still has to
//    render as something, and showing road_damage beats showing nothing.
const useCategoryLabel = () => {
    const { t, i18n } = useTranslation();
    const { lookup } = useCategories();

    const isNepali = (i18n.language || '').startsWith('ne');

    return (value) => {
        if (!value) return '';

        const translated = t(`report.categories.${value}`, {
            defaultValue: '',
        });

        if (translated) return translated;

        const category = lookup[value];

        if (!category) return value;

        if (isNepali && category.labelNe) return category.labelNe;

        return category.label;
    };
};

export default useCategoryLabel;