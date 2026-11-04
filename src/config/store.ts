export const storeConfig = {
  name: 'Tabatices',
  whatsappNumber: '5511982458010',
  instagramHandle: 'tabatices.art',
  ownerBirthDate: { year: 1989, month: 9, day: 18 },
  pixDiscountPercent: 5,
  localDelivery: {
    city: 'São José dos Campos',
    state: 'SP',
    fee: 10,
  },
  pickupAddressHint: 'Combinamos o ponto de retirada com você.',
  shippingRegions: [
    { name: 'São Paulo', states: ['SP'], fee: 20 },
    { name: 'Sudeste', states: ['RJ', 'MG', 'ES'], fee: 25 },
    { name: 'Sul', states: ['PR', 'SC', 'RS'], fee: 28 },
    { name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'], fee: 32 },
    { name: 'Nordeste', states: ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'], fee: 38 },
    { name: 'Norte', states: ['TO', 'PA', 'AP', 'AM', 'RR', 'AC', 'RO'], fee: 45 },
  ],
}
