# CLAUDE.md — DallapeSystems ERP

## Descripción del Proyecto

ERP completo para empresa de transporte/logística argentina llamada **DallapeSystems**.
Gestiona flota, choferes, viajes, clientes, caja, banco, combustible, costos, impuestos, tareas y facturación electrónica AFIP/ARCA.

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.1.6 (App Router, `'use client'`, `force-dynamic`) |
| Lenguaje | TypeScript 5 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) + middleware |
| Estilos | Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom |
| Íconos | Lucide React |
| Gráficos | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Notificaciones UI | Sonner (toasts) |
| Facturación AFIP | @afipsdk/afip.js (WSAA + WSFEV1) |
| Email | Resend |
| WhatsApp | CallMeBot API |
| GPS | Traccar (integración opcional) |
| Tests | Vitest |

---

## Estructura de Archivos

```
src/
├── app/
│   ├── layout.tsx              ← ThemeProvider + flash-prevention script
│   ├── globals.css             ← Variables CSS, dark/light theme overrides
│   ├── page.tsx                ← Landing pública
│   ├── login/page.tsx          ← Login
│   ├── dashboard/page.tsx      ← Dashboard principal con KPIs
│   ├── clientes/page.tsx       ← CRM + cuenta corriente clientes
│   ├── viajes/page.tsx         ← Gestión de viajes
│   ├── camiones/page.tsx       ← Flota de camiones
│   ├── choferes/page.tsx       ← Gestión de choferes
│   ├── caja/page.tsx           ← Caja (efectivo)
│   ├── banco/page.tsx          ← Cuenta bancaria
│   ├── combustible/page.tsx    ← Cargas de combustible
│   ├── costos-multas/page.tsx  ← Costos fijos, impuestos y multas
│   ├── tareas/page.tsx         ← Tareas y recordatorios
│   ├── remitos/page.tsx        ← Remitos (liga viajes con facturas)
│   ├── facturacion/page.tsx    ← Facturas ARCA + manuales
│   └── api/arca/
│       ├── auth/route.ts       ← Token WSAA (cache 12h)
│       ├── facturar/route.ts   ← Emitir factura AFIP
│       ├── sign/route.ts       ← Firma PKCS#7
│       ├── ping/route.ts       ← Health check AFIP
│       └── test/route.ts       ← Facturar en homologación
├── components/
│   ├── navbar/Navbar.tsx       ← Nav fija, alertas, toggle tema
│   ├── ThemeProvider.tsx       ← Context dark/light
│   ├── clientes/ (15 archivos)
│   ├── viajes/ (7 archivos)
│   ├── choferes/ (6 archivos)
│   ├── flota/ (5 archivos)
│   ├── caja/ (5 archivos)
│   ├── facturacion/ (7 archivos)
│   ├── combustible/ (2 archivos)
│   ├── costos/ (5 archivos)
│   ├── tareas/ (3 archivos)
│   └── multas/ (2 archivos)
└── lib/
    ├── supabase.ts             ← Cliente Supabase browser
    ├── cajaService.ts          ← GATEWAY CENTRAL para todos los movimientos $
    ├── backupService.ts        ← Generación de PDFs (jsPDF)
    └── tareasNotificaciones.ts ← Alertas por email/WhatsApp
scripts/
├── 1_limpiar_datos.sql         ← Borra todos los datos (respeta FK)
└── 2_datos_prueba.sql          ← Carga dataset completo de prueba
```

---

## Base de Datos — Tablas y Columnas Clave

> ⚠️ **Schema verificado contra la DB real de Supabase. No asumir columnas que no estén listadas.**

### `clientes`
`id, razon_social, cuit, nombre_contacto, telefono, direccion, ruta_origen, ruta_destino, ruta_km_estimados, tarifa_flete, pago_chofer, lts_gasoil_estimado, costo_descarga, desgaste_por_km`

### `camiones`
`id, patente, modelo, km_actual, km_ultimo_service, estado, vto_rto, vto_senasa`

### `choferes`
`id, nombre, dni, telefono, licencia, vto_licencia, estado, km_recorridos, lts_consumidos`

### `viajes`
`id, fecha, cliente_id, chofer_id, camion_id, origen, destino, km_recorridos, lts_gasoil, precio_gasoil, tarifa_flete, pago_chofer, costo_descarga, desgaste_por_km, es_retorno, estado (default 'Finalizado'), precio, flete_bruto, gastos_extras, engrase`
- `estado`: texto libre, default `'Finalizado'`
- `precio`: numérico, puede ser 0 — `tarifa_flete` tiene los datos reales del flete
- `tarifa_flete_calculada`: **NO existe en DB** — es campo client-side, usar `|| Number(v.tarifa_flete) || 0`
- `pago_chofer_realizado`: **NO existe en DB**

### `cuenta_corriente`
`id, cliente_id, viaje_id, fecha, detalle, tipo_movimiento, debe, haber, estado_gestion, remito`
- `remito` (text): número de remito asociado al movimiento
- `estado_gestion`: `'por_cobrar'` | `'maestro'` | null

### `cuenta_corriente_choferes`
`chofer_id, viaje_id, monto, ...`

### `movimientos_caja`
`id, fecha, tipo ('ingreso'|'egreso'), tipo_cuenta ('caja'|'banco'), categoria, descripcion, monto, cliente_id, chofer_id, camion_id`

### `cargas_combustible`
`id, fecha, camion_id, chofer_id, litros, precio_litro, total, pagado`

### `facturas`
`id, tipo_comprobante (text: '1'=A, '6'=B, '11'=C), punto_venta, numero_comprobante, fecha_comprobante, importe_total, importe_neto, importe_iva, alicuota_iva, condicion_iva_receptor, cuit_receptor, concepto, descripcion, cliente_id, estado ('emitida'|'error'|'pendiente'|'manual'), cae, cae_vto`
- `tipo_comprobante` es **text** en DB, guarda strings `'1'`, `'6'`, `'11'`
- Columna vencimiento CAE es **`cae_vto`** — NO `vencimiento_cae`

### `remitos`
`id, cliente_id, numero_remito, facturado, factura_id, viaje_id, foto_url, estado_cobro, estado`

### `gastos_camion`
`id, camion_id, fecha, descripcion, monto`
- **NO tiene columna** `tipo`

### `costos_fijos`
`id, nombre, descripcion, tipo ('costo'|'impuesto'), monto, activo, recurrente, frecuencia, proximo_pago, pagado, notas, tipo_cuenta (default 'banco'), es_anual, categoria, mes_valido, anio_valido`
- Tiene `notas`, `tipo_cuenta`, `es_anual`, `categoria`, `mes_valido`, `anio_valido` — usar directamente sin stripping

### `multas`
`id, fecha, detalle, monto, infractor (NOT NULL), chofer_id, camion_id, estado ('pendiente'|'pagada')`
- **NO tiene columnas** `descripcion` ni `pagado`
- `infractor` es NOT NULL — siempre incluirlo en inserts

### `tareas`
`id, titulo, descripcion, fecha_inicio, fecha_vencimiento, es_recurrente, periodo_recurrencia, afecta_caja, monto, categoria, completada, fecha_completada (timestamp), notificacion_enviada (boolean default false), dias_anticipacion (int default 3)`
- `dias_anticipacion`: días antes del vencimiento para notificar (default 3)
- `fecha_completada`: timestamp, se setea al completar
- `notificacion_enviada`: marcar true después de enviar notificación

### `destinos_cliente`
`id, cliente_id, nombre, lat, lng, tarifa_flete, km_desde_base, lts_estimados, es_origen, activo (default true), notas, direccion`
- Coordenadas: `lat`/`lng` (NO `latitud`/`longitud`)
- Filtrar disponibles con `.eq('activo', true)`
- `km_desde_base`/`lts_estimados`: autocompletar km/litros en formulario de viajes

### `reparto_viaje`
`id, viaje_id, destino_id, orden, monto_flete_parcial, nro_remito_parcial`
- `monto_flete` es campo de formulario client-side → mapea a `monto_flete_parcial` al insertar en DB

### `configuracion`
`id, arca_cuit, arca_certificado, arca_clave_privada, arca_entorno, arca_punto_venta, arca_condicion_iva, arca_razon_social, traccar_url, traccar_email, traccar_password, traccar_activo`

### Tablas Adicionales (existen en DB)
`adelantos_chofer, cheques_diferidos, compras, cuentas_bancarias, cuentas_caja, deudas_chofer, estaciones_combustible, facturas_arca, historial_service_camiones, impuestos_config, impuestos_pagos, liquidaciones, liquidaciones_chofer, mantenimiento_recordatorios, mantenimientos, movimientos, recordatorios, retenciones, seguros, semirremolques, siniestros, stock_items, stock_movimientos, sueldo_novedades, tarifas_estandar, viajes_auditoria`

---

## Sistema de Temas (Dark / Light)

- **ThemeProvider** (`src/components/ThemeProvider.tsx`): Context React, guarda en `localStorage('erp-theme')`
- **Flash prevention**: inline `<script>` en `<head>` que aplica clase `light` antes de hidratación
- **CSS overrides** en `globals.css`: `html.light .bg-\[\#141c28\]`, etc. con `!important`
- Colores dark: bg=`#141c28`, cards=`#1a2537`, elevated=`#243248`
- Colores light: bg=`#c8cfd8`, cards=`#d8dfe8`, elevated=`#bcc4ce`
- Toggle en Navbar: íconos `Sun` / `Moon` de lucide-react
- Hook: `const { theme, toggle } = useTheme()`

---

## cajaService — Gateway Financiero Central

**REGLA: Todos los movimientos de dinero deben pasar por `cajaService.ts`**, nunca insertar directo en `movimientos_caja`.

Funciones principales:
- `registrarCobroFlete()` — Cobro de flete a cliente
- `registrarPagoChofer()` — Liquidación a chofer
- `registrarCombustible()` — Gasto combustible
- `registrarMantenimiento()` — Gasto mecánico
- `registrarPagoMulta()` — Pago de multa
- `registrarPagoSeguro()` — Cuota seguro
- `registrarPagoImpuesto()` — Pago impuesto
- `anularMovimiento()` — Reversa de movimiento

---

## Facturación AFIP / ARCA

- Los API routes en `/api/arca/` manejan la comunicación con AFIP
- Token WSAA se cachea 12 horas en memoria del servidor
- `tipo_comprobante` se guarda como **número** en DB: 1=A, 6=B, 11=C
- `FacturaManualModal` usa `TIPO_MAP` para convertir letra → número antes de guardar
- Constraint DB `facturas_estado_check` permite: `'emitida'`, `'error'`, `'pendiente'`, `'manual'`
- Constraint `facturas_tipo_comprobante_check` fue eliminado para flexibilidad

---

## Alertas en Navbar

La Navbar consulta al cargar:
- **Choferes**: `vto_licencia` → alerta si vence en ≤30 días o ya venció
- **Camiones**: `km_actual - km_ultimo_service` → warning ≥25.000 km, crítico ≥32.000 km
- **Camiones**: `vto_rto` y `vto_senasa` → alertas de vencimiento ≤30 días

---

## Patrones de Código

```tsx
// Patrón estándar de página
'use client'
export const dynamic = 'force-dynamic'

// Inicialización Supabase en páginas
import { getSupabase } from '@/lib/supabase'
const supabase = getSupabase()

// En algunos archivos legacy:
const supabase = (supabaseLib as any).supabase || ((supabaseLib as any).getSupabase?.()) || supabaseLib
```

---

## Paleta de Colores del Design System

```
Fondos:     #141c28 (base)  #1a2537 (cards)  #243248 (elevated)
Texto:      text-slate-100 / text-slate-200 / text-slate-400 / text-slate-500
Acento:     sky-500 (azul principal)
Éxito:      emerald-500
Peligro:    rose-500
Warning:    amber-500
Info:       indigo-500
```

Clases de botones típicas:
- Primario: `bg-sky-600 hover:bg-sky-500 text-white`
- Peligro: `bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white`
- Neutro: `bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10`

Bordes redondeados: `rounded-[2rem]` o `rounded-[2.5rem]` (estilo característico)

---

## Scripts SQL

### Limpiar todos los datos
Ejecutar `scripts/1_limpiar_datos.sql` en Supabase → SQL Editor

### Cargar datos de prueba
Ejecutar `scripts/2_datos_prueba.sql` **después** del anterior.
Incluye: 5 clientes, 5 camiones, 5 choferes, 10 viajes, combustible, caja/banco, costos, tareas, remitos, multas, facturas.

UUIDs usados en seed:
- Clientes: `c1000000-...-00000001` a `00000005`
- Camiones: `a2000000-...-00000001` a `00000005`
- Choferes: `b3000000-...-00000001` a `00000005`
- Viajes:   `d4000000-...-00000001` a `00000010`
- Combustible: `e5000000-...-00000001` a `00000010`
- Remitos:  `f6000000-...-00000001` a `00000005`

---

## Errores Conocidos y Sus Fixes

| Error | Causa | Fix |
|-------|-------|-----|
| `column "tipo" does not exist` en gastos_camion | La tabla no tiene campo tipo | Solo: `camion_id, fecha, descripcion, monto` |
| `column "descripcion"/"pagado" does not exist` en multas | Columnas reales son otras | Usar `detalle`, `infractor` (NOT NULL), `estado` |
| `facturas_estado_check violation` | Constraint no incluía 'manual' | ALTER TABLE para agregar 'manual' al constraint |
| `facturas_tipo_comprobante_check violation` | tipo_comprobante='X' no existe | Eliminar constraint; tipo_comprobante es text ('1'/'6'/'11') |
| `column "vencimiento_cae" does not exist` en facturas | Columna real es `cae_vto` | Usar `cae_vto` en inserts y selects |
| `tarifa_flete_calculada` undefined | Campo calculado client-side, no existe en DB | Usar `|| Number(v.tarifa_flete) || 0` como fallback |
[
  {
    "table_name": "adelantos_chofer",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "motivo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "descontado",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "adelantos_chofer",
    "column_name": "liquidacion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "camiones",
    "column_name": "patente",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "modelo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "km_actual",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "camiones",
    "column_name": "km_ultimo_service",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "camiones",
    "column_name": "vto_rto",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "vto_senasa",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'Disponible'::text"
  },
  {
    "table_name": "camiones",
    "column_name": "operador_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "camiones",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "lts_consumidos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "camiones",
    "column_name": "consumo_medio",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "35"
  },
  {
    "table_name": "camiones",
    "column_name": "traccar_device_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "camiones",
    "column_name": "usa_gps",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "camiones",
    "column_name": "km_proximo_service",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "15000"
  },
  {
    "table_name": "camiones",
    "column_name": "estado_operativo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'disponible'::text"
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "litros",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "precio_litro",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "total",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "estacion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'YPF'::text"
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "remito_nro",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "pagado",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "fecha_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "movimiento_caja_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "responsable_externo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cargas_combustible",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "numero_cheque",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "banco",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "fecha_emision",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "fecha_vencimiento",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cheques_diferidos",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'pendiente'::text"
  },
  {
    "table_name": "choferes",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "choferes",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "dni",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "telefono",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "licencia",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "vto_licencia",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "km_recorridos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "choferes",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'Disponible'::text"
  },
  {
    "table_name": "choferes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "choferes",
    "column_name": "foto_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "lts_consumidos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "choferes",
    "column_name": "fecha_nacimiento",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "fecha_ingreso",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "domicilio",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'chofer'::text"
  },
  {
    "table_name": "choferes",
    "column_name": "tipo_contrato",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'relacion_dependencia'::text"
  },
  {
    "table_name": "choferes",
    "column_name": "sueldo_base",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "choferes",
    "column_name": "cuil",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "nro_licencia",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "clase_licencia",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "vto_linti",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "vto_libreta_sanitaria",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "choferes",
    "column_name": "vto_psicofisico",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "clientes",
    "column_name": "razon_social",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "cuit",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "nombre_contacto",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "telefono",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "direccion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "ruta_origen",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "ruta_destino",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "ruta_km_estimados",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clientes",
    "column_name": "tarifa_flete",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clientes",
    "column_name": "pago_chofer",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clientes",
    "column_name": "lts_gasoil_estimado",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clientes",
    "column_name": "costo_descarga",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clientes",
    "column_name": "desgaste_por_km",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clientes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "clientes",
    "column_name": "credito_maximo",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clientes",
    "column_name": "dias_credito",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "30"
  },
  {
    "table_name": "clientes",
    "column_name": "condicion_iva",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'CF'::text"
  },
  {
    "table_name": "compras",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "compras",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "compras",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'general'::text"
  },
  {
    "table_name": "compras",
    "column_name": "proveedor",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "nro_factura",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "comprobante_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "cantidad",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "1"
  },
  {
    "table_name": "compras",
    "column_name": "unidad",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'unidad'::text"
  },
  {
    "table_name": "compras",
    "column_name": "precio_unitario",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "compras",
    "column_name": "monto_total",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "compras",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "tipo_pago",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'caja'::text"
  },
  {
    "table_name": "compras",
    "column_name": "impacta_caja",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "compras",
    "column_name": "caja_mov_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "agrega_stock",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "compras",
    "column_name": "stock_item_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "compras",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "compras",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "id",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "1"
  },
  {
    "table_name": "configuracion",
    "column_name": "precio_gasoil",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "configuracion",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "configuracion",
    "column_name": "tipo_cambio_dolar",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "1100"
  },
  {
    "table_name": "configuracion",
    "column_name": "notif_email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "notif_whatsapp",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_cuit",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_razon_social",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_punto_venta",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "1"
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_condicion_iva",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'RI'::text"
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_certificado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_clave_privada",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "arca_entorno",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'homologacion'::text"
  },
  {
    "table_name": "configuracion",
    "column_name": "traccar_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "traccar_email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "traccar_password",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "configuracion",
    "column_name": "traccar_activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "monto",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "mes_valido",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "anio_valido",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'Sin nombre'::text"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "es_anual",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'costo'::text"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "frecuencia",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'mensual'::text"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "proximo_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "ultimo_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "monto_ultimo_pago",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "costos_fijos",
    "column_name": "recurrente",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "pagado",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "costos_fijos",
    "column_name": "tipo_cuenta",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'banco'::text"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "remito_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "tipo_movimiento",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "detalle",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "debe",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "haber",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "estado_gestion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'maestro'::text"
  },
  {
    "table_name": "cuenta_corriente",
    "column_name": "remito",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "detalle",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "tipo_movimiento",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "pagado",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cuenta_corriente_choferes",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "banco",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'cuenta_corriente'::text"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "nro_cuenta",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "cbu",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "moneda",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'ARS'::text"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "limite",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "saldo_actual",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "cuotas_totales",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "cuotas_pagadas",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "valor_cuota",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "vto_leasing",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "cuentas_bancarias",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_caja",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "cuentas_caja",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cuentas_caja",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cuentas_caja",
    "column_name": "saldo",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "cuentas_caja",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "direccion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "lat",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "lng",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "tarifa_flete",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "km_desde_base",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "lts_estimados",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "es_origen",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "destinos_cliente",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "concepto",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "pagado",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "deudas_chofer",
    "column_name": "fecha_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "estaciones_combustible",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "estaciones_combustible",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "estaciones_combustible",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "estaciones_combustible",
    "column_name": "ubicacion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "estaciones_combustible",
    "column_name": "tipo_cuenta",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'contado'::text"
  },
  {
    "table_name": "estaciones_combustible",
    "column_name": "saldo_actual",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "facturas",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "facturas",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "facturas",
    "column_name": "tipo_comprobante",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "punto_venta",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "1"
  },
  {
    "table_name": "facturas",
    "column_name": "numero_comprobante",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "fecha_comprobante",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "facturas",
    "column_name": "cae",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "cae_vto",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'pendiente'::text"
  },
  {
    "table_name": "facturas",
    "column_name": "error_msg",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "cuit_receptor",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "razon_social_receptor",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "condicion_iva_receptor",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'CF'::text"
  },
  {
    "table_name": "facturas",
    "column_name": "importe_neto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "facturas",
    "column_name": "importe_iva",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "facturas",
    "column_name": "importe_total",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "facturas",
    "column_name": "alicuota_iva",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "21"
  },
  {
    "table_name": "facturas",
    "column_name": "concepto",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "2"
  },
  {
    "table_name": "facturas",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas",
    "column_name": "remito_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "facturas_arca",
    "column_name": "remito_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "tipo_comprobante",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "punto_venta",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "numero_factura",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "cae",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "vto_cae",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "facturas_arca",
    "column_name": "importe_total",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "facturas_arca",
    "column_name": "iva",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "facturas_arca",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "gastos_camion",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "gastos_camion",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "gastos_camion",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "gastos_camion",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "gastos_camion",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "gastos_camion",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "gastos_camion",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "fecha_service",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "km_service",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "costo",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "mecanico",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "historial_service_camiones",
    "column_name": "proximo_service_km",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "impuestos_config",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "impuestos_config",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "impuestos_config",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "impuestos_config",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "impuestos_config",
    "column_name": "alicuota",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "impuestos_config",
    "column_name": "monto_fijo",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "impuestos_config",
    "column_name": "base_calculo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'facturacion'::text"
  },
  {
    "table_name": "impuestos_config",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "impuestos_config",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "impuesto_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "periodo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "monto_calculado",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "monto_pagado",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "fecha_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "caja_mov_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pendiente'::text"
  },
  {
    "table_name": "impuestos_pagos",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "liquidaciones",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "liquidaciones",
    "column_name": "periodo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "liquidaciones",
    "column_name": "sueldo_base",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "total_viaticos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "total_extras",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "total_horas_espera",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "total_descuentos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "total_adelantos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "neto_a_pagar",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'borrador'::text"
  },
  {
    "table_name": "liquidaciones",
    "column_name": "fecha_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "liquidaciones",
    "column_name": "caja_mov_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "liquidaciones",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "periodo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "total_bruto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "adelantos",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "descuentos",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "total_neto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'pendiente'::text"
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "fecha_pago",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "liquidaciones_chofer",
    "column_name": "viajes_ids",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "cada_km",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "km_proximo",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "margen_alerta_km",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "500"
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "ultimo_realizado_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimiento_recordatorios",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "semirremolque_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "taller",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "km_al_momento",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "tipo_pago",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'caja'::text"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "caja_mov_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "repuestos_usados",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'[]'::jsonb"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'realizado'::text"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "mantenimientos",
    "column_name": "nro_comprobante",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "mantenimientos",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "movimientos",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "movimientos",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "movimientos",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos",
    "column_name": "numero_comprobante",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "tipo_cuenta",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "referencia",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "origen",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'manual'::text"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "referencia_origen_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "modulo_origen",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'manual'::text"
  },
  {
    "table_name": "movimientos_caja",
    "column_name": "comprobante_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "multas",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "multas",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "multas",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "multas",
    "column_name": "infractor",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "detalle",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'pendiente'::text"
  },
  {
    "table_name": "multas",
    "column_name": "fecha_pago",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "caja_mov_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "descuenta_a_chofer",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "multas",
    "column_name": "monto_descuento_chofer",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "multas",
    "column_name": "nro_acta",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "multas",
    "column_name": "organismo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "recordatorios",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "recordatorios",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "recordatorios",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "remitos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "remitos",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "remitos",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "remitos",
    "column_name": "numero_remito",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "remitos",
    "column_name": "foto_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "remitos",
    "column_name": "estado_cobro",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'Pendiente'::text"
  },
  {
    "table_name": "remitos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "remitos",
    "column_name": "factura_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "remitos",
    "column_name": "facturado",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "remitos",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'generado'::text"
  },
  {
    "table_name": "reparto_viaje",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "reparto_viaje",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "reparto_viaje",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "reparto_viaje",
    "column_name": "monto_flete_parcial",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "reparto_viaje",
    "column_name": "nro_remito_parcial",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'PENDIENTE'::text"
  },
  {
    "table_name": "retenciones",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "retenciones",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "retenciones",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retenciones",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retenciones",
    "column_name": "numero_certificado",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retenciones",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retenciones",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retenciones",
    "column_name": "porcentaje",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "seguros",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "seguros",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "aseguradora",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "nro_poliza",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "semirremolque_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "prima_mensual",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "seguros",
    "column_name": "prima_anual",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "seguros",
    "column_name": "suma_asegurada",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "seguros",
    "column_name": "franquicia",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "seguros",
    "column_name": "vto_poliza",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "fecha_inicio",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "seguros",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "seguros",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "semirremolques",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "semirremolques",
    "column_name": "patente",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'frigorifico'::text"
  },
  {
    "table_name": "semirremolques",
    "column_name": "marca",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "modelo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "año",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "vto_senasa",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "vto_revision",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "vto_habilitacion",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'activo'::text"
  },
  {
    "table_name": "semirremolques",
    "column_name": "camion_asignado",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "semirremolques",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "siniestros",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "siniestros",
    "column_name": "seguro_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "semirremolque_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "lugar",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "siniestros",
    "column_name": "costo_reparacion",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "siniestros",
    "column_name": "recupero_seguro",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "siniestros",
    "column_name": "costo_neto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'abierto'::text"
  },
  {
    "table_name": "siniestros",
    "column_name": "nro_expediente",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "caja_mov_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "siniestros",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_items",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "stock_items",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "stock_items",
    "column_name": "nombre",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "stock_items",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_items",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'repuesto'::text"
  },
  {
    "table_name": "stock_items",
    "column_name": "unidad",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'unidad'::text"
  },
  {
    "table_name": "stock_items",
    "column_name": "codigo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_items",
    "column_name": "cantidad_actual",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "stock_items",
    "column_name": "cantidad_minima",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "stock_items",
    "column_name": "cantidad_maxima",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "stock_items",
    "column_name": "precio_unitario",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "stock_items",
    "column_name": "activo",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "stock_items",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "stock_item_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "cantidad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "cantidad_antes",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "cantidad_despues",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "motivo",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "compra_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "mantenimiento_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "stock_movimientos",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "periodo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "cantidad",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "1"
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "es_descuento",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "sueldo_novedades",
    "column_name": "notas",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "tareas",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "tareas",
    "column_name": "titulo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "categoria",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "fecha_vencimiento",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "dias_anticipacion",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "3"
  },
  {
    "table_name": "tareas",
    "column_name": "es_recurrente",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "table_name": "tareas",
    "column_name": "periodo_recurrencia",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "completada",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "table_name": "tareas",
    "column_name": "fecha_completada",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "notificacion_enviada",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "table_name": "tareas",
    "column_name": "prioridad",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'media'::text"
  },
  {
    "table_name": "tareas",
    "column_name": "recurrente",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "tareas",
    "column_name": "frecuencia_dias",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "afecta_caja",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "tareas",
    "column_name": "monto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tareas",
    "column_name": "fecha_inicio",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tarifas_estandar",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "tarifas_estandar",
    "column_name": "origen",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tarifas_estandar",
    "column_name": "destino",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tarifas_estandar",
    "column_name": "monto_sugerido",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tarifas_estandar",
    "column_name": "moneda",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'ARS'::text"
  },
  {
    "table_name": "tarifas_estandar",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "viajes",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "viajes",
    "column_name": "fecha",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_name": "viajes",
    "column_name": "cliente_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "camion_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "chofer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "origen",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "destino",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "km_recorridos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "flete_bruto",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "pago_chofer",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "lts_gasoil",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "precio_gasoil",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "gastos_extras",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'Finalizado'::text"
  },
  {
    "table_name": "viajes",
    "column_name": "observaciones",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "viajes",
    "column_name": "tarifa_flete",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "costo_descarga",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "es_retorno",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "viajes",
    "column_name": "engrase",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "viajes",
    "column_name": "desgaste_por_km",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "modo_tracking",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'manual'::text"
  },
  {
    "table_name": "viajes",
    "column_name": "hora_salida",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "hora_llegada",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "km_teoricos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "litros_teoricos",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "km_reales",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "traccar_trip_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "hubo_desvio",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "viajes",
    "column_name": "pct_desvio",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "litros_reales",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "consumo_real",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "alerta_combustible",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "viajes",
    "column_name": "pct_exceso_lts",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "km_inicio_camion",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes",
    "column_name": "km_fin_camion",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "semirremolque_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes",
    "column_name": "precio",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "viaje_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "usuario_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "accion",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "campos_modificados",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "viajes_auditoria",
    "column_name": "timestamp",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]





---
  Lo que tenés que hacer vos en Supabase (no se puede desde código)    

  🔴 CRÍTICO — Row Level Security (RLS)

  En Supabase → Authentication → Policies, activá RLS en TODAS las     
  tablas. Mientras el sistema sea de un solo usuario, la política más  
  simple es:
  -- Ejecutar para cada tabla importante
  ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Solo usuarios autenticados" ON clientes
    FOR ALL USING (auth.role() = 'authenticated');
  -- Repetir para: viajes, cuenta_corriente, camiones, choferes, etc.  

  🔴 CRÍTICO — Variable de entorno faltante

  En tu .env.local agregá:
  NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
  La SERVICE_ROLE_KEY la encontrás en Supabase → Settings → API →      
  service_role.

  🟡 MEDIO — Claves AFIP en la DB

  Las claves privadas de AFIP (arca_clave_privada, arca_certificado)   
  están guardadas en texto plano en la tabla configuracion. Por ahora  
  es aceptable para un sistema interno, pero idealmente deberían estar 
  en variables de entorno en producción.

✻ Baked for 4m 59s

───────────────────────────────────────────────────────────────────────
❯  
───────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (meta+m to cycle)

  Lo que vos tenés que hacer (5 minutos)

  1. Supabase → SQL Editor → ejecutar scripts/4_rls_security.sql       
  Esto protege todas las tablas con RLS de un saque.

  2. Agregar a .env.local:
  NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
  SUPABASE_SERVICE_ROLE_KEY=eyJ...  (Settings → API → service_role en  
  Supabase)

  ---
  Ahora voy a revisar el responsive para notebooks.

✻ Brewed for 4m 1s

❯ dale hacelo pq realmente esta mal                                                        