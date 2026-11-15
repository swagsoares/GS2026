// Clara: a persona do produto. Ilustração original em SVG (escala sem perder nitidez).
// `falando` anima a boca; `fundo` troca a cor do círculo atrás dela.
export const NOME = 'Clara'

type Props = { tamanho?: number; falando?: boolean; fundo?: string; className?: string; titulo?: string }

export default function Clara({ tamanho = 96, falando = false, fundo = '#2340D9', className = '', titulo = 'Clara, assistente virtual do posto de saúde' }: Props) {
  const pele = '#9A6142'
  const peleSombra = '#84503A'
  const cabelo = '#2A1B14'
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200" role="img" aria-label={titulo} className={`clara ${falando ? 'clara-falando' : ''} ${className}`}>
      <defs>
        <clipPath id="clara-circulo"><circle cx="100" cy="100" r="100" /></clipPath>
      </defs>
      <g clipPath="url(#clara-circulo)">
        <rect width="200" height="200" fill={fundo} />
        {/* cabelo de trás: volume cacheado */}
        <g fill={cabelo}>
          <circle cx="62" cy="78" r="30" /><circle cx="138" cy="78" r="30" /><circle cx="100" cy="52" r="36" />
          <circle cx="54" cy="108" r="24" /><circle cx="146" cy="108" r="24" /><circle cx="70" cy="48" r="22" /><circle cx="130" cy="48" r="22" />
          <circle cx="100" cy="22" r="20" />
        </g>
        {/* corpo: blusa amarela (cor do piso tátil) com gola */}
        <path d="M30 200 C34 160 62 146 100 146 C138 146 166 160 170 200 Z" fill="#F5C400" />
        <path d="M100 146 C112 146 122 148 130 151 L100 178 L70 151 C78 148 88 146 100 146 Z" fill="#E2B300" />
        {/* pescoço */}
        <path d="M86 128 L114 128 L116 152 C108 160 92 160 84 152 Z" fill={peleSombra} />
        {/* orelhas e brinco */}
        <ellipse cx="62" cy="104" rx="8" ry="11" fill={pele} />
        <ellipse cx="138" cy="104" rx="8" ry="11" fill={pele} />
        <circle cx="137" cy="118" r="4" fill="#F5C400" />
        {/* rosto */}
        <ellipse cx="100" cy="100" rx="38" ry="42" fill={pele} />
        {/* cabelo da frente: franja de cachos */}
        <g fill={cabelo}>
          <circle cx="74" cy="70" r="14" /><circle cx="90" cy="62" r="14" /><circle cx="108" cy="61" r="14" /><circle cx="125" cy="69" r="14" />
          <circle cx="66" cy="84" r="9" /><circle cx="134" cy="84" r="9" />
        </g>
        {/* sobrancelhas */}
        <path d="M78 88 Q86 83 94 87" stroke={cabelo} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M106 87 Q114 83 122 88" stroke={cabelo} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* olhos */}
        <ellipse cx="86" cy="99" rx="4.6" ry="5.4" fill="#1A1F36" />
        <ellipse cx="114" cy="99" rx="4.6" ry="5.4" fill="#1A1F36" />
        <circle cx="87.6" cy="97.2" r="1.5" fill="#fff" />
        <circle cx="115.6" cy="97.2" r="1.5" fill="#fff" />
        {/* bochechas */}
        <ellipse cx="76" cy="113" rx="7" ry="4.5" fill="#C8735A" opacity="0.55" />
        <ellipse cx="124" cy="113" rx="7" ry="4.5" fill="#C8735A" opacity="0.55" />
        {/* nariz */}
        <path d="M97 106 Q100 111 104 108" stroke={peleSombra} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* boca: sorriso fechado, e aberta quando fala */}
        <path className="clara-sorriso" d="M88 118 Q100 128 112 118" stroke="#5A2A1E" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <g className="clara-boca">
          <path d="M89 117 Q100 117 111 117 Q108 129 100 129 Q92 129 89 117 Z" fill="#5A2A1E" />
          <path d="M93 124 Q100 121 107 124 Q104 128 100 128 Q96 128 93 124 Z" fill="#D9786A" />
        </g>
        {/* fone com microfone (ela liga para as pessoas) */}
        <path d="M58 100 C56 56 144 56 142 100" stroke="#1A1F36" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="50" y="92" width="14" height="22" rx="6" fill="#1A1F36" />
        <rect x="136" y="92" width="14" height="22" rx="6" fill="#1A1F36" />
        <path d="M57 112 C58 128 70 134 84 131" stroke="#1A1F36" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="82" y="127.5" width="10" height="7" rx="3.5" fill="#1A1F36" />
      </g>
    </svg>
  )
}
