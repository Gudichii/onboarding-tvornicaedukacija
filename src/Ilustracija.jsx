/**
 * Crteži — štapićasti likovi, nesavršena ruka.
 *
 * Postojeći doodle stil JE brend i ne zamjenjuje se čistom vektorskom grafikom.
 * Zato su ovdje linije namjerno malo krive, s okruglim krajevima, kao povučene
 * rukom. Linija je uvijek tinta; boja se koristi samo kao ispuna i samo kad
 * kutija nosi značenje iz palete.
 *
 * Ovo su privremeni crteži. Prave datoteke stoje u Driveu
 * (CC DELIVERY > BRENDING) i kad se izvezu, zamjenjuju ove.
 */

const TINTA = '#14121A'
const LILA = '#CCB0EB'
const ZELENA = '#7FA86B'

const pero = {
  fill: 'none',
  stroke: TINTA,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/** Štapićasti lik. Glava je malo spljoštena da ne izgleda kao šestar. */
function Lik({ x, y, ruke = 'dolje' }) {
  const ruceD = 'M-13 22 L0 12 L13 20'
  const ruceG = 'M-14 6 L0 12 L15 4'
  return (
    <g transform={`translate(${x} ${y})`} {...pero}>
      <ellipse cx="0" cy="-6" rx="8.5" ry="8" />
      <path d="M0 2 L1 30" />
      <path d={ruke === 'gore' ? ruceG : ruceD} />
      <path d="M1 30 L-9 48" />
      <path d="M1 30 L12 47" />
    </g>
  )
}

/**
 * Uvodni crtež: razbacani papiri s lijeva, kroz upitnik, u složen sustav.
 * Lila je ono što tek ulazi, zelena je gotov ishod — točno kako paleta traži.
 */
export function IlustracijaUvod() {
  return (
    <svg viewBox="0 0 460 150" width="100%" role="img" aria-label="Od razbacanih podataka do složenog sustava">
      {/* razbacani papiri */}
      <g {...pero}>
        <path d="M14 96 L44 92 L47 120 L17 124 Z" fill={LILA} />
        <path d="M30 74 L62 68 L67 95 L35 101 Z" fill={LILA} />
        <path d="M8 62 L36 55 L41 79 L13 86 Z" />
        <path d="M20 66 L31 64" />
        <path d="M22 71 L33 69" />
      </g>

      {/* lik koji ih predaje */}
      <Lik x={122} y={72} ruke="gore" />

      {/* strelica */}
      <g {...pero}>
        <path d="M168 96 C196 84, 214 84, 240 94" />
        <path d="M232 87 L241 95 L231 99" />
      </g>

      {/* upitnik u ploči */}
      <g {...pero}>
        <rect x="256" y="52" width="62" height="80" rx="2" />
        <path d="M266 68 L308 68" />
        <path d="M266 80 L302 80" />
        <path d="M266 92 L308 92" />
        <path d="M266 104 L296 104" />
        <path d="M266 116 L304 116" />
      </g>

      <g {...pero}>
        <path d="M330 92 C350 86, 362 86, 380 92" />
        <path d="M372 85 L381 93 L371 97" />
      </g>

      {/* složen sustav — jedina zelena, jer je to ishod */}
      <g {...pero}>
        <rect x="396" y="46" width="26" height="26" rx="2" fill={ZELENA} />
        <rect x="396" y="80" width="26" height="26" rx="2" />
        <rect x="428" y="63" width="26" height="26" rx="2" />
        <path d="M422 59 L428 72" />
        <path d="M422 93 L428 82" />
      </g>
    </svg>
  )
}

/** Mali znak uz popis onoga što treba pripremiti. */
export function IlustracijaPriprema() {
  return (
    <svg viewBox="0 0 120 90" width="120" role="img" aria-label="Papiri pri ruci">
      <g {...pero}>
        <path d="M18 30 L58 24 L64 70 L24 76 Z" fill={LILA} />
        <path d="M30 22 L72 16 L78 62 L36 68 Z" />
        <path d="M44 32 L66 29" />
        <path d="M46 41 L68 38" />
        <path d="M48 50 L62 48" />
        <path d="M88 34 L96 42 L110 22" />
      </g>
    </svg>
  )
}
