/**
 * Znak Tvornice Edukacija — profil zupčastog tvorničkog krova, zadnji zub u rustu.
 * Geometrija je doslovno iz brand skilla i ne mijenja se.
 * Na tamnoj podlozi linije prelaze u papir, rust ostaje.
 */
export default function Znak({ visina = 40, tamna = false }) {
  const linija = tamna ? '#F4EFE6' : '#14121A';
  return (
    <svg
      viewBox="0 0 48 40"
      height={visina}
      width={(visina * 48) / 40}
      role="img"
      aria-label="Tvornica Edukacija"
    >
      <g
        fill="none"
        stroke={linija}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 30 L4 18 L13 30 L13 18 L22 30 L22 18 L31 30 L31 18" />
        <path d="M2 33 L44 33" />
      </g>
      <path
        d="M31 18 L40 30"
        fill="none"
        stroke="#AD753C"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
