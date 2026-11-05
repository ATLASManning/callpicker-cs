import {
  HERO, HERO_TAG, HERO_CIAN, HERO_LEAD, HERO_PILL, HERO_BORDE,
} from '@/lib/paleta-cs'

/**
 * LA CABECERA DEL «CUSTOMER SUCCESS OPERATING SYSTEM».
 *
 * Nació dentro de `app/cuentas/contratos/page.tsx`. Al pedir dirección el mismo
 * formato para el Dashboard, copiarlo habría duplicado el degradado y sus seis
 * tokens medidos en dos archivos: la próxima vez que uno se corrigiera, el otro
 * se quedaría con la medición vieja **sin que fallara nada**. Es exactamente el
 * patrón de «paletas gemelas». [[atlas-dashboard-contrast-architecture]]
 *
 * NO lleva `'use client'` ni hooks a propósito: así se puede montar desde un
 * componente de SERVIDOR —`app/page.tsx` lo es— y también desde uno de cliente.
 *
 * Los tonos NO se eligen aquí: vienen de `lib/paleta-cs.ts`, donde cada uno
 * lleva su medición contra el extremo CLARO del degradado, que es el que
 * aprieta. Un degradado no se mide por su extremo oscuro.
 */
export default function HeroModulo({
  titulo, tituloCian, lead, pastillas, rotulo = 'Callpicker / Customer Success', acciones,
}: {
  /** Primera línea del titular, en blanco. */
  titulo: string
  /** Segunda línea, en cian. Si no se pasa, el titular va de una sola línea. */
  tituloCian?: string
  /** El párrafo de entrada. Dice de qué va la pantalla, no la saluda. */
  lead: string
  /** Cifras ya medidas. Cada una tiene que poder sostenerse sola. */
  pastillas?: string[]
  rotulo?: string
  /** Botones de la esquina. Van sobre el extremo OSCURO del degradado. */
  acciones?: React.ReactNode
}) {
  return (
    <header style={{ background: HERO, color: '#FFFFFF', position: 'relative',
                     overflow: 'hidden', padding: '40px 32px 36px' }}>
      <div aria-hidden="true"
           style={{ position: 'absolute', width: 430, height: 430, right: -130, top: -175,
                    border: '1px solid #FFFFFF21', borderRadius: '50%',
                    boxShadow: '0 0 0 70px #FFFFFF09, 0 0 0 145px #FFFFFF06',
                    pointerEvents: 'none' }} />
      {acciones && (
        <div style={{ position: 'absolute', right: 32, top: 32, zIndex: 2 }}>
          {acciones}
        </div>
      )}
      <div style={{ position: 'relative', maxWidth: 820 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.17em',
                    textTransform: 'uppercase', color: HERO_TAG }}>
          {rotulo}
        </p>
        <h1 style={{ fontSize: 44, lineHeight: 1.06, letterSpacing: '-0.04em',
                     fontWeight: 850, margin: '14px 0 12px' }}>
          {titulo}
          {tituloCian && <><br /><span style={{ color: HERO_CIAN }}>{tituloCian}</span></>}
        </h1>
        <p style={{ color: HERO_LEAD, fontSize: 13.5, lineHeight: 1.55, maxWidth: 640 }}>
          {lead}
        </p>
        {pastillas && pastillas.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {pastillas.map(t => (
              <span key={t} style={{ border: `1px solid ${HERO_BORDE}`, borderRadius: 30,
                                     padding: '5px 13px', fontSize: 11.5, color: HERO_PILL }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
