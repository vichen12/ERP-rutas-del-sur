-- ══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — DallapeSystems ERP
-- Ejecutar en Supabase → SQL Editor
-- Protege TODAS las tablas: solo usuarios autenticados pueden acceder
-- ══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────
-- FUNCIÓN HELPER: verificar si el usuario está autenticado
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS boolean AS $$
  SELECT auth.role() = 'authenticated';
$$ LANGUAGE sql STABLE;

-- ──────────────────────────────────────────────────────────────────────
-- MACRO para aplicar RLS a una tabla (habilitar + policy ALL)
-- Se aplica tabla por tabla abajo
-- ──────────────────────────────────────────────────────────────────────

-- TABLAS PRINCIPALES
ALTER TABLE clientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE camiones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE choferes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuenta_corriente     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuenta_corriente_choferes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_combustible   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_camion        ENABLE ROW LEVEL SECURITY;
ALTER TABLE remitos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_arca        ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_fijos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE multas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques_diferidos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion        ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinos_cliente     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reparto_viaje        ENABLE ROW LEVEL SECURITY;

-- TABLAS SECUNDARIAS
ALTER TABLE adelantos_chofer     ENABLE ROW LEVEL SECURITY;
ALTER TABLE deudas_chofer        ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones_chofer ENABLE ROW LEVEL SECURITY;
ALTER TABLE sueldo_novedades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguros              ENABLE ROW LEVEL SECURITY;
ALTER TABLE siniestros           ENABLE ROW LEVEL SECURITY;
ALTER TABLE semirremolques       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimiento_recordatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_service_camiones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movimientos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras              ENABLE ROW LEVEL SECURITY;
ALTER TABLE retenciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques_diferidos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_bancarias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_caja         ENABLE ROW LEVEL SECURITY;
ALTER TABLE estaciones_combustible ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_estandar     ENABLE ROW LEVEL SECURITY;
ALTER TABLE impuestos_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE impuestos_pagos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes_auditoria     ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos          ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────
-- POLÍTICAS: Solo usuarios autenticados pueden operar
-- ──────────────────────────────────────────────────────────────────────

-- Helper: drop & create para idempotencia (se puede re-ejecutar sin error)
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'clientes', 'camiones', 'choferes', 'viajes',
    'cuenta_corriente', 'cuenta_corriente_choferes', 'movimientos_caja',
    'cargas_combustible', 'gastos_camion', 'remitos', 'facturas',
    'facturas_arca', 'costos_fijos', 'multas', 'tareas', 'cheques_diferidos',
    'configuracion', 'destinos_cliente', 'reparto_viaje',
    'adelantos_chofer', 'deudas_chofer', 'liquidaciones', 'liquidaciones_chofer',
    'sueldo_novedades', 'seguros', 'siniestros', 'semirremolques',
    'mantenimientos', 'mantenimiento_recordatorios', 'historial_service_camiones',
    'stock_items', 'stock_movimientos', 'compras', 'retenciones',
    'cuentas_bancarias', 'cuentas_caja', 'estaciones_combustible',
    'tarifas_estandar', 'impuestos_config', 'impuestos_pagos',
    'viajes_auditoria', 'movimientos'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    -- Eliminar policy existente si hay (idempotente)
    EXECUTE format('DROP POLICY IF EXISTS "Solo usuarios autenticados" ON %I', tbl);
    -- Crear policy: cualquier usuario autenticado puede SELECT/INSERT/UPDATE/DELETE
    EXECUTE format(
      'CREATE POLICY "Solo usuarios autenticados" ON %I FOR ALL USING (auth.role() = ''authenticated'')',
      tbl
    );
  END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN: listar todas las tablas con RLS habilitado
-- ──────────────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
