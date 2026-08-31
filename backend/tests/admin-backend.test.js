const assert = require('node:assert/strict')
const http = require('node:http')
const Module = require('node:module')
const test = require('node:test')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'backend-test-secret'

const adminUser = {
  id: 1,
  name: 'Admin User',
  email: 'info@royalmileauctions.com',
  role: 'admin',
  phone: null,
  is_active: 1,
}
const buyerUser = {
  id: 2,
  name: 'Buyer User',
  email: 'buyer@example.com',
  role: 'user',
  phone: null,
  is_active: 1,
}
const selectedBuyer = {
  id: 3,
  name: 'Selected Buyer',
  email: 'selected@example.com',
}
const allActiveBuyers = [
  { id: 4, name: 'Active One', email: 'active-one@example.com' },
  { id: 5, name: 'Active Two', email: 'active-two@example.com' },
]
const auctionItem = {
  id: 20,
  title: '2024 Test Vehicle',
  auction_fee: 500,
  main_price: 36500,
  discount_percent: 60,
  is_active: 1,
  item_status: 'Green light',
}
const itemBids = [
  {
    id: 100,
    user_id: 6,
    amount: 14800,
    status: 'pending',
    created_at: new Date('2026-08-01T10:00:00Z'),
    bidder_name: 'Other Buyer',
  },
  {
    id: 101,
    user_id: buyerUser.id,
    amount: 14700,
    status: 'pending',
    created_at: new Date('2026-08-01T10:05:00Z'),
    bidder_name: buyerUser.name,
  },
]

const state = {
  bidUpdates: [],
  createdBids: [],
  emailLogs: [],
  mailSends: [],
  paymentUpdates: [],
  wonItemId: 400,
  wonItems: [],
}

function resetState() {
  state.bidUpdates = []
  state.createdBids = []
  state.emailLogs = []
  state.mailSends = []
  state.paymentUpdates = []
  state.wonItemId = 400
  state.wonItems = []
}

const mockDb = {
  closePool: async () => {},
  dbConfig: { database: 'test' },
  query: async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim()

    if (normalized.includes('FROM users WHERE id = ? AND is_active = 1')) {
      if (params[0] === adminUser.id) return [adminUser]
      if (params[0] === buyerUser.id) return [buyerUser]
      return []
    }

    if (normalized.includes("FROM users WHERE is_active = 1 AND role = 'user'")) {
      return allActiveBuyers
    }

    if (normalized.includes('FROM users WHERE is_active = 1 AND id IN')) {
      return params.includes(selectedBuyer.id) ? [selectedBuyer] : []
    }

    if (normalized.includes('SELECT id FROM payments WHERE id = ?')) {
      return params[0] === 10 ? [{ id: 10 }] : []
    }

    if (normalized.includes('SELECT id, main_price, discount_percent FROM auction_items WHERE id = ?')) {
      return params[0] === auctionItem.id ? [auctionItem] : []
    }

    if (normalized.includes('SELECT id, main_price, discount_percent, is_active, item_status FROM auction_items WHERE id = ?')) {
      return params[0] === auctionItem.id ? [auctionItem] : []
    }

    if (normalized.includes('FROM auction_items ai') && normalized.includes('WHERE ai.id = ?')) {
      return params[0] === auctionItem.id ? [auctionItem] : []
    }

    if (normalized.includes('SELECT COALESCE(MAX(amount), 0) AS currentHighBid FROM bids WHERE auction_item_id = ?')) {
      return params[0] === auctionItem.id ? [{ currentHighBid: 14800 }] : [{ currentHighBid: 0 }]
    }

    if (normalized.includes("SELECT id, name, email FROM users WHERE id = ? AND role = 'user' AND is_active = 1")) {
      return params[0] === buyerUser.id ? [buyerUser] : []
    }

    if (normalized.includes("SELECT id, name, email FROM users WHERE email = ? AND role = 'user' LIMIT 1")) {
      return params[0] === buyerUser.email ? [buyerUser] : []
    }

    if (params.length === 2 && normalized.includes('FROM bids b JOIN users u ON u.id = b.user_id WHERE b.auction_item_id = ?')) {
      const currentUserId = params[0]
      const auctionItemId = params[1]

      if (auctionItemId !== auctionItem.id) {
        return []
      }

      return itemBids.map((bid) => ({
        ...bid,
        bidder_id: bid.user_id,
        is_current_user: bid.user_id === currentUserId ? 1 : 0,
      }))
    }

    if (normalized.includes('FROM bids b JOIN users u ON u.id = b.user_id JOIN auction_items a ON a.id = b.auction_item_id WHERE b.id = ?')) {
      const bid = state.createdBids.find((item) => item.id === params[0])
      return bid ? [bid] : []
    }

    if (normalized.includes('FROM bids b JOIN users u ON u.id = b.user_id WHERE b.auction_item_id = ? ORDER BY b.amount DESC')) {
      return itemBids
        .map((bid) => ({
          ...bid,
          bidder_email: bid.user_id === buyerUser.id ? buyerUser.email : 'other@example.com',
        }))
        .sort((first, second) => Number(second.amount) - Number(first.amount))
    }

    if (normalized.includes('SELECT id, fee_payment_id FROM won_items WHERE auction_item_id = ?')) {
      const wonItem = state.wonItems.find((item) => item.auction_item_id === params[0])
      return wonItem ? [{ id: wonItem.id, fee_payment_id: wonItem.fee_payment_id }] : []
    }

    if (normalized.includes("SELECT id FROM payments WHERE won_item_id = ? AND payment_type = 'auction_fee'")) {
      return []
    }

    if (normalized.includes('FROM won_items wi') && normalized.includes('WHERE wi.id = ?')) {
      const wonItem = state.wonItems.find((item) => item.id === params[0])
      return wonItem ? [{
        ...wonItem,
        buyer_name: 'Other Buyer',
        buyer_email: 'other@example.com',
        title: auctionItem.title,
        year: 2024,
        make: 'Test',
        model: 'Vehicle',
        image_url: null,
        lane: 'A',
        lot: 'L10',
        receipt_url: null,
        payment_status: 'pending',
      }] : []
    }

    if (normalized.includes('FROM payments p') && normalized.includes('WHERE p.id = ?')) {
      return [{
        id: 10,
        user_id: buyerUser.id,
        auction_item_id: 20,
        crypto_wallet_id: 30,
        amount: 12500,
        currency_symbol: 'BTC',
        transaction_hash: '0xabc',
        status: state.paymentUpdates.at(-1)?.status || 'submitted',
        notes: null,
        buyer_name: buyerUser.name,
        buyer_email: buyerUser.email,
        item_title: '2024 Test Vehicle',
        lot: 'L10',
        lane: 'A',
        wallet_name: 'BTC Wallet',
        network: 'Bitcoin',
        wallet_address: 'wallet-address',
      }]
    }

    if (normalized.includes('FROM email_logs el')) {
      return state.emailLogs.map((log, index) => ({
        id: index + 1,
        admin_user_id: adminUser.id,
        admin_name: adminUser.name,
        recipient_email: log.recipientEmail,
        recipient_user_id: log.recipientUserId,
        recipient_name: null,
        subject: log.subject,
        body: log.body,
        status: log.status,
        error_message: log.errorMessage,
        provider_message_id: log.providerMessageId,
        created_at: new Date(),
      }))
    }

    return []
  },
  run: async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim()

    if (normalized.startsWith('INSERT INTO email_logs')) {
      state.emailLogs.push({
        adminUserId: params[0],
        recipientEmail: params[1],
        recipientUserId: params[2],
        subject: params[3],
        body: params[4],
        status: params[5],
        errorMessage: params[6],
        providerMessageId: params[7],
      })
      return { insertId: state.emailLogs.length }
    }

    if (normalized.startsWith('UPDATE payments SET')) {
      state.paymentUpdates.push({
        status: params[0],
        notes: params[1],
        id: params[2],
      })
      return { affectedRows: 1 }
    }

    if (normalized.startsWith('INSERT INTO bids')) {
      const insertId = 500 + state.createdBids.length
      state.createdBids.push({
        id: insertId,
        user_id: params[0],
        auction_item_id: params[1],
        amount: params[2],
        status: params[3],
        bidder_name: params[0] === buyerUser.id ? buyerUser.name : 'Other Buyer',
        bidder_email: params[0] === buyerUser.id ? buyerUser.email : 'other@example.com',
        item_title: auctionItem.title,
        lot: 'L10',
        lane: 'A',
      })
      return { insertId, affectedRows: 1 }
    }

    if (normalized.startsWith('UPDATE bids SET')) {
      state.bidUpdates.push({ params, sql: normalized })
      return { affectedRows: 1 }
    }

    if (normalized.startsWith('UPDATE auction_items SET')) {
      return { affectedRows: 1 }
    }

    if (normalized.startsWith('INSERT INTO won_items')) {
      state.wonItems.push({
        id: state.wonItemId,
        user_id: params[0],
        auction_item_id: params[1],
        winning_bid_id: params[2],
        winning_amount: params[3],
        fee_amount: params[4],
        fee_status: params[5],
        item_status: params[6],
        fee_payment_id: null,
      })
      return { insertId: state.wonItemId, affectedRows: 1 }
    }

    if (normalized.startsWith('INSERT INTO payments')) {
      return { insertId: 700, affectedRows: 1 }
    }

    if (normalized.startsWith('UPDATE won_items SET fee_payment_id = ?')) {
      const wonItem = state.wonItems.find((item) => item.id === params[1])
      if (wonItem) wonItem.fee_payment_id = params[0]
      return { affectedRows: wonItem ? 1 : 0 }
    }

    return { insertId: 1, affectedRows: 1 }
  },
  runMigrations: async () => {},
  seedDatabase: async () => {},
}

const mockMailer = {
  sendMail: async (message) => {
    state.mailSends.push(message)
    return { messageId: `test-message-${state.mailSends.length}` }
  },
}

const originalLoad = Module._load
Module._load = function loadWithMocks(request, parent, isMain) {
  if (request === '../db' || request.endsWith('/src/db')) {
    return mockDb
  }

  if (request === '../services/mailer' || request.endsWith('/src/services/mailer')) {
    return mockMailer
  }

  return originalLoad.call(this, request, parent, isMain)
}

const app = require('../server')

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

async function withServer(fn) {
  const server = http.createServer(app)

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  try {
    await fn(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

async function request(baseUrl, path, { body, token, method = 'POST' } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    method,
  })
  const payload = await response.json().catch(() => ({}))
  return { payload, response }
}

test('manual recipient send logs and sends email', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: 'Manual message',
        emails: ['manual@example.com'],
        recipientMode: 'manual',
        subject: 'Manual subject',
      },
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 200)
    assert.equal(payload.data.sentCount, 1)
    assert.equal(state.mailSends[0].to, 'manual@example.com')
    assert.equal(state.emailLogs[0].status, 'sent')
  })
})

test('selected user send resolves active user emails', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: 'Selected message',
        recipientMode: 'selected',
        subject: 'Selected subject',
        userIds: [selectedBuyer.id],
      },
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 200)
    assert.equal(payload.data.sentCount, 1)
    assert.equal(state.mailSends[0].to, selectedBuyer.email)
    assert.equal(state.emailLogs[0].recipientUserId, selectedBuyer.id)
  })
})

test('invalid manual email is rejected', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: 'Bad email',
        emails: ['not-an-email'],
        recipientMode: 'manual',
        subject: 'Bad recipient',
      },
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 400)
    assert.match(payload.error, /Invalid recipient email/)
    assert.equal(state.mailSends.length, 0)
  })
})

test('empty subject and body are rejected', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: '',
        emails: ['manual@example.com'],
        recipientMode: 'manual',
        subject: '',
      },
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 400)
    assert.match(payload.error, /Missing required fields/)
  })
})

test('email send rejects unauthenticated requests', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: 'Message',
        emails: ['manual@example.com'],
        recipientMode: 'manual',
        subject: 'Subject',
      },
    })

    assert.equal(response.status, 401)
    assert.equal(payload.error, 'Authentication required.')
  })
})

test('email send rejects non-admin users', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: 'Message',
        emails: ['manual@example.com'],
        recipientMode: 'manual',
        subject: 'Subject',
      },
      token: tokenFor(buyerUser),
    })

    assert.equal(response.status, 403)
    assert.equal(payload.error, 'Admin access required.')
  })
})

test('all active buyer send resolves all active buyer accounts', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/emails/send', {
      body: {
        body: 'All active message',
        recipientMode: 'all-active',
        subject: 'All active subject',
      },
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 200)
    assert.equal(payload.data.sentCount, allActiveBuyers.length)
    assert.deepEqual(state.mailSends.map((send) => send.to), allActiveBuyers.map((user) => user.email))
  })
})

test('payment status update works for admins', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/payments/10', {
      body: { status: 'confirmed' },
      method: 'PATCH',
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 200)
    assert.equal(payload.data.status, 'confirmed')
    assert.deepEqual(state.paymentUpdates[0], { id: 10, notes: null, status: 'confirmed' })
  })
})

test('buyer bid summary returns existing activity and next minimum', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, `/api/bids/auction-item/${auctionItem.id}/summary`, {
      method: 'GET',
      token: tokenFor(buyerUser),
    })

    assert.equal(response.status, 200)
    assert.equal(payload.data.currentHighBid, 14800)
    assert.equal(payload.data.minimumNextBid, 14900)
    assert.equal(payload.data.bids.length, 2)
    assert.equal(payload.data.bids[0].bidder_id, 6)
    assert.equal(payload.data.bids[0].bidder_name, 'Other Buyer')
    assert.equal(payload.data.bids[1].is_current_user, true)
  })
})

test('admin demo bid can reuse an existing bidder account', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, '/api/admin/bids/demo', {
      body: {
        amount: 14900,
        auctionItemId: auctionItem.id,
        bidderUserId: buyerUser.id,
      },
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 201)
    assert.equal(state.createdBids[0].user_id, buyerUser.id)
    assert.equal(payload.data.bidder_email, buyerUser.email)
  })
})

test('admin close auction creates won item for highest bidder', async () => {
  resetState()

  await withServer(async (baseUrl) => {
    const { payload, response } = await request(baseUrl, `/api/admin/auction-items/${auctionItem.id}/close`, {
      token: tokenFor(adminUser),
    })

    assert.equal(response.status, 200)
    assert.equal(payload.data.winningBid.id, 100)
    assert.equal(payload.data.wonItem.winningBidId, 100)
    assert.equal(payload.data.wonItem.winningAmount, 14800)
    assert.equal(payload.data.wonItem.itemStatus, 'on_hold')
    assert.equal(state.wonItems[0].user_id, 6)
  })
})
