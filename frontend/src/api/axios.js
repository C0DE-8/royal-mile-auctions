import axios from 'axios'

const localApiBaseUrl = 'http://127.0.0.1:4000'
const productionApiBaseUrl = 'https://api.royalmileauctions.com'
const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApiBaseUrl : localApiBaseUrl)

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authorization token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthRequest = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register')

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('buyerAuth')
      window.location.href = '/dashboard'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
export { apiBaseUrl }
