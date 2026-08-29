INSERT INTO crypto_wallets (
  wallet_name,
  network,
  currency_symbol,
  wallet_address,
  qr_code_url,
  instructions
) VALUES
(
  'Royal Mile Bitcoin Wallet',
  'Bitcoin',
  'BTC',
  'bc1qexampleauctionwalletaddress000000000000',
  '/uploads/wallet-qr/sample-btc-qr.png',
  'Send BTC only on the Bitcoin network. Include invoice number in your payment confirmation.'
),
(
  'Royal Mile Ethereum Wallet',
  'Ethereum',
  'ETH',
  '0xExampleAuctionWalletAddress0000000000000000',
  '/uploads/wallet-qr/sample-eth-qr.png',
  'Send ETH only on Ethereum mainnet. Do not send unsupported tokens to this address.'
),
(
  'Royal Mile USDT Wallet',
  'TRON',
  'USDT',
  'TExampleAuctionWalletAddress00000000000000000',
  '/uploads/wallet-qr/sample-usdt-qr.png',
  'Send USDT only on TRON TRC20 unless the invoice says otherwise.'
);
