import camryImage from '../assets/vehicle-camry.png'
import crvImage from '../assets/vehicle-crv.png'
import f150Image from '../assets/vehicle-f150.png'
import silveradoImage from '../assets/vehicle-silverado.png'

export const navItems = [
  { label: 'Home', route: 'home', path: '/' },
  { label: 'Auctions', route: 'auctions', path: '/auctions' },
  { label: 'Inventory', route: 'inventory', path: '/inventory' },
  { label: 'Buyer Info', route: 'buyers', path: '/buyers' },
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
    miles: '48k mi',
    lane: 'A12',
    lot: '1021',
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
    id: 'lot-1044',
    image: f150Image,
    year: '2020',
    make: 'Ford',
    model: 'F-150 XLT',
    miles: '72k mi',
    lane: 'B03',
    lot: '1044',
    vin: '1FTEW1E5***7731',
    title: 'Title present',
    status: 'Fleet seller',
    seller: 'Fleet account',
    light: 'Green light',
    transmission: 'Automatic',
    drivetrain: '4x4',
    notes: 'Crew cab, bed liner, tow package, strong fleet maintenance history.',
  },
  {
    id: 'lot-1088',
    image: crvImage,
    year: '2019',
    make: 'Honda',
    model: 'CR-V EX',
    miles: '61k mi',
    lane: 'A28',
    lot: '1088',
    vin: '2HKRW2H5***9036',
    title: 'Clean title',
    status: 'Public consignment',
    seller: 'Public seller',
    light: 'Yellow light',
    transmission: 'CVT',
    drivetrain: 'AWD',
    notes: 'Sunroof, backup camera, newer tires, title verified at intake.',
  },
  {
    id: 'lot-1136',
    image: silveradoImage,
    year: '2018',
    make: 'Chevrolet',
    model: 'Silverado LT',
    miles: '89k mi',
    lane: 'C14',
    lot: '1136',
    vin: '3GCUKREC***5120',
    title: 'Title absent',
    status: 'Green light',
    seller: 'Dealer consignment',
    light: 'Green light',
    transmission: 'Automatic',
    drivetrain: '4x4',
    notes: 'Crew cab, chrome package, clean body, title pending from seller.',
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
