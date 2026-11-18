/**
 * RESUELVE `@/...` CUANDO UN GUION CORRE FUERA DE NEXT
 * ====================================================
 *
 *     ts-node --project tsconfig.import.json -r ./scripts/alias-ts.js guion.ts
 *
 * Next resuelve `@/lib/...` solo; `ts-node` no. Sin esto, cualquier guion que
 * importe un módulo de `lib/` que a su vez use el alias revienta con
 * `Cannot find module '@/lib/alertas'` — que es lo que pasó al sellar los
 * textos del motor de riesgo.
 *
 * LOS ALIAS NO SE TECLEAN AQUÍ. Se leen de `tsconfig.json`, que es donde los
 * declara el proyecto. Una copia a mano sería un espejo que deja de serlo el
 * día que alguien añada un alias, y entonces el guion fallaría por una razón
 * que no es la suya. [[feedback-verificar-antes-asegurar]]
 *
 * `tsconfig.json` no declara `baseUrl` —Next no lo necesita—, así que se fija
 * aquí a la raíz del proyecto, que es contra lo que Next resuelve `./*`.
 */
const path = require('path')
const ts   = require('typescript')

const RAIZ = path.join(__dirname, '..')
const ruta = path.join(RAIZ, 'tsconfig.json')

/* SE LEE CON EL PARSER DE TYPESCRIPT, NO CON UNA REGEX.
   `tsconfig.json` es JSONC: admite comentarios, y `JSON.parse` no. El primer
   intento los quitaba con `/\/\*[\s\S]*?\*\//g`, y ESA regex se come el propio
   alias: `"@/*"` contiene `/*`. El archivo que define los alias era justo el
   que la regex no sabía leer. Quien sabe leerlo es TypeScript. */
const leido = ts.readConfigFile(ruta, ts.sys.readFile)
if (leido.error) {
  throw new Error('No se pudo leer tsconfig.json: ' +
    ts.flattenDiagnosticMessageText(leido.error.messageText, ' '))
}

const paths = leido.config?.compilerOptions?.paths
if (!paths || !Object.keys(paths).length) {
  throw new Error(
    'tsconfig.json no declara compilerOptions.paths. Si los alias se movieron ' +
    'a otro archivo, este registro hay que apuntarlo allí: fallar aquí es ' +
    'preferible a resolver con una lista vacía y decir «módulo no encontrado».')
}

require('tsconfig-paths').register({ baseUrl: RAIZ, paths })
