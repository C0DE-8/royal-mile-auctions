const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

export function resolveAdminAssetUrl(assetUrl) {
  if (!assetUrl || assetUrl.startsWith('http') || assetUrl.startsWith('data:')) {
    return assetUrl
  }

  return `${apiBaseUrl}${assetUrl}`
}

export async function adminLogin(email, password) {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to log in.')
  }

  if (payload.data.user.role !== 'admin') {
    throw new Error('Admin account required.')
  }

  return payload.data
}

export async function createAuctionItem(token, formData) {
  const response = await fetch(`${apiBaseUrl}/api/admin/auction-items`, {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: 'POST',
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to create auction item.')
  }

  return payload.data
}

export async function updateAuctionItem(token, id, formData) {
  const response = await fetch(`${apiBaseUrl}/api/admin/auction-items/${id}`, {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: 'PUT',
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update auction item.')
  }

  return payload.data
}

export async function deleteAuctionItem(token, id) {
  const response = await fetch(`${apiBaseUrl}/api/admin/auction-items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = await response.json()
    throw new Error(payload.error || 'Unable to delete auction item.')
  }
}

export async function createCryptoWallet(token, formData) {
  const response = await fetch(`${apiBaseUrl}/api/admin/crypto-wallets`, {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: 'POST',
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to create crypto wallet.')
  }

  return payload.data
}

export async function updateCryptoWallet(token, id, formData) {
  const response = await fetch(`${apiBaseUrl}/api/admin/crypto-wallets/${id}`, {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: 'PUT',
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update crypto wallet.')
  }

  return payload.data
}

export async function deleteCryptoWallet(token, id) {
  const response = await fetch(`${apiBaseUrl}/api/admin/crypto-wallets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = await response.json()
    throw new Error(payload.error || 'Unable to delete crypto wallet.')
  }
}

export async function fetchAdminAuctionItems(token) {
  const response = await fetch(`${apiBaseUrl}/api/admin/auction-items`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load auction items.')
  }

  return payload.data
}

export async function fetchAdminCryptoWallets(token) {
  const response = await fetch(`${apiBaseUrl}/api/admin/crypto-wallets`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load crypto wallets.')
  }

  return payload.data
}

export async function fetchAdminUsers(token) {
  const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load users.')
  }

  return payload.data
}
