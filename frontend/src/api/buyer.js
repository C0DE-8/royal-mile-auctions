import axiosInstance, { apiBaseUrl } from './axios'

export function resolveBuyerAssetUrl(assetUrl) {
  if (!assetUrl || assetUrl.startsWith('http') || assetUrl.startsWith('data:')) {
    return assetUrl
  }

  return `${apiBaseUrl}${assetUrl}`
}

function getBuyerError(error, fallback) {
  const message = error.response?.data?.error

  if (message === 'Admin access required.') {
    return 'Please sign in with your buyer account to continue.'
  }

  return message || fallback
}

export async function buyerLogin(email, password) {
  try {
    const response = await axiosInstance.post('/api/auth/login', { email, password })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to log in.'), { cause: error })
  }
}

export async function buyerRegister(form) {
  try {
    const response = await axiosInstance.post('/api/auth/register', form)
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to create buyer account.'), { cause: error })
  }
}

export async function fetchBuyerBids(token) {
  try {
    const response = await axiosInstance.get('/api/bids', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to load bids.'), { cause: error })
  }
}

export async function fetchAuctionItemBids(token, auctionItemId) {
  try {
    const response = await axiosInstance.get(`/api/bids/auction-item/${auctionItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to load vehicle bids.'), { cause: error })
  }
}

export async function createBid(token, auctionItemId, amount) {
  try {
    const response = await axiosInstance.post('/api/bids', { amount, auctionItemId }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to place bid.'), { cause: error })
  }
}

export async function fetchBuyerPayments(token) {
  try {
    const response = await axiosInstance.get('/api/payments', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to load payments.'), { cause: error })
  }
}

export async function fetchBuyerWonItems(token) {
  try {
    const response = await axiosInstance.get('/api/payments/won-items', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to load won items.'), { cause: error })
  }
}

export async function submitPaymentReceipt(token, paymentId, formData) {
  try {
    const response = await axiosInstance.post(`/api/payments/${paymentId}/receipt`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to submit payment receipt.'), { cause: error })
  }
}

export async function createPayment(token, form) {
  try {
    const response = await axiosInstance.post('/api/payments', form, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to submit payment.'), { cause: error })
  }
}

export async function fetchCryptoWallets() {
  try {
    const response = await axiosInstance.get('/api/crypto-wallets')
    return response.data.data
  } catch (error) {
    throw new Error(getBuyerError(error, 'Unable to load payment wallets.'), { cause: error })
  }
}
