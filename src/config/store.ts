export const storeConfig = {
  name: 'Tabatices',
  siteUrl: 'https://tabatices.art',
  whatsappNumber: '5511982458010',
  instagramHandle: 'tabatices.art',
  pixDiscountPercent: 5,
  shippingQuoteUrl: 'https://tabatices-frete.tabata-91e.workers.dev/quote',
  shippingBox: { length: 26, width: 19, height: 6, weightsInKgByItemCount: [0.345, 0.6, 0.86, 1.12] },
  shippingRegions: [
    { name: 'São Paulo', states: ['SP'], fee: 20 },
    { name: 'Sudeste', states: ['RJ', 'MG', 'ES'], fee: 25 },
    { name: 'Sul', states: ['PR', 'SC', 'RS'], fee: 28 },
    { name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'], fee: 32 },
    { name: 'Nordeste', states: ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'], fee: 38 },
    { name: 'Norte', states: ['TO', 'PA', 'AP', 'AM', 'RR', 'AC', 'RO'], fee: 45 },
  ],
}
