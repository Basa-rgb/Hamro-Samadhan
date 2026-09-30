import api from './api';

export const getFaqs = async()=>{
    const response = await api.get("/faqs");

    return response.data
}
