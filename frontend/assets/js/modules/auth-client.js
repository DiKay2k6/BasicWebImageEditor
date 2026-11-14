// ==========================================
// AUTH CLIENT - token đăng nhập & gọi API có xác thực
// ==========================================

import { API_BASE_URL } from './config.js';

const TOKEN_STORAGE_KEY = 'wie_auth_token';
const NETWORK_ERROR_MESSAGE = 'Không thể kết nối tới máy chủ Flask. Vui lòng kiểm tra Backend đã chạy chưa.';

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

export function getToken() {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setToken(token) {
    try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
        // Trình duyệt chặn localStorage: phiên chỉ tồn tại tới khi tải lại trang
    }
}

export function clearToken() {
    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        // Bỏ qua
    }
}

async function readErrorMessage(response) {
    try {
        const data = await response.json();
        if (data && data.error) return data.error;
    } catch {
        // Response không phải JSON
    }
    return `Yêu cầu thất bại (HTTP ${response.status}).`;
}

/** Gửi request tới Flask, tự gắn token; ném ApiError kèm thông báo lỗi tiếng Việt từ server. */
async function sendRequest(path, { method = 'GET', json, formData } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let body;
    if (json !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(json);
    } else if (formData) {
        body = formData;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body });
    } catch {
        throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }

    if (!response.ok) {
        // Chỉ xóa đúng token đã gửi đi: tránh phản hồi cũ xóa mất token mới vừa đăng nhập
        if (response.status === 401 && token && getToken() === token) clearToken();
        throw new ApiError(await readErrorMessage(response), response.status);
    }
    return response;
}

export async function apiRequest(path, options) {
    const response = await sendRequest(path, options);
    return response.status === 204 ? null : response.json();
}

export async function fetchBlob(path) {
    const response = await sendRequest(path);
    return response.blob();
}

/** Lấy người dùng hiện tại; trả về null nếu chưa đăng nhập hoặc phiên hết hạn. */
export async function getCurrentUser() {
    if (!getToken()) return null;
    try {
        const data = await apiRequest('/api/auth/me');
        return data.user;
    } catch (err) {
        if (err.status === 401) return null;
        throw err;
    }
}

export async function login(email, password) {
    const data = await apiRequest('/api/auth/login', { method: 'POST', json: { email, password } });
    setToken(data.token);
    return data.user;
}

export async function register(displayName, email, password) {
    const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        json: { display_name: displayName, email, password }
    });
    setToken(data.token);
    return data.user;
}

export async function logout() {
    try {
        if (getToken()) await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
        clearToken();
    }
}

export function getInitials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
    return letters.toUpperCase();
}
