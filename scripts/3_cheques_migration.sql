-- Migración: extender tabla cheques_diferidos para soporte completo
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE cheques_diferidos
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'recibido',
  ADD COLUMN IF NOT EXISTS destinatario text,
  ADD COLUMN IF NOT EXISTS movimiento_caja_id uuid,
  ADD COLUMN IF NOT EXISTS fecha_cobro date,
  ADD COLUMN IF NOT EXISTS notas text;

-- Permitir cliente_id NULL (cheques emitidos pueden no tener cliente)
ALTER TABLE cheques_diferidos ALTER COLUMN cliente_id DROP NOT NULL;

-- Actualizar constraint de estado para incluir todos los estados posibles
-- estados válidos: pendiente | cobrado | rechazado | pagado | vencido
ALTER TABLE cheques_diferidos DROP CONSTRAINT IF EXISTS cheques_diferidos_estado_check;
ALTER TABLE cheques_diferidos ADD CONSTRAINT cheques_diferidos_estado_check
  CHECK (estado IN ('pendiente', 'cobrado', 'pagado', 'rechazado', 'vencido'));

-- Asegurar que registros existentes tengan tipo = 'recibido'
UPDATE cheques_diferidos SET tipo = 'recibido' WHERE tipo IS NULL;
