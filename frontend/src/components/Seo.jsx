import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const siteUrl = 'https://royalmileauctions.com'
const defaultImage = `${siteUrl}/royal-mile-auctions-logo.png`

const routeMeta = [
  {
    match: /^\/$/,
    title: 'Royal Mile Auctions | Where Bidding Meets Dreams',
    description:
      'Bid online for luxury, performance, classic, and daily-driver vehicles with verified listings, clear photos, document confirmation, and secure checkout.',
  },
  {
    match: /^\/auctions/,
    title: 'Auction Schedule | Royal Mile Auctions',
    description:
      'Review Royal Mile Auctions sale flow, online auction lanes, featured vehicle events, bidding windows, and buyer requirements.',
  },
  {
    match: /^\/inventory\/[^/]+/,
    title: 'Vehicle Details | Royal Mile Auctions',
    description:
      'Review vehicle photos, auction pricing, VIN details, mileage, title status, seller notes, bidding actions, and document information.',
  },
  {
    match: /^\/inventory/,
    title: 'Auction Inventory | Royal Mile Auctions',
    description:
      'Browse online auto auction inventory including luxury cars, SUVs, trucks, performance vehicles, classics, and daily-driver deals.',
  },
  {
    match: /^\/bid/,
    title: 'Place a Vehicle Bid | Royal Mile Auctions',
    description:
      'Place secure online bids, review the current high bid, follow minimum bid rules, and track auction activity for selected vehicles.',
  },
  {
    match: /^\/buyers/,
    title: 'Buyer Information | Royal Mile Auctions',
    description:
      'Learn how Royal Mile Auctions handles bidder approval, auction fees, vehicle documents, key release, payment, pickup, and delivery.',
  },
  {
    match: /^\/dashboard/,
    title: 'Buyer Dashboard | Royal Mile Auctions',
    description:
      'Track bids, winning vehicles, checkout steps, document status, payments, and key-release progress from your buyer dashboard.',
  },
  {
    match: /^\/sell/,
    title: 'Sell Your Vehicle | Royal Mile Auctions',
    description:
      'Submit a car, truck, SUV, exotic, classic, fleet unit, or dealer consignment for online auction review with Royal Mile Auctions.',
  },
  {
    match: /^\/contact/,
    title: 'Contact Royal Mile Auctions',
    description:
      'Contact Royal Mile Auctions for buyer support, seller intake, auction questions, payment instructions, pickup, and delivery help.',
  },
]

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    const [, attrName, attrValue] = selector.match(/\[(name|property)="([^"]+)"\]/) || []
    if (attrName && attrValue) {
      element.setAttribute(attrName, attrValue)
    }
    document.head.appendChild(element)
  }

  element.setAttribute(attribute, value)
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', url)
}

function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = routeMeta.find((item) => item.match.test(pathname)) || routeMeta[0]
    const canonicalUrl = `${siteUrl}${pathname === '/' ? '/' : pathname}`

    document.title = meta.title
    setCanonical(canonicalUrl)
    setMeta('meta[name="description"]', 'content', meta.description)
    setMeta('meta[property="og:title"]', 'content', meta.title)
    setMeta('meta[property="og:description"]', 'content', meta.description)
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[property="og:image"]', 'content', defaultImage)
    setMeta('meta[name="twitter:title"]', 'content', meta.title)
    setMeta('meta[name="twitter:description"]', 'content', meta.description)
    setMeta('meta[name="twitter:image"]', 'content', defaultImage)
  }, [pathname])

  return null
}

export default Seo
