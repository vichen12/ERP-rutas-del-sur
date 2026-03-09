'use client'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Truck, UserCircle, MapPin,
  Landmark, Fuel, DollarSign, ClipboardList, Package,
  FileText, Receipt, Printer, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Info, BookOpen
} from 'lucide-react'

interface Seccion {
  id: string
  icon: any
  titulo: string
  color: string
  resumen: string
  pasos: string[]
  tips?: string[]
  advertencias?: string[]
}

const SECCIONES: Seccion[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    titulo: 'Dashboard',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    resumen: 'Panel central de control con KPIs financieros, operativos y alertas en tiempo real.',
    pasos: [
      'Al ingresar al sistema, el Dashboard es la pantalla principal.',
      'Muestra ingresos, egresos y margen del período seleccionado.',
      'Los KPIs de flota indican km recorridos, consumo y rendimiento.',
      'Las alertas de vencimiento (licencias, RTO, SENASA) aparecen en el ícono de campana arriba a la derecha.',
      'Usá los filtros de fecha para ver períodos específicos.',
    ],
    tips: [
      'Revisá el Dashboard cada mañana para ver el estado operativo.',
      'Si el margen baja al rojo, revisá la sección de Costos.',
    ],
  },
  {
    id: 'clientes',
    icon: Users,
    titulo: 'Clientes',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    resumen: 'Gestión completa de clientes: cuenta corriente, deudas, remitos y facturación.',
    pasos: [
      'Accedé desde el menú "Clientes".',
      'Para agregar un cliente, hacé clic en "Nuevo Cliente" y completá los datos (nombre, CUIT, teléfono, dirección).',
      'Cada cliente tiene una cuenta corriente donde se registran sus movimientos.',
      'Desde el perfil de un cliente podés ver sus viajes, remitos y facturas asociadas.',
      'El saldo en rojo indica que el cliente tiene deuda pendiente.',
      'Para registrar un cobro, entrá al cliente y usá "Registrar Movimiento".',
    ],
    tips: [
      'Completá el CUIT del cliente antes de emitir facturas.',
      'Configurá la tarifa de flete por defecto para agilizar la carga de viajes.',
    ],
    advertencias: [
      'Eliminá un cliente solo si no tiene viajes o movimientos asociados.',
    ],
  },
  {
    id: 'flota',
    icon: Truck,
    titulo: 'Flota / Camiones',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    resumen: 'Control de la flota: KM, service, vencimientos de documentación y gastos.',
    pasos: [
      'Entrá a "Flota" para ver todos los camiones.',
      'Cada camión muestra su patente, KM actual, KM desde último service y estado de documentos.',
      'Para agregar un camión, clic en "Nueva Unidad" y cargá patente, KM actuales y fechas de vencimiento.',
      'Actualizá los KM actuales luego de cada viaje o semanalmente.',
      'El sistema alertará cuando el camión se acerque a los 30.000 KM de service.',
      'En "Gastos" podés registrar reparaciones, repuestos y otros egresos por unidad.',
    ],
    tips: [
      'Cargá el KM de último service cada vez que realices el mantenimiento.',
      'Revisá los vencimientos de RTO y SENASA con anticipación.',
    ],
    advertencias: [
      'Un camión con documentación vencida no debería salir a la ruta.',
    ],
  },
  {
    id: 'choferes',
    icon: UserCircle,
    titulo: 'Choferes',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    resumen: 'Alta de choferes, control de licencias, cuenta corriente y liquidación de sueldos.',
    pasos: [
      'Accedé desde "Choferes" en el menú.',
      'Para agregar un chofer, clic en "Nuevo Chofer" y completá nombre, DNI y fecha de vencimiento del carnet.',
      'Cada chofer tiene una cuenta corriente donde se acreditan sus viajes realizados.',
      'Para liquidar un chofer, seleccioná sus movimientos pendientes y hacé clic en "Liquidar".',
      'El modal de liquidación permite ajustar el monto si hay adelantos o descuentos.',
      'El sistema alerta cuando un carnet está por vencer (menos de 30 días).',
    ],
    tips: [
      'Registrá los adelantos de sueldo en la cuenta corriente del chofer.',
      'Liquidá quincenalmente para mantener los balances al día.',
    ],
  },
  {
    id: 'viajes',
    icon: MapPin,
    titulo: 'Viajes',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    resumen: 'Registro de viajes con repartos, cálculo de fletes, KM y combustible.',
    pasos: [
      'Accedé desde "Viajes" en el menú.',
      'Para cargar un viaje, clic en "Nuevo Viaje".',
      'Paso 1 - Operativo: seleccioná camión, chofer, fecha y cargá los repartos de ida y vuelta con sus destinos y montos de flete.',
      'Paso 2 - Financiero: completá KM recorridos y litros de gasoil consumidos.',
      'Paso 3 - Resumen: verificá los totales antes de confirmar.',
      'Un viaje completado acredita automáticamente en la cuenta del chofer y en los ingresos.',
      'Podés editar un viaje haciendo clic en el ícono de lápiz en la tabla.',
    ],
    tips: [
      'Configurá las tarifas de flete por defecto en cada cliente para acelerar la carga.',
      'Los KM y litros son importantes para calcular el rendimiento de la flota.',
    ],
  },
  {
    id: 'caja',
    icon: Landmark,
    titulo: 'Caja / Banco',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    resumen: 'Control de movimientos de caja, saldos bancarios y libro diario.',
    pasos: [
      'Accedé desde "Caja" en el menú.',
      'El panel superior muestra el saldo actual de caja, banco y patrimonio neto.',
      'Para registrar un ingreso o egreso, clic en "Nuevo Movimiento".',
      'Clasificá cada movimiento (cobro de cliente, gasto de combustible, sueldo, etc.).',
      'El libro diario muestra todos los movimientos ordenados por fecha.',
      'Usá los filtros de fecha para ver un período específico.',
    ],
    tips: [
      'Registrá todos los movimientos de efectivo, no solo los bancarios.',
      'Conciliá el saldo real con el saldo del sistema periódicamente.',
    ],
  },
  {
    id: 'combustible',
    icon: Fuel,
    titulo: 'Combustible',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    resumen: 'Registro de cargas de combustible por unidad, control de deuda y pagos.',
    pasos: [
      'Accedé desde "Combustible" en el menú.',
      'Para registrar una carga, clic en "Nueva Carga".',
      'Completá: camión, fecha, litros cargados y monto total.',
      'Las cargas impagas quedan marcadas hasta que se registre el pago.',
      'Para pagar cargas, seleccionalas y usá "Pagar Seleccionadas".',
      'El total de combustible del período se refleja en el Dashboard.',
    ],
    tips: [
      'Cargá el combustible inmediatamente después de cada reabastecimiento.',
      'Comparar litros vs KM recorridos ayuda a detectar anomalías en el consumo.',
    ],
  },
  {
    id: 'costos',
    icon: DollarSign,
    titulo: 'Costos y Multas',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    resumen: 'Control de impuestos, costos fijos, multas y punto de equilibrio.',
    pasos: [
      'Accedé desde "Costos" en el menú.',
      'Tiene 4 secciones: Impuestos, Costos, Multas y Punto de Equilibrio.',
      'IMPUESTOS: cargá monotributo, ingresos brutos y otros impuestos con su frecuencia de pago.',
      'COSTOS: registrá gastos fijos (alquiler, seguros) y únicos (reparaciones).',
      'MULTAS: cargá multas de tránsito indicando vehículo y chofer responsable.',
      'Los costos vencidos aparecen en el panel de "Pendientes de Pago" arriba.',
      'Para pagar un costo, hacé clic en el botón "Pagar" y confirmá el monto.',
      'PUNTO DE EQUILIBRIO: el sistema calcula automáticamente cuánto tenés que facturar para cubrir todos los costos.',
    ],
    tips: [
      'Configurá todos los impuestos recurrentes al inicio para no perder ningún vencimiento.',
      'Podés usar fórmulas en los montos (ej: VENTAS*0.035 para calcular % sobre ventas).',
    ],
  },
  {
    id: 'tareas',
    icon: ClipboardList,
    titulo: 'Tareas',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    resumen: 'Gestión de tareas operativas con fechas de vencimiento, recurrencia y control de caja.',
    pasos: [
      'Accedé desde "Tareas" en el menú.',
      'Las tareas se dividen en: Por Cumplir, Atrasadas y Cumplidas.',
      'Para crear una tarea, clic en "Nueva Tarea".',
      'Asigná una categoría (Operativa, Mantenimiento, Pago Fijo), título y fecha de vencimiento.',
      'Activá "Hacer Recurrente" si la tarea se repite (semanal, mensual, etc.).',
      'Si la tarea implica un pago, activá "Afecta Caja" y cargá el monto.',
      'Para completar una tarea, hacé clic en el círculo a la izquierda.',
      'Si la tarea afecta caja, el sistema preguntará si descontar el monto de caja.',
    ],
    tips: [
      'Usá tareas recurrentes para pagos fijos como alquileres o servicios.',
      'Las tareas atrasadas se destacan en rojo para identificarlas rápidamente.',
    ],
  },
  {
    id: 'operativa',
    icon: Package,
    titulo: 'Operativa / Depósito',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    resumen: 'Inventario y control de stock del depósito: cubiertas, lubricantes, repuestos y más.',
    pasos: [
      'Accedé desde "Operativa" en el menú.',
      'Para agregar un item al depósito, clic en "Agregar Item".',
      'Completá: categoría (cubiertas, lubricantes, repuestos, etc.), nombre, cantidad y unidad.',
      'Configurá un "Stock Mínimo" para recibir alertas cuando el stock baje.',
      'Para ajustar la cantidad de un item, hacé clic en el número de cantidad o en el botón de ajuste.',
      'Los items con stock bajo o sin stock aparecen destacados en amarillo o rojo.',
      'El panel de alertas arriba lista todos los items que necesitan reposición.',
    ],
    tips: [
      'Cargá todos los items del depósito al inicio, aunque la cantidad sea 0.',
      'Actualizá el stock cada vez que uses o repongas un item.',
      'Los datos se guardan localmente en el navegador.',
    ],
    advertencias: [
      'Los datos del depósito se guardan en el navegador. Si limpiás la caché, se pierden.',
    ],
  },
  {
    id: 'remitos',
    icon: FileText,
    titulo: 'Remitos',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    resumen: 'Generación y seguimiento de remitos de entrega por cliente.',
    pasos: [
      'Accedé desde "Remitos" en el menú.',
      'Para crear un remito, clic en "Nuevo Remito".',
      'Seleccioná el cliente y completá los detalles de la entrega.',
      'Los remitos pendientes pueden marcarse como entregados.',
      'Desde un remito podés generar una factura directamente.',
    ],
    tips: [
      'Usá los remitos para tener trazabilidad de cada entrega antes de facturar.',
    ],
  },
  {
    id: 'facturacion',
    icon: Receipt,
    titulo: 'Facturación ARCA/AFIP',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    resumen: 'Emisión de facturas electrónicas a través del sistema ARCA de AFIP.',
    pasos: [
      'Accedé desde "Facturas" en el menú.',
      'CONFIGURACIÓN INICIAL (solo una vez): clic en el ícono de configuración (⚙) y cargá tu CUIT, certificado y clave privada de AFIP.',
      'Para emitir una factura, clic en "Nueva Factura".',
      'Seleccioná el cliente, tipo de comprobante (A, B, C) y completá el monto.',
      'El sistema calcula el IVA automáticamente según el tipo de factura.',
      'Confirmá la emisión. La factura se envía a AFIP y se guarda con el CAE recibido.',
      'Podés ver todas las facturas emitidas en la tabla principal con su estado.',
    ],
    tips: [
      'El certificado AFIP tiene vencimiento de 2 años. Renoválo a tiempo.',
      'Las facturas A se usan para clientes Responsables Inscriptos.',
      'Las facturas B se usan para consumidores finales o monotributistas.',
    ],
    advertencias: [
      'Una factura emitida a AFIP NO puede ser eliminada, solo anulada.',
      'Verificá el CUIT del cliente antes de emitir para evitar errores.',
    ],
  },
]

export default function ManualPage() {
  const [abierto, setAbierto] = useState<string | null>('dashboard')
  const [imprimiendo, setImprimiendo] = useState(false)

  function toggleSeccion(id: string) {
    setAbierto(prev => prev === id ? null : id)
  }

  function imprimir() {
    setImprimiendo(true)
    setAbierto('__all__')
    setTimeout(() => {
      window.print()
      setImprimiendo(false)
      setAbierto('dashboard')
    }, 400)
  }

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic print:bg-white print:pt-0">
      <div className="max-w-[900px] mx-auto px-4 md:px-8 space-y-8 print:space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
          <div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
              MANUAL<br />
              <span className="text-sky-500 font-thin">/ DE USO</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">
              Rutas del Sur ERP · Guía completa del sistema
            </p>
          </div>
          <button onClick={imprimir} disabled={imprimiendo}
            className="flex items-center gap-2 px-7 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-xl disabled:opacity-50">
            <Printer size={16} />
            {imprimiendo ? 'Preparando...' : 'Imprimir / Guardar PDF'}
          </button>
        </div>

        {/* HEADER PRINT */}
        <div className="hidden print:block mb-8">
          <h1 className="text-4xl font-black uppercase text-black">RUTAS DEL SUR ERP</h1>
          <h2 className="text-2xl font-bold text-gray-700 uppercase">Manual de Uso del Sistema</h2>
          <p className="text-sm text-gray-500 mt-1">Generado el {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <hr className="mt-4 border-black" />
        </div>

        {/* INTRO */}
        <div className="bg-sky-500/[0.05] border border-sky-500/20 rounded-[2rem] p-6 print:border-black print:rounded-none">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center print:hidden">
              <BookOpen size={18} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] mb-1 print:text-black">Introducción</p>
              <p className="text-sm font-bold text-white leading-relaxed print:text-black">
                Rutas del Sur ERP es un sistema de gestión operativa y financiera diseñado para empresas de transporte de cargas.
                Integra el control de flota, choferes, viajes, facturación electrónica, caja y costos en una sola plataforma.
              </p>
              <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-widest print:text-gray-500">
                Versión 2.0 · Tecnología: Next.js + Supabase · Facturación: ARCA/AFIP
              </p>
            </div>
          </div>
        </div>

        {/* ÍNDICE (solo pantalla) */}
        <div className="print:hidden">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">Secciones del sistema</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {SECCIONES.map(s => {
              const activo = abierto === s.id
              return (
                <button key={s.id} onClick={() => {
                  toggleSeccion(s.id)
                  setTimeout(() => {
                    document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all text-left ${activo ? `border-current ${s.color}` : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>
                  <s.icon size={12} />
                  {s.titulo}
                </button>
              )
            })}
          </div>
        </div>

        {/* SECCIONES */}
        {SECCIONES.map(s => {
          const expandido = abierto === s.id || abierto === '__all__'
          return (
            <div key={s.id} id={`sec-${s.id}`}
              className="bg-slate-900/30 border border-white/5 rounded-[2rem] overflow-hidden print:rounded-none print:border-gray-300 print:bg-white print:mb-6 print:break-inside-avoid">

              {/* ENCABEZADO SECCIÓN */}
              <button onClick={() => toggleSeccion(s.id)}
                className={`w-full flex items-center justify-between gap-4 p-6 transition-all hover:bg-white/[0.02] print:pointer-events-none ${expandido ? 'border-b border-white/5 print:border-gray-300' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${s.color} print:hidden`}>
                    <s.icon size={16} />
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-black uppercase tracking-widest ${s.color.split(' ')[0]} print:text-black`}>{s.titulo}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 print:text-gray-600">{s.resumen}</p>
                  </div>
                </div>
                <span className="shrink-0 print:hidden">
                  {expandido ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-600" />}
                </span>
              </button>

              {/* CONTENIDO */}
              {expandido && (
                <div className="p-6 space-y-5 print:p-4">

                  {/* PASOS */}
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 print:text-gray-700">Cómo usarlo</p>
                    <ol className="space-y-2">
                      {s.pasos.map((paso, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border ${s.color} print:border-gray-400 print:text-black`}>
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-300 font-bold leading-snug pt-0.5 print:text-black">{paso}</p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* TIPS */}
                  {s.tips && s.tips.length > 0 && (
                    <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl p-4 print:border-green-400 print:bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-emerald-400 print:text-green-600" />
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] print:text-green-700">Consejos</p>
                      </div>
                      <ul className="space-y-1.5">
                        {s.tips.map((t, i) => (
                          <li key={i} className="text-[10px] font-bold text-emerald-300 flex items-start gap-2 print:text-green-800">
                            <span className="shrink-0 mt-0.5">·</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ADVERTENCIAS */}
                  {s.advertencias && s.advertencias.length > 0 && (
                    <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-4 print:border-amber-400 print:bg-amber-50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={13} className="text-amber-400 print:text-amber-700" />
                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.3em] print:text-amber-800">Importante</p>
                      </div>
                      <ul className="space-y-1.5">
                        {s.advertencias.map((a, i) => (
                          <li key={i} className="text-[10px] font-bold text-amber-300 flex items-start gap-2 print:text-amber-900">
                            <span className="shrink-0 mt-0.5">⚠</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* PIE DE PÁGINA */}
        <div className="text-center py-8 print:block">
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
            Rutas del Sur ERP · V2.0 · {new Date().getFullYear()}
          </p>
          <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-1 print:text-gray-500">
            Para soporte técnico, contactar al administrador del sistema.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          nav { display: none !important; }
          button { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </main>
  )
}
