const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

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
  const response = await fetch(`${apiBaseUrl}/api/auction-items`)

  if (!response.ok) {
    throw new Error('Unable to load auction inventory.')
  }

  const payload = await response.json()
  return payload.data.map(normalizeAuctionItem)
}
