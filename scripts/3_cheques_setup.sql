-- ══════════════════════════════════════════════════════════════════════
-- CHEQUES SETUP — Ejecutar TODO esto en Supabase → SQL Editor
-- Hace 3 cosas en orden:
--   1. Migra la tabla cheques_diferidos (nuevas columnas + fix constraints)
--   2. Carga 10 cheques de prueba
-- ══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────
-- PASO 1: MIGRACIÓN DE TABLA
-- ──────────────────────────────────────────────────────────────────────

-- Nuevas columnas necesarias para el módulo
ALTER TABLE cheques_diferidos
  ADD COLUMN IF NOT EXISTS tipo          text DEFAULT 'recibido',
  ADD COLUMN IF NOT EXISTS destinatario  text,
  ADD COLUMN IF NOT EXISTS movimiento_caja_id uuid,
  ADD COLUMN IF NOT EXISTS fecha_cobro   date,
  ADD COLUMN IF NOT EXISTS notas         text;

-- Permitir cliente_id NULL (los cheques emitidos no siempre tienen cliente en el sistema)
ALTER TABLE cheques_diferidos ALTER COLUMN cliente_id DROP NOT NULL;

-- Fix constraint de estado (el original solo permitía 'pendiente')
ALTER TABLE cheques_diferidos DROP CONSTRAINT IF EXISTS cheques_diferidos_estado_check;
ALTER TABLE cheques_diferidos ADD CONSTRAINT cheques_diferidos_estado_check
  CHECK (estado IN ('pendiente', 'cobrado', 'pagado', 'rechazado', 'vencido'));

-- Marcar registros viejos como 'recibido' si no tienen tipo
UPDATE cheques_diferidos SET tipo = 'recibido' WHERE tipo IS NULL;

-- ──────────────────────────────────────────────────────────────────────
-- PASO 2: DATOS DE PRUEBA (10 cheques)
-- Requiere tener cargado el script 2_datos_prueba.sql (clientes aa000000-...)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO cheques_diferidos (
  id, tipo, cliente_id, numero_cheque, banco, monto,
  fecha_emision, fecha_vencimiento, estado, destinatario, notas
) VALUES

-- RECIBIDOS — cheques que nos dieron los clientes
('cc000000-0000-0000-0000-000000000001',
 'recibido', 'aa000000-0000-0000-0000-000000000001',
 '00012345', 'BANCO NACION', 2100000,
 '2026-03-01', '2026-04-10', 'pendiente', NULL,
 'PAGO FLETE FEBRERO'),

('cc000000-0000-0000-0000-000000000002',
 'recibido', 'aa000000-0000-0000-0000-000000000002',
 '00056789', 'BANCO GALICIA', 2000000,
 '2026-03-05', '2026-03-30', 'pendiente', NULL,
 'PAGO FLETE MARZO - VENCE EN POCOS DIAS'),

('cc000000-0000-0000-0000-000000000003',
 'recibido', 'aa000000-0000-0000-0000-000000000003',
 '00098765', 'BANCO SUPERVIELLE', 1800000,
 '2026-02-15', '2026-03-20', 'pendiente', NULL,
 'FLETE ROSARIO'),

('cc000000-0000-0000-0000-000000000004',
 'recibido', 'aa000000-0000-0000-0000-000000000004',
 '00011111', 'BANCO PROVINCIA', 1650000,
 '2026-02-20', '2026-03-15', 'cobrado', NULL,
 'YA COBRADO'),

('cc000000-0000-0000-0000-000000000005',
 'recibido', 'aa000000-0000-0000-0000-000000000005',
 '00022222', 'BANCO NACION', 1900000,
 '2026-01-10', '2026-02-28', 'pendiente', NULL,
 'CHEQUE VENCIDO SIN COBRAR'),

('cc000000-0000-0000-0000-000000000006',
 'recibido', 'aa000000-0000-0000-0000-000000000006',
 '00033333', 'BANCO BBVA', 2200000,
 '2026-03-10', '2026-05-01', 'pendiente', NULL,
 'PLAZO LARGO'),

-- EMITIDOS — cheques que nosotros dimos a proveedores
('cc000000-0000-0000-0000-000000000007',
 'emitido', NULL,
 '00099001', 'BANCO NACION', 850000,
 '2026-03-01', '2026-03-31', 'pendiente',
 'TALLERES RODRIGUEZ S.R.L.', 'REPARACION MOTOR'),

('cc000000-0000-0000-0000-000000000008',
 'emitido', NULL,
 '00099002', 'BANCO NACION', 430000,
 '2026-02-20', '2026-03-25', 'pagado',
 'NEUMATICOS DEL OESTE', 'CUBIERTAS EIXO TRASERO'),

('cc000000-0000-0000-0000-000000000009',
 'emitido', NULL,
 '00099003', 'BANCO NACION', 1200000,
 '2026-03-15', '2026-04-20', 'pendiente',
 'YPF S.A.', 'DEUDA COMBUSTIBLE MARZO'),

('cc000000-0000-0000-0000-000000000010',
 'emitido', NULL,
 '00099004', 'BANCO NACION', 320000,
 '2026-01-05', '2026-02-10', 'pendiente',
 'LUBRICANTES CUYANOS', 'ACEITES Y FILTROS - VENCIDO');
