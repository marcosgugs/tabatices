export const storeConfig = {
  name: 'Tabatices',
  siteUrl: 'https://tabatices.art',
  whatsappNumber: '5511982458010',
  instagramHandle: 'tabatices.art',
  tiktokHandle: 'tabatices.art',
  pixDiscountPercent: 5,
  customerCardFeesPercentByInstallmentCount: [0, 6.09, 7.01, 7.91, 8.8],
  extraProductionDays: 1,
  shippingQuoteUrl: 'https://tabatices-frete.tabata-91e.workers.dev/quote',
  supabase: {
    url: 'https://ulfstxohfdteqkyreuyd.supabase.co',
    publishableKey: 'sb_publishable_zips9rpcJWUi52tqkXrOZw_CBgxmNA_',
  },
  shippingBox: {
    sizes: [
      { maxItemCount: 2, length: 27, width: 17, height: 3.5 },
      { maxItemCount: 7, length: 27, width: 17.5, height: 9 },
    ],
    weightsInKgByItemCount: [0.338, 0.6, 0.8, 1, 1.5, 1.7, 1.9],
  },
  shippingRegions: [
    { name: 'São Paulo', states: ['SP'], fee: 20 },
    { name: 'Sudeste', states: ['RJ', 'MG', 'ES'], fee: 25 },
    { name: 'Sul', states: ['PR', 'SC', 'RS'], fee: 28 },
    { name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'], fee: 32 },
    { name: 'Nordeste', states: ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'], fee: 38 },
    { name: 'Norte', states: ['TO', 'PA', 'AP', 'AM', 'RR', 'AC', 'RO'], fee: 45 },
  ],
}
