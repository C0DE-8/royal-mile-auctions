function toAuctionItem(row) {
  const auctionPrice = Math.round(row.main_price * (1 - row.discount_percent / 100))
  const galleryImages = row.gallery_images
    ? row.gallery_images.split(',').filter(Boolean)
    : []
  const images = [row.image_url, ...galleryImages].filter(Boolean)

  return {
    id: row.id,
    title: row.title,
    year: row.year,
    make: row.make,
    model: row.model,
    category: row.category,
    miles: row.miles,
    lane: row.lane,
    lot: row.lot,
    mainPrice: row.main_price,
    discountPercent: row.discount_percent,
    auctionPrice,
    vin: row.vin,
    titleStatus: row.title_status,
    status: row.item_status,
    seller: row.seller,
    light: row.light,
    transmission: row.transmission,
    drivetrain: row.drivetrain,
    notes: row.notes,
    imageUrl: row.image_url,
    images,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toWallet(row) {
  return {
    id: row.id,
    walletName: row.wallet_name,
    network: row.network,
    currencySymbol: row.currency_symbol,
    walletAddress: row.wallet_address,
    qrCodeUrl: row.qr_code_url,
    instructions: row.instructions,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toEmailLog(row) {
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    adminName: row.admin_name,
    recipientEmail: row.recipient_email,
    recipientUserId: row.recipient_user_id,
    recipientName: row.recipient_name,
    subject: row.subject,
    body: row.body,
    status: row.status,
    errorMessage: row.error_message,
    providerMessageId: row.provider_message_id,
    createdAt: row.created_at,
  }
}

module.exports = {
  toAuctionItem,
  toEmailLog,
  toUser,
  toWallet,
}
