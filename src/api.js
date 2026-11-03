// in dev the api base is "/" relative, riding the vite proxy (vite.config.mjs); for a production build, set the absolute backend url here
const API = import.meta.env.DEV ? '/api' : 'http://localhost:2000/api'
const TOKEN_KEY = 'ecomsite_token'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token)
    } else {
        localStorage.removeItem(TOKEN_KEY)
    }
}

export function getSavedUser() {
    const raw = localStorage.getItem('ecomsite_user')
    return raw ? JSON.parse(raw) : null
}

export function saveUser(user) {
    if (user) {
        localStorage.setItem('ecomsite_user', JSON.stringify(user))
    } else {
        localStorage.removeItem('ecomsite_user')
    }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = {}
    if (body) headers['Content-Type'] = 'application/json'
    const token = getToken()
    if (auth && token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(data.message || data.error || 'Request failed')
    }
    return data
}

export const api = {
    signup: (payload) => request('/users/signup', { method: 'POST', body: payload }),
    login: (payload) => request('/users/login', { method: 'POST', body: payload }),
    forgotPassword: (payload) => request('/users/forgotPassword', { method: 'POST', body: payload }),
    resetPassword: (payload) => request('/users/resetPassword', { method: 'POST', body: payload }),
    updateProfile: (payload) => request('/users/updateprofile', { method: 'PATCH', body: payload, auth: true }),
    deleteProfile: () => request('/users/deleteprofile', { method: 'DELETE', auth: true }),

    getProducts: (params) => {
        const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v)).toString()
        return request(`/products${query ? `?${query}` : ''}`)
    },
    getCategories: () => request('/products/categories'),
    createProduct: (payload) => request('/products', { method: 'POST', body: payload, auth: true }),
    updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PATCH', body: payload, auth: true }),
    deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),

    getCart: () => request('/cart', { auth: true }),
    addToCart: (productId, quantity) => request('/cart/items', { method: 'POST', body: { productId, quantity }, auth: true }),
    updateCartItem: (productId, quantity) => request('/cart/items', { method: 'PATCH', body: { productId, quantity }, auth: true }),
    removeCartItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE', auth: true }),
    clearCart: () => request('/cart', { method: 'DELETE', auth: true }),

    placeOrder: (shippingAddress) => request('/orders', { method: 'POST', body: { shippingAddress }, auth: true }),
    getMyOrders: () => request('/orders/me', { auth: true }),
    getAllOrders: () => request('/orders', { auth: true }),
    updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true })
}
