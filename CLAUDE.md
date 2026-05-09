# Callpicker CS — Guía de trabajo para Claude

## Stack
- **Framework**: Next.js 14 App Router (`force-dynamic` en todas las páginas)
- **Base de datos**: Supabase (PostgreSQL)
- **Deploy**: Vercel → rama `main` es producción
- **Estilos**: Tailwind CSS + clases globales en `app/globals.css`
- **Directorio local**: `D:\Projects\callpicker-cs`

## Reglas de Git — SIEMPRE seguir este flujo

### ✅ Flujo correcto para cada sesión

```bash
# 1. Empezar desde main actualizado
cd D:\Projects\callpicker-cs
git checkout main
git pull origin main

# 2. Crear rama feature con nombre descriptivo
git checkout -b feature/nombre-corto

# 3. Trabajar: editar archivos, commits frecuentes
git add <archivos>
git commit -m "descripcion del cambio"

# 4. Cuando termina la sesión, abrir PR hacia main
git push origin feature/nombre-corto
gh pr create --base main --head feature/nombre-corto
```

### ❌ Lo que NO se debe hacer
- Nunca hacer push directo a `main`
- Nunca hacer `git push origin master:main`
- No acumular cambios sin commits intermedios

### Nombres de rama sugeridos
| Tipo | Ejemplo |
|---|---|
| Nueva función | `feature/reuniones-calendar` |
| Fix de bug | `fix/background-color` |
| Mejora UI | `ui/ios-buttons` |
| Hotfix urgente | `hotfix/500-error-seguimiento` |

## Estructura del proyecto

```
app/
  page.tsx              ← Dashboard principal
  cuentas/page.tsx      ← Lista de cuentas
  cuentas/[id]/page.tsx ← Detalle de cuenta
  seguimiento/page.tsx  ← Agenda de mentoring por asesor
  reuniones/page.tsx    ← Log de reuniones del equipo
  asesores/page.tsx     ← Panel por asesor
  metricas/page.tsx     ← Gráficas y métricas
  chat/page.tsx         ← Atlas IA
  upsell/page.tsx       ← Oportunidades upsell/cross
  globals.css           ← Estilos globales + clases cp-*
  layout.tsx            ← Root layout (sidebar + main)

components/
  Sidebar.tsx           ← Navegación lateral (azul marino hardcoded)
  StatCard.tsx          ← Tarjeta de KPI
  PageHeader.tsx        ← Header de página
  SemaforoBadge.tsx     ← Chip de color por health score
  HealthScoreRing.tsx   ← Anillo SVG de health score
  HealthScoreEditor.tsx ← Editor de scores (slider)
  SeguimientoForm.tsx   ← Formulario de seguimiento KAM
  TopRiesgoTable.tsx    ← Tabla de cuentas en riesgo
  charts/               ← Componentes Recharts

lib/
  supabase.ts           ← Queries a Supabase
  types.ts              ← Tipos TS + helpers (getSemaforo, formatMXN)
```

## Sistema de diseño

### Colores principales (tailwind.config.ts)
| Token | Valor | Uso |
|---|---|---|
| `page` | `#EFF6FF` | Fondo de página |
| `surface` | `#FFFFFF` | Fondo de card |
| `bgAlt` | `#1E3A5F` | Sidebar |
| `cp` | `#0057FF` | Azul primario Callpicker |
| `border` | `#BFDBFE` | Bordes suaves |
| `textHi` | `#0F172A` | Texto principal |
| `textMid` | `#334155` | Texto secundario |
| `textLow` | `#64748B` | Texto muted |

### Semáforo Health Score
| Color | HS | Significado |
|---|---|---|
| `verde` | ≥ 80 | Saludable |
| `azul` | 60–79 | Estable |
| `amarillo` | 40–59 | Observación |
| `naranja` | 20–39 | En Riesgo |
| `rojo` | < 20 | Riesgo Alto |

### Clases CSS globales
- `.cp-card` — tarjeta blanca con gradiente y sombra 3D
- `.cp-btn .cp-btn-primary` — botón azul estilo iOS
- `.cp-btn .cp-btn-ghost` — botón outline
- `.cp-btn .cp-btn-danger` — botón rojo
- `.cp-icon-btn` — botón ícono cuadrado (app icon style)
- `.cp-input` / `.cp-select` — inputs con estilo consistente
- `.cp-table` — tabla con cabeceras azul claro

## Supabase — tablas principales
- `cuentas` — cartera de clientes (health_score, asesor, facturacion, etc.)
- `seguimientos` — log de actividad KAM por cuenta
- `oportunidades` — pipeline upsell/cross-sell
- `tickets` — tickets de soporte abiertos
- `health_historial` — evolución histórica del health score
- `vista_semaforo_asesor` — vista con distribución por asesor (**puede dar 500 si no existe**)

## Lecciones aprendidas (errores frecuentes)
1. **No usar FK joins en Supabase** (`select('*, cuentas(...)')`) — rompe si no hay FK explícita. Hacer joins manuales en JS.
2. **No llamar `vista_semaforo_asesor`** — calcular distribución localmente desde el array de `cuentas`.
3. **No nombrar colores Tailwind con el mismo nombre que un prefijo** — ej: `bg: '#EFF6FF'` genera `bg-bg` que falla. Usar `page`, `surface`, etc.
4. **Siempre push a `origin/main`** para que Vercel haga deploy. `origin/master` es la rama de trabajo, no la de producción.
5. **`/supabase/`** está en `.gitignore` — no subir scripts de diagnóstico.
