// Converts SQLite rows (snake_case) into the camelCase JSON shapes that
// match src/types.ts (Product, Category, Order, LogisticsProvider) and
// src/components/AdminTypes.ts (AdminUser, AdminVendor) on the frontend.

export function toProduct(row: any) {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    originalPrice: row.original_price,
    image: row.image,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    category: row.category,
    description: row.description,
    vendorName: row.vendor_name,
    vendorId: row.vendor_id,
    isFeatured: !!row.is_featured,
    stock: row.stock,
    digitalSpecification: row.digital_spec ? JSON.parse(row.digital_spec) : undefined,
  };
}

export function toCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    iconName: row.icon_name,
    color: row.color,
  };
}

export function toOrder(row: any, items: any[]) {
  return {
    id: row.id,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    city: row.city,
    state: row.state,
    address: row.address,
    items: items.map((i) => ({
      productId: i.product_id,
      productTitle: i.product_title,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    })),
    totalAmount: row.total_amount,
    status: row.status,
    date: row.date,
    shippingMethod: row.shipping_method,
    shippingCost: row.shipping_cost,
    logisticsProviderId: row.logistics_provider_id,
    logisticsProviderName: row.logistics_provider_name,
    trackingNumber: row.tracking_number,
    carrierStatus: row.carrier_status,
    deliveriTrackingNumber: row.deliveri_tracking_number,
    deliveriStatus: row.deliveri_status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
  };
}

export function toLogisticsProvider(row: any) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    status: row.status,
    apiEndpoint: row.api_endpoint,
    apiKey: row.api_key,
    webhookUrl: row.webhook_url,
    webhookSecret: row.webhook_secret,
    baseFee: row.base_fee,
    perKmRate: row.per_km_rate,
    estimatedDays: row.estimated_days,
    badge: row.badge,
    description: row.description,
    rating: row.rating,
    supportedServices: row.supported_services ? JSON.parse(row.supported_services) : [],
    trackingUrlTemplate: row.tracking_url_template,
  };
}

export function toAdminUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    phone: row.phone,
    dateJoined: row.created_at,
    totalOrders: row.total_orders,
    totalSpent: row.total_spent,
  };
}

export function toAdminVendor(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    totalProducts: row.total_products ?? 0,
    totalSales: row.total_sales ?? 0,
    rating: row.rating,
    joiningDate: row.joining_date,
    storeCategory: row.store_category,
  };
}

export function toDeliveryZone(row: any) {
  return {
    id: row.id,
    zoneName: row.zone_name,
    fee: row.fee,
    isFree: !!row.is_free,
    isActive: !!row.is_active,
  };
}

export function toSupportChat(row: any, messages: any[]) {
  return {
    id: row.id,
    userName: row.user_name,
    userRole: row.user_role,
    userEmail: row.user_email,
    status: row.status,
    lastMessageAt: row.last_message_at,
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      senderName: m.sender_name,
      content: m.content,
      timestamp: m.timestamp,
    })),
  };
}

export function toSettings(row: any) {
  return {
    appName: row.app_name,
    commissionPercent: row.commission_percent,
    paymentGateway: row.payment_gateway,
    testMode: !!row.test_mode,
    payoutFrequency: row.payout_frequency,
    flatDeliveryFee: row.flat_delivery_fee,
    restrictedCategories: JSON.parse(row.restricted_categories || '[]'),
  };
}

export function toReport(row: any) {
  return {
    id: row.id,
    reporterName: row.reporter_name,
    subject: row.subject,
    type: row.type,
    status: row.status,
    description: row.description,
    date: row.date,
  };
}

export function toAdminAccount(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    level: row.level,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

export function toKycDocument(row: any) {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    docType: row.doc_type,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    status: row.status,
    rejectionReason: row.rejection_reason,
    uploadedAt: row.uploaded_at,
    reviewedAt: row.reviewed_at,
  };
}

