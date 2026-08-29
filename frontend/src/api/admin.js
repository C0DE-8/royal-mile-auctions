const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

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
