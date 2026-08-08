/**
 * License plate canonicalisation.
 *
 * Greek plates are issued using only the 14 letters that exist in both the
 * Greek and Latin alphabets and render identically:
 *
 *   Α Β Ε Ζ Η Ι Κ Μ Ν Ο Ρ Τ Υ Χ
 *   A B E Z H I K M N O P T Y X
 *
 * They're different Unicode codepoints, so "ΖΜΡ1515" typed with a Greek
 * keyboard and "ZMP1515" typed with an English one would otherwise be two
 * unrelated plates — even though they look the same on screen and on the car.
 *
 * Everything is folded to the Latin equivalents, so it doesn't matter which
 * keyboard is used to enter or search for a plate. Nothing changes visually:
 * Greek Ρ and Latin P are indistinguishable in any normal font.
 *
 * Greek letters with no Latin lookalike (Γ, Δ, Λ, Π, Σ, Φ, Ψ, Ω) never appear
 * on plates and are deliberately left untouched.
 *
 * This mirrors public.normalize_plate() in the database — keep the two in step.
 */

const GREEK = 'ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ'
const LATIN = 'ABEZHIKMNOPTYX'

export function normalizePlate(value: string): string {
  const upper = (value ?? '').toUpperCase().replace(/[\s\-._/]/g, '')
  let out = ''
  for (const ch of upper) {
    const i = GREEK.indexOf(ch)
    out += i === -1 ? ch : LATIN[i]
  }
  return out
}
