# Plan Integral — Sistema POS Tienda de Conveniencia

> **Stack:** Next.js 16 + Prisma 7 + PostgreSQL + Tailwind CSS 4 + TypeScript + Zustand + Framer Motion
> **Dependencias base:** hugeicons-react, axios, zod, radix-ui, shadcn/ui, framer-motion, sonner, bcryptjs, date-fns, recharts

---

## Alcance

- Tienda de conveniencia (bebidas, snacks, básicos, limpieza, abarrotes)
- POS físico (caja registradora), 1 sucursal
- Admin + Cajeros (multiples empleados con rol cajero)
- Cobros registrados: split payments (efectivo, débito, crédito, transferencias, etc.)

---

## Resumen de Modelos

| # | Modelo | Props clave |
|---|--------|-------------|
| 1 | Employee | pinHash, role, failedAttempts, lockedUntil |
| 2 | Category | name, color |
| 3 | Product | barcode, name, price, costPrice |
| 4 | Stock | quantity, minStock |
| 5 | StockMovement | type (8 valores), quantity, reason |
| 6 | PaymentMethod | name, type, isActive |
| 7 | Sale | employeeId, cashDrawerId, receiptNumber, status |
| 8 | SaleItem | quantity, unitPrice, subtotal |
| 9 | SalePayment | saleId, paymentMethodId, amount |
| 10 | CashDrawer | openAmount, status |
| 11 | Transaction | type, amount |
| 12 | Supplier | name, contactName, phone, email |
| 13 | Purchase | supplierId, total |
| 14 | PurchaseItem | productId, quantity, costPrice |

---

## Estructura de Rutas

```
/                       → Redirect a /login o /pos
/login                   → Login (username + PIN 6 dígitos)
/(dashboard)/
  /pos                   → Punto de venta (pantalla principal)
  /products              → Gestión de productos
  /categories            → Gestión de categorías
  /suppliers             → Gestión de proveedores
  /stock                 → Stock y ajustes manuales
  /stockmovements        → Historial de movimientos
  /sales                 → Historial de ventas
  /purchases              → Registro de compras
  /cashdrawer             → Estado de caja
  /dashboard             → Dashboard principal
  /reports               → Reportes
  /settings              → Configuración (solo admin)
```

---

## Enums

```prisma
enum Role { ADMIN CASHIER }

enum PaymentMethodType { CASH DIGITAL }

enum CashDrawerStatus { OPEN CLOSED }

enum TransactionType { SALE OPENING CLOSING EXPENSE WITHDRAWAL DEPOSIT }

enum MovementType {
  SALE
  PURCHASE
  ADJUSTMENT_IN
  ADJUSTMENT_OUT
  RETURN
  OPENING
}

enum SaleStatus {
  COMPLETED
  CANCELLED
  REFUNDED
}
```

---

## Dependencias extra a instalar

```bash
pnpm add zustand fuse.js bcryptjs date-fns recharts
pnpm add -D @types/bcryptjs
```

---

## FASE 1 — Schema Base + Auth

**Objetivo:** Crear toda la estructura de datos y sistema de login antes de tocar código visible.

### 1.1 Schema Prisma Completo

```prisma
model Employee {
  id             String   @id @default(cuid())
  name           String
  username       String   @unique
  pinHash        String
  role           Role     @default(CASHIER)
  isActive       Boolean  @default(true)
  failedAttempts Int      @default(0)
  lockedUntil    DateTime?
  lastLoginAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  sales          Sale[]
  transactions  Transaction[]
  stockMovements StockMovement[]
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  color       String?
  createdAt   DateTime  @default(now())
  products    Product[]
}

model Product {
  id           String    @id @default(cuid())
  barcode      String?   @unique
  name         String
  description  String?
  price        Decimal
  costPrice    Decimal
  categoryId   String
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  category     Category     @relation(fields: [categoryId], references: [id])
  stock        Stock?
  saleItems    SaleItem[]
  purchaseItems PurchaseItem[]
  stockMovements StockMovement[]
}

model Stock {
  id         String  @id @default(cuid())
  productId String  @unique
  quantity  Int     @default(0)
  minStock  Int     @default(5)
  maxStock  Int?
  product   Product @relation(fields: [productId], references: [id])
}

model StockMovement {
  id           String       @id @default(cuid())
  productId   String
  type         MovementType
  quantity    Int
  referenceId  String?
  description  String?
  createdAt   DateTime     @default(now())
  createdById String
  @@index([createdAt])
  @@index([productId])
  product     Product      @relation(fields: [productId], references: [id])
  createdBy   Employee     @relation(fields: [createdById], references: [id])
}

model PaymentMethod {
  id        String            @id @default(cuid())
  name      String            @unique
  type      PaymentMethodType
  isActive  Boolean           @default(true)
  createdAt DateTime          @default(now())
  salePayments SalePayment[]
  transactions Transaction[]
}

model Sale {
  id              String      @id @default(cuid())
  receiptNumber  Int        @unique @default(autoincrement())
  employeeId    String
  cashDrawerId   String?
  total          Decimal
  status         SaleStatus @default(COMPLETED)
  createdAt      DateTime   @default(now())
  @@index([createdAt])
  @@index([employeeId])
  @@index([cashDrawerId])
  employee      Employee      @relation(fields: [employeeId], references: [id])
  cashDrawer    CashDrawer?   @relation(fields: [cashDrawerId], references: [id])
  saleItems     SaleItem[]
  salePayments  SalePayment[]
}

model SaleItem {
  id         String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Int
  unitPrice Decimal
  subtotal  Decimal
  sale     Sale     @relation(fields: [saleId], references: [id])
  product  Product  @relation(fields: [productId], references: [id])
}

model SalePayment {
  id              String        @id @default(cuid())
  saleId          String
  paymentMethodId String
  amount         Decimal
  sale           Sale          @relation(fields: [saleId], references: [id])
  paymentMethod  PaymentMethod @relation(fields: [paymentMethodId], references: [id])
}

model CashDrawer {
  id         String          @id @default(cuid())
  employeeId String
  openAmount Decimal
  closeAmount Decimal?
  openDate  DateTime        @default(now())
  closeDate DateTime?
  status   CashDrawerStatus @default(OPEN)
  employee  Employee        @relation(fields: [employeeId], references: [id])
  sales     Sale[]
  transactions Transaction[]
}

model Transaction {
  id              String        @id @default(cuid())
  cashDrawerId    String
  type           TransactionType
  amount         Decimal
  description    String?
  paymentMethodId String?
  createdAt      DateTime      @default(now())
  createdById    String
  @@index([cashDrawerId])
  @@index([createdAt])
  cashDrawer     CashDrawer   @relation(fields: [cashDrawerId], references: [id])
  paymentMethod  PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  createdBy     Employee     @relation(fields: [createdById], references: [id])
}

model Supplier {
  id          String    @id @default(cuid())
  name        String
  contactName String?
  phone       String?
  email       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  purchases   Purchase[]
}

model Purchase {
  id         String   @id @default(cuid())
  supplierId String
  total      Decimal
  createdAt DateTime @default(now())
  supplier  Supplier @relation(fields: [supplierId], references: [id])
  items     PurchaseItem[]
}

model PurchaseItem {
  id         String   @id @default(cuid())
  purchaseId String
  productId  String
  quantity  Int
  costPrice Decimal
  purchase  Purchase @relation(fields: [purchaseId], references: [id])
  product   Product   @relation(fields: [productId], references: [id])
}
```

### 1.2 Seed Inicial

- Admin default: username `admin`, PIN `123456` (cambiar al primer login)
- PaymentMethods: Efectivo (CASH), Débito (DIGITAL), Crédito (DIGITAL)
- Categorías default: Bebidas, Snacks, Abarrotes, Limpieza, Varios

### 1.3 Login

- Página `/login`
- Username + PIN (6 dígitos)
- bcrypt hash, 5 intentos fallidos → lockout 15 min
- Redirect a `/pos` tras login exitoso

### Entregables Fase 1

- [ ] Schema Prisma completo con todos los modelos y enums
- [ ] Migración aplicada
- [ ] Seed con datos iniciales
- [ ] Página de login funcional
- [ ] Middleware de auth (proteger rutas de dashboard)
- [ ] Sesión por cookie/JWT
- [ ] CRUD empleados (solo admin, desde settings)

---

## FASE 2 — POS Core

> ⚠️ **La fase más crítica de todo el sistema.** Performance es el riesgo principal.

### 2.1 Layout principal

- Sidebar fija izquierda: íconos para POS, Productos, Ventas, Caja, Dashboard, Reportes, Settings (admin)
- Contenido principal: área de trabajo
- Header: empleado logueado, hora actual, status de caja

### 2.2 Pantalla POS (3 paneles)

**Panel izquierdo — Búsqueda de productos:**
- Input con autofocus (al cargar y después de cada acción)
- Búsqueda local por nombre, código de barras, categoría
- Lista scrolleable con scroll suave
- Teclado: escribir → filtra al instante (sin API)

**Panel central — Carrito:**
- Lista de ítems: nombre, cantidad editable (+/-), precio, subtotal, eliminar
- Subtotal parcial
- Vaciar carrito (con confirmación)

**Panel derecho — Totales:**
- Subtotal, descuentos, total
- Botones de método de pago (los activos)
- Monto recibido (efectivo → keypad numérico → calcula cambio)
- Botón "Cobrar" (verde, grande)

### 2.3 Carrito con Zustand + localStorage

```typescript
interface CartStore {
  draftId: string
  items: CartItem[]
  addItem: (product: Product) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  persistCart: () => void
  restoreCart: () => void
}
```

> `saleDraftId` + timestamp en localStorage. Si se refresca o cuelga, al volver pregunta "¿Recuperar venta anterior?"

### 2.4 Búsqueda local con Fuse.js

```typescript
// Al montar POS:
const fuse = new Fuse(products, {
  keys: ['name', 'barcode'],
  threshold: 0.3
})
store.setFuse(fuse)

// En cada keystroke:
const filtered = fuse.search(query).map(r => r.item)
// Búsqueda fuzzy tipo Google
```

### 2.5 Split payments en UI

- Lista de pagos parciales con método + monto
- "Agregar método" → selecciona de activos
- Valida que suma de SalePayment amounts = total
- Error claro si no cuadra: "Los montos no coinciden. Total: $8.000, Pagado: $5.000"

### 2.6 Confirmación y ticket

- Modal de confirmación con desglose
- Ticket en pantalla (formato ticket A6/chico)
- Botón "Imprimir" → `window.print()`
- Almacena Sale + SaleItem + SalePayment en DB
- Genera StockMovement(SALE) por cada ítem

### Entregables Fase 2

- [ ] Layout con sidebar
- [ ] Pantalla POS con 3 paneles
- [ ] Cache de productos en memoria
- [ ] Carrito con Zustand + persistencia en localStorage
- [ ] Búsqueda local por teclado (sin API por tecla)
- [ ] Split payments en UI con validación
- [ ] Cobro con keypad numérico y cálculo de cambio
- [ ] Confirmación + ticket en pantalla + imprimir
- [ ] StockMovement(SALE) al confirmar venta
- [ ] Keyboard shortcuts (Enter, +/-, Delete, Escape, F1-F3)

---

## FASE 3 — Gestión de Stock y Productos

- CRUD productos con búsqueda por nombre/código
- CRUD categorías
- CRUD proveedores
- Ajustes de stock con motivo obligatorio (ADJUSTMENT_IN / ADJUSTMENT_OUT + reason)
- Alertas visuales: stock bajo, stock agotado
- Historial de movimientos filtrable por producto

### Entregables Fase 3

- [ ] CRUD productos
- [ ] CRUD categorías
- [ ] CRUD proveedores
- [ ] Ajuste de stock con motivo obligatorio
- [ ] Alertas visuales stock bajo/agotado
- [ ] Historial de movimientos con filtros

---

## FASE 4 — Caja y Arqueo

- Apertura de caja (empleado registra fondo inicial)
- Relación `Sale.cashDrawerId` → las ventas suman a la caja
- Retiros y depósitos (Transaction)
- Cierre de caja → arqueo (esperado vs. contable)
- Corte de caja por empleado

### Entregables Fase 4

- [ ] Apertura de caja
- [ ] Relación venta-caja
- [ ] Transacciones (retiros, depósitos)
- [ ] Cierre de caja con arqueo
- [ ] Corte por empleado

---

## FASE 5 — Compras

- Registrar compra: seleccionar supplier → agregar productos → confirmar
- Al confirmar: actualiza Stock.quantity (+), genera StockMovement(PURCHASE)
- Historial de compras

### Entregables Fase 5

- [ ] Registrar compra
- [ ] Actualización de stock al confirmar
- [ ] StockMovement(PURCHASE)
- [ ] Historial de compras

---

## FASE 6 — Promociones

- % descuento por producto
- Precio fijo promocional
- Vigencia por fecha
- Aplicación automática en POS

### Entregables Fase 6

- [ ] CRUD promociones
- [ ] Aplicación automática en POS
- [ ] Vigencia por fecha

---

## FASE 7 — Reportes y Dashboard

### Dashboard principal

- Ventas del día (monto total y cantidad de transacciones)
- Ventas de la semana (gráfico de tendencia)
- Productos más vendidos
- Productos con stock bajo (alerta)
- Fondo de caja actual

### Reportes

- Ventas del día/semana/mes
- Margen (price vs costPrice)
- Ventas por hora
- Corte por rango de fechas
- Corte de caja

### Entregables Fase 7

- [ ] Dashboard con métricas
- [ ] Gráficos (recharts)
- [ ] Reportes por rango de fechas
- [ ] Ventas por hora
- [ ] Margen de ganancia

---

## FASE 8 — Polish

- Keyboard shortcuts completos
- Barcode scanner físico (input listener en búsqueda POS)
- Performance: cacheo, lazy loading
- Optimizaciones finales

### Entregables Fase 8

- [ ] Keyboard shortcuts completos
- [ ] Barcode scanner físico
- [ ] Optimizaciones de performance

---

## Notas de Implementación

### Keyboard shortcuts POS

| Tecla | Acción |
|------|--------|
| Typing | Busca productos al instante |
| Enter | Agrega producto seleccionado al carrito |
| +/- | Ajusta cantidad del ítem seleccionado |
| Delete/Backspace | Elimina ítem |
| Escape | Limpia búsqueda / cancela |
| F1 | Toggle efectivo |
| F2 | Toggle tarjeta |
| F3 | Toggle transferencia |
| Ctrl+Enter | Cobra (finaliza venta) |

### PIN seguridad

- 6 dígitos fijo
- Hash con bcrypt
- 5 intentos fallidos → lockout 15 minutos
- Registro de último login exitoso

### Ticket (implementación simple)

- Mostrar en pantalla al confirmar venta
- Botón "Imprimir" → `window.print()`
- Para thermal printer → migrar luego (escpos-thermal)

### Performance POS

- Cargar todos los productos al montar POS → cache en memoria Zustand
- Búsqueda 100% local (sin API por cada tecla)
- Sync background cada 5 min
- Carrito persiste en localStorage por sessionDraftId

### Race conditions en Stock

Al confirmar venta, usar transacción de DB:

```sql
UPDATE stock SET quantity = quantity - ? WHERE productId = ? AND quantity >= ?
```

### Decimal en Prisma → Frontend

```typescript
// En API serializar:
Number(product.price)

// O usar Decimal.js:
product.price.toNumber()
```

### Double submit en POS

- Botón "Cobrar" se desactiva al hacer click
- Loading state visible
- Evitar doble procesamiento de la misma venta

### TZ — Fechas

- UTC en DB
- Convertir a local en frontend con date-fns

### receiptNumber — Secuencia

Usar `autoincrement()` de PostgreSQL. No UUID, no lógica manual.