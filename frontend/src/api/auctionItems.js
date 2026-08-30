import axiosInstance, { apiBaseUrl } from './axios'

function resolveImageUrl(imageUrl) {
  if (!imageUrl || imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
    return imageUrl
  }

  return `${apiBaseUrl}${imageUrl}`
}

function normalizeAuctionItem(item) {
  const images = Array.isArray(item.images)
    ? item.images.map(resolveImageUrl).filter(Boolean)
    : []
  const image = resolveImageUrl(item.imageUrl)

  return {
    id: item.id,
    image,
    images: images.length > 0 ? images : [image].filter(Boolean),
    year: String(item.year),
    make: item.make,
    model: item.model,
    category: item.category,
    miles: item.miles,
    lane: item.lane,
    lot: item.lot,
    mainPrice: item.mainPrice,
    discountPercent: item.discountPercent,
    auctionPrice: item.auctionPrice,
    vin: item.vin,
    title: item.titleStatus,
    status: item.status,
    seller: item.seller,
    light: item.light,
    transmission: item.transmission,
    drivetrain: item.drivetrain,
    notes: item.notes,
  }
}

export async function fetchAuctionItems() {
  try {
    const response = await axiosInstance.get('/api/auction-items')
    return response.data.data.map(normalizeAuctionItem)
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to load auction inventory.', {
      cause: error,
    })
  }
}

export async function fetchAuctionItem(id) {
  try {
    const response = await axiosInstance.get(`/api/auction-items/${id}`)
    return normalizeAuctionItem(response.data.data)
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to load vehicle details.', {
      cause: error,
    })
  }
}
