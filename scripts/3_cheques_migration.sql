-- Migración: extender tabla cheques_diferidos para soporte completo
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE cheques_diferidos
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'recibido',
  ADD COLUMN IF NOT EXISTS destinatario text,
  ADD COLUMN IF NOT EXISTS movimiento_caja_id uuid,
  ADD COLUMN IF NOT EXISTS fecha_cobro date,
  ADD COLUMN IF NOT EXISTS notas text;

-- Actualizar constraint de estado para incluir todos los estados posibles
-- (pendiente ya es el default)
-- estados válidos: pendiente | cobrado | rechazado | pagado | vencido

-- Asegurar que registros existentes tengan tipo = 'recibido'
UPDATE cheques_diferidos SET tipo = 'recibido' WHERE tipo IS NULL;
