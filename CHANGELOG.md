# Changelog - Sesión 2026-02-11

## Resumen Ejecutivo
En esta sesión nos enfocamos en refinar el flujo de **Ventas a Crédito**, mejorar los reportes financieros en el **Dashboard** y implementar un sistema robusto de gestión de **Cuentas Corrientes** para clientes.

## 🚀 Nuevas Funcionalidades Implementadas

### 1. Sistema de Abonos (Pagos Parciales)
- **Abono Global (FIFO):** Se implementó un botón "REGISTRAR ABONO" en el perfil del cliente.
- **Distribución Automática:** Al ingresar un monto (ej: $500), el sistema automáticamente paga las cuotas más antiguas primero ("First In, First Out").
- **Eliminación de Micromanagement:** Se eliminaron los botones individuales de pago por cuota para simplificar la experiencia.
- **Interfaz Mejorada:** Indicadores visuales grandes para "Deuda Total Pendiente" y "Total Pagado".

### 2. Dashboard Financiero (Correcciones Críticas)
- **Dinero en Caja Real:**
  - Antes: Solo sumaba ventas en efectivo directo.
  - Ahora: Suma `Ventas Efectivo` + `Total Recuadado de Créditos (Abonos)`.
- **Ventas a Crédito (Deuda Real):**
  - Antes: Mostraba el total histórico vendido a crédito.
  - Ahora: Muestra el **Saldo Pendiente por Cobrar** (`Total Vendido` - `Total Cobrado`).

### 3. Punto de Venta (POS)
- **Venta a 1 Cuota:** Ahora es posible realizar ventas a crédito seleccionando 1 sola cuota.
- **Cálculo Reactivo:** El plan de pagos se actualiza instantáneamente al cambiar el número de cuotas.

## 🛠 Cambios Técnicos

### Base de Datos
- Tabla `cuotas`:
  - Se agregó columna `monto_pagado` (DECIMAL) para rastrear pagos parciales.
  - Se actualizaron los registros existentes para consistencia.

### Archivos Modificados
- `frontend/src/pages/Clientes.jsx`: Lógica completa de abonos y modal de cuenta corriente.
- `frontend/src/pages/Dashboard.jsx`: Fórmulas de cálculo para métricas financieras.
- `frontend/src/pages/POS.jsx`: Lógica de generación de cuotas y manejo de casos borde (1 cuota).

## 📝 Pasos Siguientes (Para la próxima sesión)
1. **Auditoría:** Considerar crear una tabla `historial_pagos` para tener un log detallado de cada abono (fecha, monto, usuario). actualmente solo actualizamos el estado de la cuota.
2. **Validación:** Monitorear en producción que los cálculos de decimales (float) no generen diferencias de $1 peso con el tiempo.
