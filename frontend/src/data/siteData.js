import camryImage from '../assets/vehicle-camry.png'
import mercedesG63Image from '../assets/vehicle-mercedes-g63.png'

export const navItems = [
  { label: 'Home', route: 'home', path: '/' },
  { label: 'Auctions', route: 'auctions', path: '/auctions' },
  { label: 'Inventory', route: 'inventory', path: '/inventory' },
  { label: 'Buyer Info', route: 'buyers', path: '/buyers' },
  { label: 'Dashboard', route: 'dashboard', path: '/dashboard' },
  { label: 'Sell', route: 'sell', path: '/sell' },
  { label: 'Contact', route: 'contact', path: '/contact' },
]

export const auctionStats = [
  { value: '175+', label: 'weekly vehicles' },
  { value: '50', label: 'states welcome' },
  { value: '24/7', label: 'online bidding' },
  { value: '2-step', label: 'secure checkout' },
  { value: 'Verified', label: 'docs & keys' },
]

export const featuredVehicles = [
  {
    id: 'lot-1021',
    image: camryImage,
    year: '2021',
    make: 'Toyota',
    model: 'Camry SE',
    category: 'Cars',
    miles: '48k mi',
    lane: 'A12',
    lot: '1021',
    mainPrice: 28900,
    vin: '4T1G11AK***2184',
    title: 'Clean title',
    status: 'Runs & drives',
    seller: 'New car trade',
    light: 'Green light',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    notes: 'Clean interior, cold air, alloy wheels, sale-ready sedan.',
  },
  {
    id: 'lot-2202',
    image: mercedesG63Image,
    year: '2021',
    make: 'Mercedes-Benz',
    model: 'G 63 AMG',
    category: 'SUVs',
    miles: '24k mi',
    lane: 'L02',
    lot: '2202',
    mainPrice: 214000,
    vin: 'W1NYC7HJ***2202',
    title: 'Clean title',
    status: 'Green light',
    seller: 'Dealer consignment',
    light: 'Green light',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    notes: 'White G-Class, AMG trim, black wheels, premium leather cabin, verified keys and documents.',
  },
]

export const auctionSteps = [
  {
    title: 'Create your bidder account',
    copy: 'Register online with your contact details and identity information so the auction team can verify your account before bidding.',
  },
  {
    title: 'Review the listing packet',
    copy: 'Check photos, VIN, mileage, title status, seller notes, fees, and pickup or delivery details before placing a bid.',
  },
  {
    title: 'Win and verify',
    copy: 'After you win, we send the vehicle document packet and key-release confirmation so you can verify the purchase before final payment.',
  },
  {
    title: 'Pay in two steps',
    copy: 'Pay the auction fee first to secure the sale, then pay the full vehicle balance after the documents and key release are confirmed.',
  },
]

export const faqs = [
  {
    question: 'Is this an online auction?',
    answer:
      'Yes. Buyers can browse vehicles, review listing details, place bids, and complete checkout online. Some vehicles may still have local preview or pickup options listed on the vehicle page.',
  },
  {
    question: 'Do I need a dealer license?',
    answer:
      'No. Public buyers and licensed dealers can bid. Public buyers only need an approved bidder account and must follow the posted auction and payment terms.',
  },
  {
    question: 'How do I know the vehicle and sale are real?',
    answer:
      'Each listing includes photos, VIN details, mileage, title status, seller notes, and sale terms. After a winning bid, the buyer receives a document packet and key-release confirmation before completing the full vehicle payment.',
  },
  {
    question: 'What happens after I win a vehicle?',
    answer:
      'We issue a winning-bid confirmation, invoice, vehicle document packet, and key-release confirmation. You then pay the auction fee to secure the unit, followed by the full vehicle balance through approved payment instructions.',
  },
  {
    question: 'Why is there an auction fee before full payment?',
    answer:
      'The auction fee confirms the buyer is moving forward, holds the winning unit, and starts the document and release process. The full vehicle balance is paid only after the purchase documents and key release are confirmed.',
  },
  {
    question: 'How are documents and keys handled?',
    answer:
      'The title documents, bill of sale, release paperwork, and key-release details are sent to the buyer after the win is verified. Physical key handoff or shipment is coordinated with pickup or delivery.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'Approved payment methods can include bank transfer, certified funds, ACH, wire, or approved card payments for eligible fees. Final payment instructions are shown on the invoice.',
  },
  {
    question: 'Can I arrange delivery?',
    answer:
      'Yes. Buyers can request pickup or transport after checkout. Delivery timing depends on payment clearance, document completion, and carrier availability.',
  },
  {
    question: 'Can I sell my vehicle online?',
    answer:
      'Yes. Public sellers, dealers, fleets, and government accounts can submit vehicles with VIN, mileage, title status, photos, reserve expectations, and pickup location.',
  },
]
