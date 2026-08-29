import axiosInstance, { apiBaseUrl } from './axios'

function resolveImageUrl(imageUrl) {
  if (!imageUrl || imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
    return imageUrl
  }

  return `${apiBaseUrl}${imageUrl}`
}

function normalizeAuctionItem(item) {
  return {
    id: item.id,
    image: resolveImageUrl(item.imageUrl),
    year: String(item.year),
    make: item.make,
    model: item.model,
    category: item.category,
    miles: item.miles,
    lane: item.lane,
    lot: item.lot,
    mainPrice: item.mainPrice,
    discountPercent: item.discountPercent,
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
    throw new Error(error.response?.data?.error || 'Unable to load auction inventory.')
  }
}
