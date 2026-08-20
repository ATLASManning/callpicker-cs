import { ANCONA_AUTOPARTES }      from './ancona-autopartes-data'
import { ARKANSAS }              from './arkansas-data'
import { FINSUS }                from './finsus-data'
import { GRUPOFRISA }            from './grupofrisa-data'
import { AGUA_INMACULADA }       from './agua-inmaculada-data'
import { SALUD_Y_HOGAR }         from './salud-y-hogar-data'
import { SAMALAB }               from './samalab-data'
import { LABSUS }                from './labsus-data'
import { ALIANZA }               from './alianza-data'
import { ALTERNET }              from './alternet-data'
import { AZYCO }                 from './azyco-data'
import { BRANDGROUP }            from './brandgroup-data'
import { CINTAS_COVE }           from './cintascove-data'
import { CLICKBALANCE }          from './clickbalance-data'
import { ELERY_BRANDS }          from './elerybrands-data'
import { HOSPITAL_SANTA_ROSA }   from './hospital-santa-rosa-data'
import { TRAVELLING }            from './travelling-data'
import { POLAK_GRUPO }           from './polak-grupo-data'
import { PUBSA }                 from './pubsa-data'
import { DENTAL_DISTRICT }       from './dental-district-data'
import { MEDICALL_EXPERT }       from './medicall-expert-data'
import { VAEO_BUSINESS_CLUB }    from './vaeo-business-club-data'
import { KOMBITEC }              from './kombitec-data'
import { NERUC_SEDE_CENTRAL }   from './neruc-sede-central-data'
import { JASON_DE_MEXICO }      from './jason-de-mexico-data'
import { GWEP }                  from './gwep-data'
import type { AuditoriaCase } from './types'

export const STATIC_CASES: AuditoriaCase[] = [
  ANCONA_AUTOPARTES, ARKANSAS, FINSUS, GRUPOFRISA, AGUA_INMACULADA, SALUD_Y_HOGAR,
  SAMALAB, LABSUS, ALIANZA, ALTERNET, AZYCO,
  BRANDGROUP, CINTAS_COVE, CLICKBALANCE, ELERY_BRANDS,
  HOSPITAL_SANTA_ROSA, TRAVELLING, POLAK_GRUPO, PUBSA,
  DENTAL_DISTRICT, MEDICALL_EXPERT, VAEO_BUSINESS_CLUB, KOMBITEC,
  NERUC_SEDE_CENTRAL, JASON_DE_MEXICO, GWEP,
]

export const STATIC_CASE_IDS: ReadonlySet<string> = new Set(STATIC_CASES.map(c => c.id))

export function getAuditCaseById(id: string): AuditoriaCase | null {
  return STATIC_CASES.find(c => c.id === id) ?? null
}
