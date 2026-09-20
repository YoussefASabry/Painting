const ZONE_MAP = {
  cairo: 1, giza: 1, qalyubia: 1,
  alexandria: 2, beheira: 2, gharbia: 2, sharqia: 2, dakahlia: 2,
  damietta: 2, monufia: 2, kafr_el_sheikh: 2, port_said: 2, ismailia: 2, suez: 2,
  fayoum: 3, beni_suef: 3, minya: 3, assiut: 3, sohag: 3, qena: 3, luxor: 3, aswan: 3,
  matrouh: 4, red_sea: 4, south_sinai: 4, north_sinai: 4, new_valley: 4,
}

const ZONE_RATES = {
  1: { base: 110, extraKg: 20 },
  2: { base: 140, extraKg: 25 },
  3: { base: 170, extraKg: 35 },
  4: { base: 210, extraKg: 45 },
}

const GOVERNORATE_META = {
  cairo:           { name: "Cairo",          zone: 1 },
  giza:            { name: "Giza",           zone: 1 },
  qalyubia:        { name: "Qalyubia",       zone: 1 },
  alexandria:      { name: "Alexandria",     zone: 2 },
  beheira:         { name: "Beheira",        zone: 2 },
  gharbia:         { name: "Gharbia",        zone: 2 },
  sharqia:         { name: "Sharqia",        zone: 2 },
  dakahlia:        { name: "Dakahlia",       zone: 2 },
  damietta:        { name: "Damietta",       zone: 2 },
  monufia:         { name: "Monufia",        zone: 2 },
  kafr_el_sheikh:  { name: "Kafr El Sheikh", zone: 2 },
  port_said:       { name: "Port Said",      zone: 2 },
  ismailia:        { name: "Ismailia",       zone: 2 },
  suez:            { name: "Suez",           zone: 2 },
  fayoum:          { name: "Fayoum",         zone: 3 },
  beni_suef:       { name: "Beni Suef",      zone: 3 },
  minya:           { name: "Minya",          zone: 3 },
  assiut:          { name: "Assiut",         zone: 3 },
  sohag:           { name: "Sohag",          zone: 3 },
  qena:            { name: "Qena",           zone: 3 },
  luxor:           { name: "Luxor",          zone: 3 },
  aswan:           { name: "Aswan",          zone: 3 },
  matrouh:         { name: "Matrouh",        zone: 4 },
  red_sea:         { name: "Red Sea",        zone: 4 },
  south_sinai:     { name: "South Sinai",    zone: 4 },
  north_sinai:     { name: "North Sinai",    zone: 4 },
  new_valley:      { name: "New Valley",     zone: 4 },
}

export const GOVERNORATE_RATES = Object.fromEntries(
  Object.entries(GOVERNORATE_META).map(([key, meta]) => [
    key,
    { name: meta.name, base: ZONE_RATES[meta.zone].base, extraKg: ZONE_RATES[meta.zone].extraKg },
  ])
)

function roundToNearest5(n) {
  return Math.round(n / 5) * 5
}

export function calculateShipping(artwork, governorateKey) {
  const zone = ZONE_MAP[governorateKey]
  if (!zone) return { totalShipping: 0 }

  const rates = ZONE_RATES[zone]

  const w = Number(artwork.width_cm || 30)
  const h = Number(artwork.height_cm || 40)
  const d = Number(artwork.depth_cm || 4)
  const actualWeight = Number(artwork.weight_kg || 2)

  const PAD = 3
  const finalLength = w + PAD
  const finalWidth = h + PAD
  const finalHeight = d

  const volumetricWeight = (finalLength * finalWidth * finalHeight) / 3000
  const billableWeight = Math.ceil(Math.max(actualWeight, volumetricWeight))

  const subtotal = rates.base + (billableWeight - 1) * rates.extraKg
  const fuelSurcharge = subtotal * 0.18
  const vat = (subtotal + fuelSurcharge) * 0.14
  const rawTotal = subtotal + fuelSurcharge + vat
  const finalTotal = roundToNearest5(rawTotal)

  return {
    totalShipping: finalTotal,
    billableWeight,
    breakdown: { subtotal, fuelSurcharge, vat },
  }
}
