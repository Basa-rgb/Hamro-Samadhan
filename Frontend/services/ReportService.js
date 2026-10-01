import api from './api';

// A report's tracking token is only ever given to the browser that submitted
// it, so it is kept there rather than in the URL or in a mail link. Keyed by
// report id, because a citizen may file more than one.
//
// This is what makes the tracking page show the photo, description and location
// instead of the redacted view. Clearing site data loses it, and then the report
// is simply tracked in redacted form, so this is a convenience and not a lock.
const STORAGE_PREFIX = 'hs:reportToken:';

export const saveReportToken = (reportId, token) => {
    if (!reportId || !token) return;

    try {
        window.localStorage.setItem(STORAGE_PREFIX + reportId, token);
    } catch {
        // Private browsing or a full quota. Tracking still works, just redacted.
    }
};

export const getReportToken = (reportId) => {
    if (!reportId) return null;

    try {
        return window.localStorage.getItem(STORAGE_PREFIX + reportId);
    } catch {
        return null;
    }
};

export const createReport =async(formData)=>{
    const response = await api.post("/reports",formData);

    return response.data
};


// The token is optional. Without it the API still returns the report, but with
// the description, photo and location withheld, because report ids are
// sequential and guessable.
export const getReportById = async (reportId, token) => {
    const response = await api.get(`/reports/${reportId}`, {
        params: token ? { token } : undefined,
    });

    return response.data
}
