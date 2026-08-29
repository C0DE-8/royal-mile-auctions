import axiosInstance, { apiBaseUrl } from './axios'

export function resolveAdminAssetUrl(assetUrl) {
  if (!assetUrl || assetUrl.startsWith('http') || assetUrl.startsWith('data:')) {
    return assetUrl
  }

  return `${apiBaseUrl}${assetUrl}`
}

export async function adminLogin(email, password) {
  try {
    const response = await axiosInstance.post('/api/auth/login', { email, password })

    if (response.data.data.user.role !== 'admin') {
      throw new Error('Admin account required.')
    }

    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to log in.', { cause: error })
  }
}

export async function createAuctionItem(token, formData) {
  try {
    const response = await axiosInstance.post('/api/admin/auction-items', formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to create auction item.', { cause: error })
  }
}

export async function updateAuctionItem(token, id, formData) {
  try {
    const response = await axiosInstance.put(`/api/admin/auction-items/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to update auction item.', { cause: error })
  }
}

export async function deleteAuctionItem(token, id) {
  try {
    await axiosInstance.delete(`/api/admin/auction-items/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to delete auction item.', { cause: error })
  }
}

export async function fetchAdminBids(token, auctionItemId = '') {
  try {
    const response = await axiosInstance.get('/api/admin/bids', {
      headers: { Authorization: `Bearer ${token}` },
      params: auctionItemId ? { auctionItemId } : undefined,
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to load bids.', { cause: error })
  }
}

export async function createDemoBid(token, form) {
  try {
    const response = await axiosInstance.post('/api/admin/bids/demo', form, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to create demo bid.', { cause: error })
  }
}

export async function closeAuctionItem(token, id) {
  try {
    const response = await axiosInstance.post(`/api/admin/auction-items/${id}/close`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to close auction.', { cause: error })
  }
}

export async function createCryptoWallet(token, formData) {
  try {
    const response = await axiosInstance.post('/api/admin/crypto-wallets', formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to create crypto wallet.', { cause: error })
  }
}

export async function updateCryptoWallet(token, id, formData) {
  try {
    const response = await axiosInstance.put(`/api/admin/crypto-wallets/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to update crypto wallet.', { cause: error })
  }
}

export async function deleteCryptoWallet(token, id) {
  try {
    await axiosInstance.delete(`/api/admin/crypto-wallets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to delete crypto wallet.', { cause: error })
  }
}

export async function fetchAdminAuctionItems(token) {
  try {
    const response = await axiosInstance.get('/api/admin/auction-items', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to load auction items.', { cause: error })
  }
}

export async function fetchAdminCryptoWallets(token) {
  try {
    const response = await axiosInstance.get('/api/admin/crypto-wallets', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to load crypto wallets.', { cause: error })
  }
}

export async function fetchAdminUsers(token) {
  try {
    const response = await axiosInstance.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to load users.', { cause: error })
  }
}
