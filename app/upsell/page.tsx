import PageHeader from '@/components/PageHeader'
import UpsellRegistros from './UpsellRegistros'
import Leads from './Leads'

export const dynamic = 'force-dynamic'

export default function UpsellPage() {
  // La pagina ya no calcula pipeline: los modulos que lo consumian (tira de
  // KPIs, tarjetas por asesor y tabla "Pipeline Completo") se retiraron porque
  // llevaban meses en cero — `upsell_producto`, `crossell_producto` y
  // `valor_upsell_estimado` nunca se capturaron en ninguna cuenta. Lo que queda
  // es lo que si se usa: los formularios de Zoho, el registro de oportunidades
  // y la captura de leads.

  return (
    <div className="min-h-screen">
      <PageHeader title="Pipeline Upsell & Cross-sell" subtitle="Oportunidades de expansión de cartera activa" />

      {/* Formularios */}
      <div className="px-6 pb-6">
        <div className="cp-card mb-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-cp" />
            <h3 className="text-sm font-bold text-textHi">Formularios</h3>
            <span className="text-[10px] text-textLow uppercase tracking-wide ml-1">Captura de oportunidades · Zoho</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://forms.zohopublic.com/virtualoffice23037/form/Detallesdelcliente/formperma/k9B-VO3p9PSrCRKPFhe1sCQyBUM_rEe0dZV2rL6lphc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-3 rounded-xl border border-cpTeal/30 bg-cpTeal/5 hover:bg-cpTeal/10 transition-colors px-4 py-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-cpTeal/15 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cpTeal">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cpTeal group-hover:underline">Lead Nuevo</p>
                <p className="text-[11px] text-textLow truncate">Sin cuenta Callpicker · Detalles del cliente</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textLow flex-shrink-0">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>

            <a
              href="https://forms.zohopublic.com/virtualoffice23037/form/FormularioPerfilamiento2daversin/formperma/43yvXFdwbGMGc_ni__Yh0xCIIsmmpqOWK1_tf3fKUW4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-3 rounded-xl border border-cp/30 bg-cp/5 hover:bg-cp/10 transition-colors px-4 py-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-cp/15 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cp">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cp group-hover:underline">Lead con Cuenta Activa</p>
                <p className="text-[11px] text-textLow truncate">Con cuenta Callpicker · Perfilamiento 2ª versión</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textLow flex-shrink-0">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Registro de Oportunidades */}
      <UpsellRegistros />

      {/* Lead — captura de prospectos, hasta abajo del apartado */}
      <Leads />
    </div>
  )
}
