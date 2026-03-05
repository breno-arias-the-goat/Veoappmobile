import api from '../lib/api';

export const loginUser = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const signupUser = async (userData: any) => {
    const nameParts = (userData.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Doe';

    const payload = {
        email: userData.email,
        password: userData.password,
        firstName,
        lastName
    };

    const response = await api.post('/auth/signup', payload);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data?.data ?? null;
};

export const updateProfile = async (data: { firstName?: string; lastName?: string; profilePictureUrl?: string | null }) => {
    const response = await api.patch('/auth/me', data);
    return response.data?.data ?? null;
};
