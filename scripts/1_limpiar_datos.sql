-- ══════════════════════════════════════════════════════════
-- SCRIPT 1: LIMPIAR TODOS LOS DATOS
-- Ejecutar en Supabase → SQL Editor
-- NO borra tablas ni columnas, solo registros
-- ══════════════════════════════════════════════════════════

DELETE FROM reparto_viaje;
DELETE FROM cuenta_corriente;
DELETE FROM cuenta_corriente_choferes;
DELETE FROM movimientos_caja;
DELETE FROM facturas_arca;
DELETE FROM facturas;
DELETE FROM remitos;
DELETE FROM gastos_camion;
DELETE FROM cargas_combustible;
DELETE FROM costos_fijos;
DELETE FROM multas;
DELETE FROM tareas;
DELETE FROM recordatorios;
DELETE FROM destinos_cliente;
DELETE FROM adelantos_chofer;
DELETE FROM cheques_diferidos;
DELETE FROM impuestos_pagos;
DELETE FROM viajes;
DELETE FROM clientes;
DELETE FROM choferes;
DELETE FROM camiones;

SELECT 'Limpieza completa OK' AS resultado;
