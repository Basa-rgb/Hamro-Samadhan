import api from './api';

// Every admin call goes through here, matching the existing service style of
// unwrapping the response and handing back the body

// ---------- Auth ----------

export const login = async(email,password)=>{
    const response = await api.post("/auth/login",{ email, password });

    return response.data
}

// Confirms the session cookie is still valid, and who it belongs to
export const getMe = async()=>{
    const response = await api.get("/auth/me");

    return response.data
}

export const logout = async()=>{
    const response = await api.post("/auth/logout");

    return response.data
}

// ---------- Dashboard ----------

export const getAdminStats = async()=>{
    const response = await api.get("/admin/stats");

    return response.data
}

// ---------- Reports ----------

// page, limit, status, priority and search are all optional
// axios drops the undefined ones, so only the active filters are sent
export const getReports = async({ page = 1, limit = 20, status, priority, search } = {})=>{
    const response = await api.get("/reports",{ params: { page, limit, status, priority, search } });

    return response.data
}

// The admin view returns the whole document, unlike the trimmed public one
export const getReportById = async(id)=>{
    const response = await api.get(`/admin/reports/${id}`);

    return response.data
}

export const getReportUpdates = async(id)=>{
    const response = await api.get(`/admin/reports/${id}/updates`);

    return response.data
}

export const updateReportStatus = async(id,status,message)=>{
    const response = await api.patch(`/admin/${id}/status`,{ status, message });

    return response.data
}

export const updateReportPriority = async(id,priority)=>{
    const response = await api.patch(`/admin/${id}/priority`,{ priority });

    return response.data
}

export const assignDepartment = async(id,departmentId)=>{
    const response = await api.patch(`/admin/${id}/department`,{ departmentId });

    return response.data
}

// ---------- Departments ----------

export const getDepartments = async()=>{
    const response = await api.get("/admin");

    return response.data
}

export const createDepartment = async(name,description)=>{
    const response = await api.post("/admin",{ name, description });

    return response.data
}

// Only the fields that changed are sent, the controller leaves the rest alone
export const updateDepartment = async(id,payload)=>{
    const response = await api.patch(`/admin/${id}`,payload);

    return response.data
}