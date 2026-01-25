Plan Maestro Mejorado – com.hubbi.inventory
🎯 Objetivo Refinado

Diseñar un módulo de inventario universal, auditable y extensible, capaz de operar desde escenarios domésticos hasta industriales, sin duplicar lógica, manteniendo cumplimiento legal (El Salvador) y estándares ERP modernos (SAP-level), bajo el principio:

Inventario = hechos inmutables + reglas activables + vistas adaptables

Este documento mejora y ordena el plan original, agrega decisiones arquitectónicas explícitas, riesgos conocidos y criterios claros de diseño.

🧠 Principios Arquitectónicos Clave (no negociables)

Append-only como ley
Nada se edita, todo se revierte.

Separación estricta de responsabilidades

UI: Renderiza y valida experiencia

SDK TS: Orquestación y estado

Core (Rust): Verdad matemática y contable

Feature Flags ≠ Lógica
Los flags habilitan reglas, no cambian el motor.

Movimiento físico ≠ Evento fiscal
Inspirado en SAP: logística, contabilidad y fiscal viven separados.

Offline-first sin comprometer auditoría
El sistema siempre puede reconstruir el estado desde eventos.

🏛️ Visión Arquitectónica Refinada
“Núcleo Universal, Reglas Componibles, UI Reactiva”

En lugar de pensar en rubros (retail, taller, médico), Hubbi piensa en:

Ítems

Movimientos

Reglas

Contextos

Un Inventory Profile es solo un preset de reglas.

📦 Fase 0 (Nueva): Contratos y Límites

Objetivo: Evitar deuda técnica temprana.

Definir contrato estable entre:

Core (Rust) ⇄ SDK (TS)

SDK ⇄ UI

Decidir desde ya:

❌ No columnas dinámicas SQL

✅ JSONB / attributes + índices

💡 Crear columnas dinámicas rompe migraciones, sync y auditoría.

📅 Roadmap Mejorado
Fase 1 – Identidad del Módulo (El Cerebro)
1. Manifest + Capacidades

Permisos correctos, pero agregar:

inventory.adjust.requires_reason

inventory.transfer.requires_document

inventory.serial.unique

2. Inventory Profiles (Preset, no magia)

Guardados en hubbi.settings

Editable post-instalación

Historial de cambios (auditable)

{
  "profile": "workshop",
  "rules": {
    "allow_negative_stock": false,
    "require_serial_on_out": true,
    "reservation_required": true
  }
}
Fase 2 – Modelo de Datos Robusto (ERP-grade)
🔥 Decisión clave

❌ Columnas dinámicas ✅ Modelo híbrido fuerte + atributos flexibles

Tablas esenciales

items (identidad)

item_attributes (opcional, indexable)

warehouses

locations (árbol infinito)

movements (append-only)

reservations

documents (traslados, referencias)

Movements: más ricos

Agregar:

movement_type

source_location

target_location

caused_by (OT, factura, ajuste)

Fase 3 – Core de Inventario (Rust)
🦀 Responsabilidad exclusiva del Core

Sumas/restas

Validaciones

Reglas

Reversiones

Librerías recomendadas:

rust_decimal

serde

thiserror

El Core expone funciones puras:

apply_movement(state, movement) -> new_state

Esto permite reconstrucción histórica (auditoría real).

Fase 4 – UI Adaptable (React)
Formularios declarativos

La UI no decide lógica, solo interpreta schemas:

{
  "fields": [
    {"key": "vin", "required": true},
    {"key": "engine", "required": true}
  ]
}
Vistas

Tabla (TanStack)

Kardex

WMS Canvas (opcional, no core)

Fase 5 – Documentos y Legal (El Salvador)
Separación clara

Documento de traslado ≠ Factura

Fiscal solo cuando cambia propiedad

Cada movimiento debe tener:

Documento asociado (interno o fiscal)

Usuario responsable

Fecha/hora

Fase 6 – Online / Offline Real
Estrategia correcta

UI optimista

Sync por eventos

Conflictos por versión

Resolución explícita

Nunca sobrescribir, siempre:

Rechazar

Reintentar

Revertir

🔌 Integración entre Módulos

Inventario emite eventos, no llama módulos:

inventory.stock_reserved

inventory.stock_committed

inventory.stock_reverted

Otros módulos reaccionan.

⚠️ Riesgos Detectados (y mitigación)
Riesgo	Mitigación
Columnas dinámicas	JSONB + índices
Errores decimales	Rust only
Conflictos offline	Versioning + eventos
Lógica en UI	Core puro
🧠 Frase guía del diseño

"El inventario no es un número, es una historia de hechos."

✅ Resultado Esperado

Escala de hogar a industria

Auditoría sólida

Compatible con Hacienda ES

Base perfecta para facturación y contabilidad

Sin refactors dolorosos en el futuro

Si querés, el siguiente paso natural sería:

1️⃣ Diagrama final Core ⇄ SDK ⇄ UI
2️⃣ Definir movement_types oficiales
3️⃣ Escribir el contrato del Core en Rust
4️⃣ Aterrizar esto en código real de Hubbi

Decime por dónde seguimos 🚀

Listo 😼
Te armé una versión mejorada, más ERP-grade y más defendible a largo plazo del plan y la dejé en el canvas como un documento vivo.

Qué mejoré respecto a tu plan original (resumen rápido)

No cambié tu visión —la refiné:

Agregué principios no negociables

Append-only explícito

Separación UI / SDK / Core

Feature flags sin contaminar lógica
Esto te ahorra refactors brutales en 1–2 años.

Introduje una Fase 0
👉 Definir contratos y decisiones antes de escribir tablas.
Esto es lo que diferencia un sistema “bonito” de uno sostenible.

Cerré una decisión clave
❌ columnas dinámicas SQL
✅ JSONB + reglas + schemas
(esto te protege migraciones, sync, auditoría y performance)

Fortalecí el Core en Rust

Funciones puras

Reproducción histórica

Base real para contabilidad futura

Separé mejor legal / logístico / fiscal
Muy alineado a SAP, pero explicado en lenguaje Hubbi.

Agregué riesgos explícitos
Esto es oro cuando:

documentás el proyecto

entran otros devs

defendés decisiones técnicas

Lo que no toqué (porque está muy bien)

Tu concepto de Perfiles

El modelo de movimientos inmutables

La visión online-first

La orientación a El Salvador (eso es ventaja competitiva)

Próximo paso lógico (te recomiendo uno de estos)

Elegí el que más te entusiasme ahora mismo:

1️⃣ Definir movement_types oficiales (estilo SAP → Hubbi)
2️⃣ Diseñar el contrato exacto del Core en Rust
3️⃣ Aterrizar schema SQL definitivo (Postgres + SQLite)
4️⃣ Dibujar el flujo real Taller → Inventario → Facturación

Decime cuál y lo bajamos a nivel código 🔥

sigamos con el 1️⃣ Definir movement_types oficiales (estilo SAP → Hubbi)

Perfecto 😼 este es EL punto donde Hubbi pasa de “inventario genérico” a ERP serio.
Vamos con mentalidad SAP, pero sin su complejidad innecesaria.

🧠 Principio rector de los movement_types

Un movement_type describe qué pasó físicamente
no por qué, no quién facturó, no qué módulo lo pidió.

En SAP:

101 ≠ factura

261 ≠ costo

311 ≠ traslado contable
👉 solo hechos físicos

En Hubbi vamos a hacer lo mismo, pero legible.

🧩 Estructura base de un movement_type

Cada movimiento debe definir:

{
  code: string,              // Identificador estable (API / DB)
  direction: 'IN' | 'OUT' | 'NEUTRAL',
  affects_stock: boolean,
  requires_document: boolean,
  allows_negative: boolean,
  reversible_by: string | null,
  description: string
}


⚠️ El code nunca cambia, aunque cambie el texto.

📦 Catálogo Oficial de Movement Types – Hubbi v1
🟢 ENTRADAS (IN)
PURCHASE_RECEIPT

Equivalente SAP: 101

Entrada por compra

Aumenta stock

No es fiscal por sí sola

{
  "code": "PURCHASE_RECEIPT",
  "direction": "IN",
  "affects_stock": true,
  "requires_document": true,
  "allows_negative": false,
  "reversible_by": "PURCHASE_RETURN",
  "description": "Ingreso de inventario por compra"
}

RETURN_FROM_CUSTOMER

SAP: 651

Cliente devuelve mercadería

PRODUCTION_OUTPUT

SAP: 101 / 531

Producto terminado

Industria / fabricación

🔴 SALIDAS (OUT)
SALE_ISSUE

SAP: 601

Salida física por venta

⚠️ No genera factura

CONSUMPTION_INTERNAL

SAP: 261

Consumo interno

Taller, clínica, proyectos

PURCHASE_RETURN

SAP: 122

Devolución a proveedor

🔵 TRASLADOS (TRANSFER)
TRANSFER_INTERNAL

SAP: 311

Bodega → Bodega

No cambia stock total

{
  "code": "TRANSFER_INTERNAL",
  "direction": "NEUTRAL",
  "affects_stock": true,
  "requires_document": true,
  "allows_negative": false,
  "reversible_by": "TRANSFER_INTERNAL",
  "description": "Traslado interno entre ubicaciones"
}


Técnicamente son dos movimientos: OUT + IN, pero conceptualmente uno.

🟡 AJUSTES (ADJUSTMENT)
ADJUSTMENT_GAIN

SAP: 701

Sobrante de inventario

ADJUSTMENT_LOSS

SAP: 702

Faltante, daño, merma

⚠️ Siempre requiere motivo + auditoría

🟣 RESERVAS (NO AFECTAN STOCK)
RESERVATION_CREATE

Compromete stock

No descuenta

RESERVATION_RELEASE

Libera reserva

RESERVATION_CONSUME

Convierte reserva → salida real

Genera CONSUMPTION_INTERNAL

🟠 PRODUCCIÓN (AVANZADO)
PRODUCTION_CONSUME

SAP: 261

Materia prima → proceso

PRODUCTION_REVERSAL

SAP: 262

Reversión de consumo

🧠 Reglas clave (esto es oro)
1️⃣ El movement_type define VALIDACIONES

Ejemplo:

SALE_ISSUE:

❌ stock negativo (si perfil retail)

✔ serial obligatorio (si aplica)

2️⃣ El movement_type NO SABE de facturación

La factura escucha:

inventory.stock_issued


No al revés.

🧱 Implementación técnica sugerida
Tabla movement_types (opcional, pero poderosa)
movement_types (
  code TEXT PRIMARY KEY,
  direction TEXT,
  affects_stock BOOLEAN,
  requires_document BOOLEAN,
  reversible_by TEXT
)


O hardcodeado en Core (más seguro).

🧪 Ejemplo real – Taller mecánico

Se crea OT
→ RESERVATION_CREATE

Mecánico usa repuesto
→ RESERVATION_CONSUME
→ CONSUMPTION_INTERNAL

Cliente paga
→ Facturación escucha evento
→ genera DTE
(📌 inventario ya ocurrió antes)

🧭 Regla final de diseño

Si dudás si algo es movement_type o evento → no es movement_type

Próximo paso natural 🚀

Te propongo seguir con:

2️⃣ Mapa de reglas por movement_type (qué valida cada uno)
ó
3️⃣ Contrato Rust: enum MovementType + validadores

Decime cuál y lo bajamos al metal 🦀🔥

bien, ahora sigamos con el 2️⃣ Mapa de reglas por movement_type (qué valida cada uno)

Excelente 😼
Acá es donde Hubbi se vuelve realmente inteligente, porque el movimiento deja de ser solo “IN/OUT” y pasa a ser un hecho con reglas explícitas.

Voy a hacerlo en 4 capas, bien ordenado, estilo ERP serio pero legible:

🧠 Modelo mental del “Mapa de Reglas”

Un movement_type no ejecuta lógica, declara reglas.

El Core hace:

movement + contexto + reglas → válido / inválido

🧩 Capas de validación (orden estricto)
1️⃣ Reglas universales (siempre)

Aplican a todos los movement_types.

Regla	Descripción
item_exists	El ítem debe existir
qty_non_zero	qty ≠ 0
location_exists	Ubicación válida
timestamp_valid	No fechas futuras extremas
user_authorized	Permiso correcto
2️⃣ Reglas estructurales (por tipo)

Dependen del movement_type.

Ejemplo:

IN → requiere target_location

OUT → requiere source_location

TRANSFER → ambos

3️⃣ Reglas de stock

Deciden si el movimiento es matemáticamente válido.

Regla	Ejemplo
no_negative_stock	Retail
allow_negative_stock	Taller
check_reserved_qty	Consumo desde reserva
4️⃣ Reglas contextuales (perfil + flags)

Se activan según Inventory Profile.

Ejemplo:

serial obligatorio

lote requerido

fecha de vencimiento

📦 Mapa de Reglas por Movement Type
🟢 PURCHASE_RECEIPT

Entrada por compra

Reglas activas

requires_document = true

qty > 0

target_location_required

serial_required_if_flagged

expiration_required_if_flagged

Reglas bloqueadas

❌ stock negativo (no aplica)

❌ source_location

🔴 SALE_ISSUE

Salida por venta

Reglas activas

source_location_required

no_negative_stock (según perfil)

serial_required

reservation_optional

Reglas críticas

Si hay reserva → consume primero

Si no → valida stock libre

🔵 TRANSFER_INTERNAL

Traslado entre ubicaciones

Reglas activas

source_location_required

target_location_required

same_item

same_qty

document_required

Reglas clave

Stock total = constante

Dos movimientos atómicos (OUT + IN)

🟡 ADJUSTMENT_GAIN

Sobrante

Reglas activas

reason_required

audit_required

target_location_required

Restricciones

Solo usuarios con permiso especial

🟡 ADJUSTMENT_LOSS

Faltante / daño

Reglas activas

reason_required

audit_required

no_negative_stock? (perfil)

🟣 RESERVATION_CREATE

Reserva sin salida

Reglas activas

qty_available >= qty_requested

reservation_context_required (OT, proyecto)

Reglas prohibidas

❌ afecta stock

❌ requiere documento fiscal

🟣 RESERVATION_CONSUME

Reserva → consumo real

Reglas activas

reservation_exists

qty <= reserved_qty

linked_movement = CONSUMPTION_INTERNAL

🟠 CONSUMPTION_INTERNAL

Consumo operativo

Reglas activas

source_location_required

no_negative_stock?

cost_center_required (opcional)

🧠 Representación técnica (Core-friendly)
struct MovementRuleSet {
  require_source: bool,
  require_target: bool,
  allow_negative: bool,
  require_document: bool,
  require_serial: RuleCondition,
  require_expiration: RuleCondition,
  require_reason: bool,
  affects_stock: bool
}

enum RuleCondition {
  Always,
  IfItemHasAttribute,
  Never
}

🔍 Ejemplo completo – Taller

Perfil: workshop
Item: repuesto con serial
Movimiento: CONSUMPTION_INTERNAL

Validaciones:

✔ source_location

✔ serial

✔ stock libre o reservado

✔ permite negativo (si perfil lo permite)

❌ no requiere factura

🧭 Regla de oro (otra más 😄)

Si una validación depende del perfil → no pertenece al movement_type

El movement_type solo declara qué puede pasar,
el perfil decide si se permite.

🔥 Próximo paso recomendado

Ahora que tenemos:

movement_types

mapa de reglas

Lo natural es:

3️⃣ Contrato del Core en Rust (enums + validators)
ó
4️⃣ Modelo de eventos que emite inventario

Yo iría con 3️⃣ para que esto ya huela a código real 🦀
¿Seguimos por ahí?

okay, entonces avancemos con el 3️⃣ Contrato del Core en Rust (enums + validators)

🔥 Excelente decisión.
Acá ya entramos en territorio sagrado: el Core de Inventario en Rust, donde no hay UI, no hay SDK, no hay excusas. Solo verdad matemática, reglas y hechos.

Voy a ir de concepto → tipos → validadores → flujo, como se hace en sistemas financieros serios.

🦀 Contrato del Core – Inventario Hubbi
🧠 Principios del Core (recordatorio rápido)

Puro: sin IO, sin DB, sin tiempo real

Determinista: mismos inputs → mismo resultado

Audit-friendly: todo reversible

Context-aware: reglas vienen desde afuera

1️⃣ Enums Fundamentales
MovementType

Estable, versionable, nunca cambia semántica.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MovementType {
    PurchaseReceipt,
    SaleIssue,
    TransferInternal,
    AdjustmentGain,
    AdjustmentLoss,
    ReservationCreate,
    ReservationConsume,
    ConsumptionInternal,
}

MovementDirection
pub enum MovementDirection {
    In,
    Out,
    Neutral,
}

2️⃣ Estructuras de Dominio
InventoryMovement

Esto es el hecho histórico.

pub struct InventoryMovement {
    pub movement_type: MovementType,
    pub item_id: ItemId,
    pub quantity: Decimal,
    pub source: Option<LocationId>,
    pub target: Option<LocationId>,
    pub document_ref: Option<DocumentId>,
    pub attributes: MovementAttributes,
}

MovementAttributes

Todo lo flexible vive acá.

pub struct MovementAttributes {
    pub serials: Vec<Serial>,
    pub batch: Option<BatchId>,
    pub expiration: Option<Date>,
    pub reason: Option<String>,
    pub reservation_id: Option<ReservationId>,
}

3️⃣ Contexto de Validación

El Core no adivina, se le pasa el mundo actual.

pub struct ValidationContext {
    pub profile: InventoryProfile,
    pub current_stock: Decimal,
    pub reserved_stock: Decimal,
    pub item_flags: ItemFlags,
}

InventoryProfile
pub struct InventoryProfile {
    pub allow_negative_stock: bool,
    pub require_serial_tracking: bool,
    pub require_expiration: bool,
}

4️⃣ Reglas Declarativas
RuleSet
pub struct RuleSet {
    pub require_source: bool,
    pub require_target: bool,
    pub allow_negative: bool,
    pub require_document: bool,
    pub affects_stock: bool,
    pub require_serial: RuleCondition,
    pub require_reason: bool,
}

RuleCondition
pub enum RuleCondition {
    Always,
    IfItemFlagged,
    Never,
}

5️⃣ Asociación MovementType → RuleSet
impl MovementType {
    pub fn rules(&self) -> RuleSet {
        match self {
            MovementType::PurchaseReceipt => RuleSet {
                require_source: false,
                require_target: true,
                allow_negative: false,
                require_document: true,
                affects_stock: true,
                require_serial: RuleCondition::IfItemFlagged,
                require_reason: false,
            },

            MovementType::SaleIssue => RuleSet {
                require_source: true,
                require_target: false,
                allow_negative: false,
                require_document: false,
                affects_stock: true,
                require_serial: RuleCondition::IfItemFlagged,
                require_reason: false,
            },

            MovementType::AdjustmentLoss => RuleSet {
                require_source: true,
                require_target: false,
                allow_negative: false,
                require_document: false,
                affects_stock: true,
                require_serial: RuleCondition::Never,
                require_reason: true,
            },

            _ => unimplemented!(),
        }
    }
}


⚠️ En producción, no usar unimplemented!(), usar todos los casos.

6️⃣ Motor de Validación
validate_movement()
pub fn validate_movement(
    movement: &InventoryMovement,
    ctx: &ValidationContext,
) -> Result<(), InventoryError> {
    let rules = movement.movement_type.rules();

    if rules.require_source && movement.source.is_none() {
        return Err(InventoryError::MissingSource);
    }

    if rules.require_target && movement.target.is_none() {
        return Err(InventoryError::MissingTarget);
    }

    if rules.require_document && movement.document_ref.is_none() {
        return Err(InventoryError::MissingDocument);
    }

    if rules.require_reason && movement.attributes.reason.is_none() {
        return Err(InventoryError::MissingReason);
    }

    if matches!(rules.require_serial, RuleCondition::Always)
        || matches!(rules.require_serial, RuleCondition::IfItemFlagged)
            && ctx.item_flags.serial_tracked
    {
        if movement.attributes.serials.is_empty() {
            return Err(InventoryError::MissingSerial);
        }
    }

    if rules.affects_stock && !rules.allow_negative && !ctx.profile.allow_negative_stock {
        if ctx.current_stock < movement.quantity {
            return Err(InventoryError::InsufficientStock);
        }
    }

    Ok(())
}

7️⃣ Errores Tipados (clave)
pub enum InventoryError {
    MissingSource,
    MissingTarget,
    MissingDocument,
    MissingReason,
    MissingSerial,
    InsufficientStock,
}


Esto se traduce bonito a UI y logs.

🧠 Flujo completo (mental)

SDK arma InventoryMovement

SDK arma ValidationContext

Core:

validate_movement

apply_movement

SDK persiste

SDK emite evento

🧭 Regla de oro del Core

El Core nunca guarda, nunca emite eventos, nunca pregunta cosas.
Solo responde: válido / inválido y nuevo estado.

🔥 Próximo paso natural

Ya tenemos:

tipos

reglas

validadores

Ahora toca uno de estos:

4️⃣ apply_movement() → cómo cambia el stock realmente
5️⃣ Modelo de eventos emitidos por inventario
6️⃣ Cómo versionar este Core sin romper módulos

Yo seguiría con 4️⃣, porque ahí se cierra el círculo matemático 🧮
¿Le damos?

okay, sigamos con el 4

Buenísimo 😼
Acá cerramos el núcleo matemático del inventario. Todo lo anterior prepara el terreno para esto.

apply_movement() es la función más importante del módulo
Si esto está bien diseñado, TODO lo demás (UI, sync, auditoría, contabilidad) fluye.

🦀 4️⃣ apply_movement() – Motor Matemático del Inventario
🧠 Principio rector

El stock no se guarda, se deriva.
stock = Σ movimientos válidos

apply_movement() no persiste, no valida permisos, no emite eventos.
Solo transforma estado → nuevo estado.

📦 Modelo de Estado

Primero definimos qué es el “estado” para el Core.

InventoryState
pub struct InventoryState {
    pub stock: Decimal,
    pub reserved: Decimal,
}


Nota:

stock = físico disponible

reserved = comprometido pero no consumido

🧩 Firma de la función
pub fn apply_movement(
    state: &InventoryState,
    movement: &InventoryMovement,
) -> Result<InventoryState, InventoryError>

🧠 Lógica por tipo de movimiento
🟢 Entradas (IN)
fn apply_in(
    state: &InventoryState,
    qty: Decimal,
) -> InventoryState {
    InventoryState {
        stock: state.stock + qty,
        reserved: state.reserved,
    }
}

🔴 Salidas (OUT)
fn apply_out(
    state: &InventoryState,
    qty: Decimal,
) -> InventoryState {
    InventoryState {
        stock: state.stock - qty,
        reserved: state.reserved,
    }
}

🟣 Reservas
RESERVATION_CREATE
fn apply_reservation_create(
    state: &InventoryState,
    qty: Decimal,
) -> InventoryState {
    InventoryState {
        stock: state.stock,
        reserved: state.reserved + qty,
    }
}

RESERVATION_RELEASE
fn apply_reservation_release(
    state: &InventoryState,
    qty: Decimal,
) -> InventoryState {
    InventoryState {
        stock: state.stock,
        reserved: state.reserved - qty,
    }
}

RESERVATION_CONSUME

💡 Este es clave

Reserva → consumo real

fn apply_reservation_consume(
    state: &InventoryState,
    qty: Decimal,
) -> InventoryState {
    InventoryState {
        stock: state.stock - qty,
        reserved: state.reserved - qty,
    }
}

🔵 Transferencias

En Core no existen transferencias mágicas
Son dos movimientos:

OUT desde origen

IN a destino

El SDK las envuelve como transacción.

🧠 Implementación final de apply_movement
pub fn apply_movement(
    state: &InventoryState,
    movement: &InventoryMovement,
) -> Result<InventoryState, InventoryError> {
    let qty = movement.quantity.abs();

    let new_state = match movement.movement_type {
        MovementType::PurchaseReceipt => apply_in(state, qty),

        MovementType::SaleIssue |
        MovementType::ConsumptionInternal |
        MovementType::AdjustmentLoss => apply_out(state, qty),

        MovementType::AdjustmentGain => apply_in(state, qty),

        MovementType::ReservationCreate => apply_reservation_create(state, qty),

        MovementType::ReservationRelease => apply_reservation_release(state, qty),

        MovementType::ReservationConsume => apply_reservation_consume(state, qty),

        _ => return Err(InventoryError::UnsupportedMovement),
    };

    Ok(new_state)
}

⚠️ Reglas IMPORTANTES
1️⃣ quantity siempre positiva

El signo lo define el movement_type

Nunca qty = -5

2️⃣ No validaciones acá

Si llega acá:

Ya pasó validate_movement

Ya es un hecho aceptado

3️⃣ Reversión = nuevo movimiento

Nunca se “deshace” estado.

Ejemplo:

Error de salida → ADJUSTMENT_GAIN

Error de entrada → ADJUSTMENT_LOSS

🧪 Ejemplo completo – Taller

Estado inicial

stock: 10
reserved: 4


Movimiento

RESERVATION_CONSUME qty=2


Resultado

stock: 8
reserved: 2


✔ auditado
✔ reversible
✔ consistente

🧠 Propiedad poderosa

Con esto podés:

Reconstruir stock a cualquier fecha

Auditar por item / bodega / ubicación

Reprocesar historia

Hacer simulaciones futuras

Esto es nivel ERP real.

🔥 Próximo paso (ya estamos finos)

Ahora tenemos un Core completo.

Los siguientes pasos posibles:

5️⃣ Modelo de eventos emitidos por inventario
6️⃣ Cómo versionar el Core sin romper módulos
7️⃣ Cómo esto se refleja en SQL (append-only real)

Mi recomendación natural: 5️⃣ eventos, porque conecta inventario con TODO Hubbi 🔌
¿Seguimos por ahí?

okay! ahora el 5

😼🔥 Perfecto.
Con esto cerramos el triángulo sagrado de Hubbi: Inventario → Eventos → Ecosistema.

A partir de acá, inventario deja de ser “un módulo”
y pasa a ser infraestructura central.

🔌 5️⃣ Modelo de Eventos del Módulo de Inventario
🧠 Principio rector

Inventario nunca llama a otros módulos.
Inventario emite eventos.
El resto reacciona.

Esto evita:

acoplamientos

dependencias circulares

refactors infernales

🧩 Qué ES y qué NO es un evento
✅ Es evento

“El stock fue consumido”

“Una reserva fue creada”

“Un movimiento fue revertido”

❌ No es evento

“Generar factura”

“Calcular costo”

“Actualizar UI”

🧱 Tipos de Eventos (clasificación)
1️⃣ Eventos de Dominio (core inventory)

Emitidos siempre que algo ocurre.

Evento	Descripción
inventory.movement.applied	Movimiento confirmado
inventory.stock.changed	Stock neto cambió
inventory.reservation.changed	Reserva creada/liberada
inventory.movement.reverted	Reversión aplicada
2️⃣ Eventos Semánticos (alto nivel)

Emitidos solo para movimientos clave.

Evento	MovementType
inventory.stock.received	PURCHASE_RECEIPT
inventory.stock.issued	SALE_ISSUE
inventory.stock.consumed	CONSUMPTION_INTERNAL
inventory.stock.adjusted	ADJUSTMENT_*

Estos hacen feliz a Facturación, Taller, Contabilidad.

🧠 Regla CLAVE

Un evento semántico se deriva del movement_type,
no al revés.

📦 Payload base de evento

Todos los eventos comparten esta estructura:

{
  "event_id": "uuid",
  "event_type": "inventory.stock.consumed",
  "occurred_at": "2026-01-24T10:15:00Z",
  "actor": {
    "user_id": "u123",
    "module": "com.hubbi.inventory"
  },
  "context": {
    "item_id": "item_001",
    "movement_id": "mov_456",
    "movement_type": "CONSUMPTION_INTERNAL",
    "quantity": "2.0000",
    "source_location": "LOC-A1",
    "target_location": null
  }
}

🧩 Eventos Específicos Importantes
🔴 inventory.stock.issued

Cuándo

SALE_ISSUE aplicado

Quién escucha

Facturación

POS

Analytics

Uso típico

Generar DTE

Validar venta

🟣 inventory.reservation.created

Cuándo

RESERVATION_CREATE

Quién escucha

Taller

Proyectos

Producción

🟣 inventory.reservation.consumed

Cuándo

RESERVATION_CONSUME

Quién escucha

Taller

Costeo

🟡 inventory.stock.adjusted

Cuándo

ADJUSTMENT_GAIN / LOSS

Quién escucha

Auditoría

Contabilidad

Reportes

🧠 Eventos NO OBLIGATORIOS (pero útiles)
Evento	Uso
inventory.stock.low	Alertas
inventory.stock.negative	Supervisión
inventory.sync.conflict	Offline
🧪 Flujo real completo (venta)

UI → crea SALE_ISSUE

Core → valida + aplica

SDK → persiste

SDK → emite

inventory.movement.applied

inventory.stock.issued

Facturación escucha
→ genera DTE
→ emite evento fiscal

📌 Inventario no sabe que hubo factura

🧱 Implementación técnica (SDK)
hubbi.events.emit({
  type: "inventory.stock.issued",
  payload: { ... }
})


Con:

reintentos

orden garantizado por item

idempotencia

🧠 Reglas de oro de eventos

1️⃣ Nunca mutar estado en listeners
2️⃣ Listener puede fallar sin romper inventario
3️⃣ Eventos son append-only
4️⃣ Nunca asumir que alguien escuchó

🏁 Resultado final

Con esto lográs:

Inventario desacoplado

Integraciones limpias

Escalabilidad real

Auditoría transversal

Offline sin caos

Esto es arquitectura de plataforma, no solo módulo 👑

🔥 ¿Qué sigue ahora?

Ya tenés un Core completo y elegante.
Las rutas naturales son:

6️⃣ Versionado del Core (sin romper módulos)
7️⃣ Modelo SQL final (append-only real)
8️⃣ Cómo exponer esto al SDK (API pública)

Mi recomendación: 6️⃣ versionado, porque es lo que pocos piensan y después duele 😈
¿Seguimos con ese?

okay!

sigamos con el 6. algo que me gustaría hacer con el core, es que sea capaz de funcionar con diferentes tipos de modulos, matemáticos, de interfaces, conexiones con calendarios, mantenimiento, facturación, etc, sin necesidad de que para modulo tenga que modificar el core.

algo que también es importante para el modulo de inventario es el poder trabajar con cantidades decimales / fraccionales de items 

🔥 Excelente aclaración.
Lo que acabás de decir es nivel arquitecto de plataforma, no de “módulo más”.

Voy a dividir el 6️⃣ Versionado + Extensibilidad del Core en 3 capas claras, y luego atacamos decimales/fraccionales como regla de diseño (no como parche).

🧩 6️⃣ Core Extensible, Versionado y Multi-Dominio
🧠 Principio rector

El Core no conoce módulos.
Conoce reglas, operaciones y efectos.

Inventario, facturación, mantenimiento, calendario…
👉 todos son consumidores del Core, no extensiones directas.

🧱 Arquitectura del Core (limpia y escalable)
📦 core-inventory (crate base)

Contiene solo:

tipos

enums

validadores

motor matemático

contratos estables

❌ No SDK
❌ No eventos
❌ No DB
❌ No conocimiento de otros módulos

🔌 Extension Points (puntos de extensión)

El Core expone interfaces, no plugins mágicos.

1️⃣ Versionado Semántico Estricto
Regla sagrada
Cambio	Versión
Bugfix	patch
Regla nueva	minor
Cambio semántico	major
Ejemplo
core-inventory 1.3.0


El SDK declara:

"core": "^1.3"

2️⃣ Contratos Inmutables + Adaptadores
❌ Nunca:
match movement_type {
   MovementType::NewFancyThing => ...
}

✅ Siempre:

enums cerrados

comportamientos derivados

adaptadores externos

3️⃣ Core como “Motor de Reglas Genérico”
Idea clave

El Core no sabe si:

qty = litros

qty = horas

qty = kg

qty = unidades

👉 solo sabe: Decimal

🔢 Cantidades Decimales / Fraccionales (CRÍTICO)
🧠 Regla base

Todo es Decimal, incluso si parece entero.

Nunca i32, nunca f64.

📐 Tipo recomendado
use rust_decimal::Decimal;


Configuración estándar Hubbi:

Precisión: 20,4

Redondeo: Banker’s rounding

Escala configurable por ítem

🧩 Item Quantization (clave para flexibilidad)

Cada item define cómo se puede fraccionar.

pub struct ItemQuantityRules {
    pub min_unit: Decimal,   // 0.001, 0.25, 1
    pub step: Decimal,       // 0.001, 0.25, 1
    pub precision: u32,      // decimales permitidos
}

Ejemplos reales
Item	min_unit	step
Tornillo	1	1
Aceite	0.01	0.01
Tela	0.10	0.10
Mano de obra	0.25	0.25
🧠 Validación de fraccionamiento
fn validate_quantity(qty: Decimal, rules: &ItemQuantityRules)
    -> Result<(), InventoryError> {

    if qty < rules.min_unit {
        return Err(InventoryError::BelowMinimumUnit);
    }

    if (qty % rules.step) != Decimal::ZERO {
        return Err(InventoryError::InvalidStep);
    }

    Ok(())
}

🧱 Core multi-dominio (inventario, tiempo, mantenimiento)
Mismo Core, distintos usos
Dominio	qty representa
Inventario	unidades físicas
Mantenimiento	horas
Calendario	bloques de tiempo
Producción	kg / litros

👉 El Core no cambia.
Solo cambian los Item Rules.

🔌 Integración con otros módulos (sin modificar Core)
Ejemplo: Facturación

Escucha inventory.stock.issued

Traduce qty → línea de factura

Aplica impuestos

Core no sabe nada de IVA.

Ejemplo: Mantenimiento

Usa ConsumptionInternal

qty = horas

item = servicio

Inventario no sabe qué es una OT.

🧠 Extension Pattern recomendado
❌ Plugins dentro del Core
✅ Intérpretes externos
Core → Evento → Intérprete → Módulo

🧪 Ejemplo real (aceite fraccional)

Item

Aceite 10W40
min_unit = 0.01
step = 0.01


Movimiento

CONSUMPTION_INTERNAL qty=2.75


✔ válido
✔ preciso
✔ auditable
✔ reversible

🧭 Regla final del Core

Si para agregar un módulo tenés que tocar el Core → el diseño falló.

Y vos lo estás evitando desde ya 👏

🔥 ¿Cómo seguimos?

Ahora estamos en modo plataforma madura.
Las rutas lógicas son:

7️⃣ Modelo SQL definitivo (append-only + decimales)
8️⃣ API pública del SDK (qué ve el mundo exterior)
9️⃣ Casos reales completos (Retail / Taller / Clínica)

Yo seguiría con 7️⃣ SQL, porque ahí se materializa todo esto 🧱
¿Le damos?

okay, el 7!

😼🔥 Ahora sí entramos al terreno donde la arquitectura se vuelve REAL
El 7️⃣ Modelo SQL definitivo es donde tu diseño demuestra si aguanta 5–10 años sin romperse.

Voy a estructurarlo así:

Principios SQL

Esquema base (append-only real)

Manejo de decimales

Reservas

Transferencias

Versionado + sync

Ejemplos reales

Todo pensado para PostgreSQL (cloud) y SQLite (local).

🧱 7️⃣ Modelo SQL Definitivo – Inventario Hubbi
🧠 Principios SQL (no negociables)

1️⃣ Append-only

Nunca UPDATE qty

Nunca DELETE movements

2️⃣ Derivación

Stock = SUM(movements)

Reservado = SUM(reservations)

3️⃣ Decimal preciso

Nada de FLOAT

Nada de INTEGER “por comodidad”

4️⃣ Reproducible

Podés reconstruir el inventario a cualquier fecha

📦 Esquema Base
items
CREATE TABLE items (
    id UUID PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- product, service, asset
    quantity_rules JSONB NOT NULL, -- min_unit, step, precision
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

warehouses
CREATE TABLE warehouses (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID NULL REFERENCES warehouses(id)
);

locations
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    name TEXT NOT NULL,
    parent_id UUID NULL REFERENCES locations(id)
);

🧾 Movimientos (el corazón)
inventory_movements
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES items(id),
    movement_type TEXT NOT NULL,
    quantity NUMERIC(20,4) NOT NULL,
    source_location_id UUID NULL REFERENCES locations(id),
    target_location_id UUID NULL REFERENCES locations(id),
    document_ref UUID NULL,
    attributes JSONB DEFAULT '{}',
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


📌 quantity siempre positiva
📌 El signo lo define el movement_type

🟣 Reservas
inventory_reservations
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES items(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    quantity NUMERIC(20,4) NOT NULL,
    context_type TEXT NOT NULL, -- work_order, project
    context_id UUID NOT NULL,
    status TEXT NOT NULL, -- active, consumed, released
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

🔵 Transferencias

No hay tabla especial.

Una transferencia =

TRANSFER_OUT

TRANSFER_IN

Ambos comparten document_ref.

🔢 Decimales y fracciones
Regla SQL
quantity NUMERIC(20,4)


Precisión suficiente para:

granel

líquidos

tiempo

El Core valida step/min_unit

SQL solo guarda

📊 Vistas Derivadas (performance)
Stock actual por ítem y ubicación
CREATE VIEW inventory_stock AS
SELECT
  item_id,
  COALESCE(target_location_id, source_location_id) AS location_id,
  SUM(
    CASE
      WHEN movement_type IN ('PURCHASE_RECEIPT','ADJUSTMENT_GAIN','TRANSFER_IN')
        THEN quantity
      ELSE -quantity
    END
  ) AS stock
FROM inventory_movements
GROUP BY item_id, location_id;


📌 En producción: materialized view + refresh incremental

🧠 Reservado vs disponible
available = stock - reserved


Reservado se calcula desde inventory_reservations.

🔄 Versionado y Sync
IDs

SQLite: UUID local

Postgres: UUID global

Mapeo en sync table

sync_map (
  local_id UUID,
  global_id UUID,
  entity TEXT
)

🧪 Ejemplo real – Aceite fraccional

Movimiento

INSERT INTO inventory_movements (
  id, item_id, movement_type, quantity, target_location_id, occurred_at
)
VALUES (
  gen_random_uuid(),
  'item_aceite',
  'CONSUMPTION_INTERNAL',
  2.75,
  'loc_taller',
  NOW()
);


✔ exacto
✔ auditable
✔ reversible

🧠 Auditoría legal (El Salvador)

Nada se borra

Nada se edita

Cada movimiento tiene:

fecha

usuario (vía audit log)

documento

Cumple Código Tributario Art. 142 sin inventar nada raro.

🧭 Regla final SQL

Si necesitás UPDATE para “arreglar” stock → el modelo está mal.

Y acá no lo necesitás 😏

🔥 Estado actual de Hubbi

A este punto ya tenés:

✅ Core sólido
✅ Movements ERP-grade
✅ Decimales reales
✅ SQL limpio
✅ Offline-friendly
✅ Auditoría legal

Esto ya es plataforma seria, no MVP.

¿Cómo querés cerrar este ciclo?

Opciones naturales:

8️⃣ API pública del SDK (qué ve React / otros módulos)
9️⃣ Casos reales completos (Retail / Taller / Clínica)
🔟 Estrategia de performance (índices, caching, colas)

Yo seguiría con 8️⃣ SDK, porque conecta todo con la app.
¿Seguimos? 🚀

sigamos con el 8, 9 y 10!

😼🔥 Vamos con todo entonces.
Acá cerramos el diseño end-to-end de Hubbi Inventario:
Core → SDK → Casos reales → Performance real.

Voy en orden 8 → 9 → 10, y al final te dejo una foto completa del sistema.

8️⃣ API Pública del SDK (la cara del Core)
🧠 Principio del SDK

El SDK orquesta, valida UX y conecta módulos.
Nunca “piensa” inventario.

El SDK:

llama al Core

persiste

emite eventos

maneja offline / sync

🧱 Capas del SDK
UI
 ↓
SDK (TypeScript)
 ↓
Core (Rust / WASM)
 ↓
Persistencia / Sync

📦 API Pública – Diseño
Crear movimiento
hubbi.inventory.createMovement({
  itemId: "item_123",
  movementType: "CONSUMPTION_INTERNAL",
  quantity: "2.75",
  sourceLocationId: "loc_taller",
  attributes: {
    reason: "Cambio de aceite",
    serials: []
  }
})

Qué hace internamente

Valida input básico (UI friendly)

Construye InventoryMovement

Llama al Core:

validate_movement

apply_movement

Persiste (append-only)

Emite eventos

Devuelve resultado

📤 Respuesta del SDK
{
  success: true,
  movementId: "mov_456",
  newState: {
    stock: "8.00",
    reserved: "2.00"
  }
}

🧩 API de lectura (derivada)
Stock actual
hubbi.inventory.getStock({
  itemId,
  locationId
})


👉 Nunca devuelve “guardado”, siempre derivado.

🔌 API de eventos (para módulos)
hubbi.events.on(
  "inventory.stock.consumed",
  (event) => { ... }
)


Inventario no sabe quién escucha.

9️⃣ Casos Reales Completos (vida real, no demo)
🛒 Caso 1: Retail
Flujo

Compra mercadería
→ PURCHASE_RECEIPT

Venta
→ SALE_ISSUE
→ evento inventory.stock.issued

Facturación escucha
→ genera DTE

📌 Inventario no conoce IVA

🔧 Caso 2: Taller mecánico
Flujo

Crear OT
→ RESERVATION_CREATE

Mecánico usa repuesto
→ RESERVATION_CONSUME
→ CONSUMPTION_INTERNAL

Cliente paga
→ Facturación escucha

📌 Stock ya fue consumido antes del cobro

🏥 Caso 3: Clínica
Flujo

Insumos con vencimiento
→ PURCHASE_RECEIPT

Uso en paciente
→ CONSUMPTION_INTERNAL

Auditoría
→ trazabilidad por lote / fecha

📌 No existe “venta” en inventario

🏭 Caso 4: Producción
Flujo

Consumo materia prima
→ PRODUCTION_CONSUME

Producto terminado
→ PRODUCTION_OUTPUT

📌 Inventario solo ve hechos físicos

⏱ Caso 5: Servicios / tiempo
Item
Mano de obra
min_unit = 0.25

Movimiento
CONSUMPTION_INTERNAL qty=1.75


✔ decimal
✔ auditable
✔ reutiliza Core

🔟 Performance, Escala y Operación Real

Este punto es lo que diferencia ERP serio de sistema lento.

🧠 Principios de performance

1️⃣ Leer derivado, escribir append-only
2️⃣ Cachear resultados, no hechos
3️⃣ Nunca recalcular todo
4️⃣ Optimizar por item + ubicación

🗂 Índices críticos
CREATE INDEX idx_movements_item
ON inventory_movements(item_id);

CREATE INDEX idx_movements_location
ON inventory_movements(target_location_id);

CREATE INDEX idx_movements_occurred
ON inventory_movements(occurred_at);

📊 Materialized Views
Stock por item + ubicación

refresco incremental

por rango de fechas

por item modificado

🔄 Offline & Sync
Cola local

movimientos pendientes

idempotencia por UUID

replay seguro

Conflictos

detectados por versión

nunca overwrite

resolución explícita

🧠 Cache inteligente (SDK)
Cache key:
item_id + location_id + last_movement_id


Si no cambió → no recalcular.

⚠️ Antipatrones evitados

❌ guardar stock en items
❌ triggers mágicos
❌ recalcular todo
❌ lógica en SQL
❌ floats

🏁 FOTO FINAL DEL SISTEMA

A este punto Hubbi tiene:

✅ Core matemático reutilizable
✅ Inventario universal
✅ Decimales reales
✅ Offline-first
✅ Auditoría legal
✅ Integración limpia
✅ Performance ERP-grade

Esto no es un módulo,
es infraestructura de plataforma 👑