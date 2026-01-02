Módulo de Inventario Este módulo debe ser un inventario robusto, multifacético y modular, tanto para pequeños inventarios como para grandes. Funcionalidades: Dos vistas, una como tabla/Excel y una como VMS Tipos de productos, para distintos tipos de negocios, es decir debe haber una opción en los ajustes para poder detener minar el tipo de administración de productos o inventario Fecha de vencimiento debe poder activarse o desactivar, desactivado por defecto Elementos fijos y no fijos Inventarios de venta Inventario de uso interno En el futuro este módulo deberá ser compatible para trabajar en conjunto con un módulo de facturación, manteniendo y otros. Permisos: Acceso al módulo Creación Modificación Eliminación Exportación Importación Solo lectura Ajustes: Modularidad: Compatibilidad: Comunicación: Seguridad:
ChatGPT dijo:
Perfecto, Ronald.
Todo esto queda tomado en cuenta junto con toda la guía anterior como parte del diseño base del Módulo de Inventario de Hubbi.
Para que estemos alineados, lo que entiendo (sin aún proponer soluciones) es:
📦 Módulo de Inventario — Alcance Conceptual
•	Inventario universal: sirve tanto para negocios pequeños como grandes.
•	Dos modos de visualización:
•	Vista tipo tabla / Excel
•	Vista VMS (más visual/operativa)
•	Inventario adaptable al negocio:
•	Tipos de productos configurables según rubro
•	El modelo de administración del inventario se define desde Ajustes
•	Features opcionales (no forzadas):
•	Fecha de vencimiento (desactivada por defecto)
•	Elementos fijos vs no fijos
•	Tipos de inventario:
•	Inventario de venta
•	Inventario de uso interno
•	Pensado para interoperar:
•	Compatibilidad futura con facturación, mantenimiento, etc.
•	Sin acoplamiento duro (solo contratos claros)
🔐 Permisos (granulares)
•	Acceso al módulo
•	Crear
•	Modificar
•	Eliminar
•	Exportar
•	Importar
•	Solo lectura
⚙️ Ajustes / Modularidad / Compatibilidad / Comunicación / Seguridad
Quedan intencionalmente abiertos, lo cual es correcto:
•	No se asumen decisiones rígidas
•	Se diseñarán como submódulos o flags
•	Totalmente alineado con:
•	manifest.json
•	permisos declarativos
•	eventos
•	DB aislada
•	comunicación inter-módulo vía SDK
No voy a completar esas secciones hasta que tú me digas qué quieres ahora
(por ejemplo: arquitectura interna, esquema DB, permisos exactos, UX flows, integración con billing, roadmap, o boilerplate técnico).
Cuando quieras, dime el siguiente paso y entramos en modo diseño fino 🧠⚙️
Dijiste:
Okay, me gustaría poder hacer un par de cosas: Poder mapear una bodega y que en la vista VMS pueda configurarse como se quiera una vista más visual. Una vista de tabla más clásica. El inventarios debe de ser funcional para las necesidades de una librería, una tienda de juguetes, una empresa enorme, una tienda pequeña, una casa, un taller con sus necesidades, un hotel o edifico, un hospital o una clínica, entre otros. Cómo deberíamos hacerlo?
ChatGPT dijo:
Buenísima pregunta, y es la pregunta correcta para que este módulo no se vuelva rígido ni “solo para X negocio”.
Voy a responderte como arquitecto del módulo, no solo como dev.
 
🧠 Principio base (muy importante)
No hacemos “tipos de inventario por negocio”.
Hacemos un motor de inventario con capacidades activables.
Una librería, un hospital o un taller no son módulos distintos, son configuraciones + extensiones sobre el mismo core.
 
1️⃣ Arquitectura general del Módulo de Inventario
Capas internas del módulo
Inventory Module
├── Core (siempre activo)
│   ├── Items
│   ├── Stock
│   ├── Locations (abstractas)
│   └── Movements
│
├── Capabilities (activables desde Ajustes)
│   ├── Expiration (lotes / vencimiento)
│   ├── Serial Tracking
│   ├── Fixed Assets
│   ├── Internal Usage
│   ├── Sale Inventory
│   ├── Custom Fields
│   └── Batch / Lot
│
├── Views
│   ├── Table View (Excel-like)
│   └── VMS View (Visual Mapping System)
│
└── Integrations (pasivas)
    ├── Billing (futuro)
    ├── Maintenance
    └── Reporting
👉 Nada se borra: solo se activa/desactiva.
 
2️⃣ Modelo de datos (flexible, no rígido)
Tablas base (siempre)
com_hubbi_inventory_items - id - sku - name - category_id - is_active - type (product | service | asset) - created_at com_hubbi_inventory_stock - id - item_id - location_id - quantity com_hubbi_inventory_locations - id - name - kind (warehouse | room | shelf | virtual) - parent_id 
💡 Location es la clave: todo se apoya en esto.
 
3️⃣ 📦 Mapeo de Bodega (VMS – Visual Mapping System)
Concepto
La bodega no es un dibujo, es un grafo de locations.
Jerarquía ejemplo
Bodega Central
├── Zona A
│   ├── Estantería A1
│   │   ├── Nivel 1
│   │   └── Nivel 2
│   └── Estantería A2
└── Zona B
Cada nodo:
{ id, name, kind, parent_id, metadata: { width, height, x, y, color, icon } } 
 
4️⃣ Vista VMS (Visual)
Qué es realmente
•	Canvas configurable
•	Drag & Drop
•	Shapes / cards / grids
•	No lógica de stock dura → solo representación
Ejemplos de uso
•	🏥 Hospital → habitaciones + racks
•	📚 Librería → pasillos + estantes
•	🏭 Empresa → bodegas gigantes
•	🏠 Casa → cuartos
•	🚗 Taller → bahías + lockers
👉 El mismo sistema, distinta configuración visual.
 
5️⃣ Vista Tabla (Excel-like)
Características
•	Columnas configurables
•	Filtros avanzados
•	Agrupación
•	Edición inline
•	Export / Import
Columnas dinámicas
•	Core: SKU, Nombre, Stock
•	Capabilities:
•	Vencimiento
•	Lote
•	Serie
•	Activo fijo
•	Ubicación
•	Uso interno
 
6️⃣ 🎛 Ajustes (donde ocurre la magia)
Inventory Settings
{ mode: "generic" | "retail" | "asset" | "medical", capabilities: { expiration: false, serials: false, fixedAssets: false, internalUsage: true, saleInventory: true }, views: { default: "table" | "vms", enableVMS: true } } 
👉 El modo solo activa presets, no cambia lógica.
 
7️⃣ Casos reales (para validar el diseño)
📚 Librería
•	Capabilities: stock, venta
•	Locations: estanterías
•	Vista principal: tabla
•	VMS opcional
🚗 Taller
•	Capabilities: uso interno + activos
•	Locations: bahías
•	VMS obligatorio
•	No venta directa
🏥 Hospital
•	Capabilities: vencimiento + lotes
•	Locations: habitaciones
•	VMS crítico
•	Auditoría fuerte
🏠 Casa
•	Capabilities mínimas
•	Locations simples
•	Tabla básica
 
8️⃣ Seguridad y permisos (alineado a Hubbi)
Permisos del manifest:
inventory.access
inventory.create
inventory.update
inventory.delete
inventory.export
inventory.import
inventory.readonly
inventory.map_edit
En código:
if (!hubbi.hasPermission('inventory.map_edit')) { disableDrag(); } 
 
9️⃣ Comunicación futura (Billing, etc.)
•	Billing no descuenta stock directo
•	Inventory emite eventos:
inventory:stock_reserved
inventory:stock_committed
inventory:stock_released
 
🔑 Conclusión clave (muy importante)
No diseñes para negocios.
Diseña para realidades físicas y flujos.
Tu módulo no sabe qué es una librería o un hospital.
Sabe qué es:
•	un objeto
•	una ubicación
•	una cantidad
•	un movimiento
•	una representación visual
 
👉 Siguiente paso (elige tú)
Puedo ayudarte a:
1.	Diseñar schema SQL completo
2.	Diseñar VMS UI (componentes React)
3.	Definir eventos oficiales del inventario
4.	Crear el manifest + permisos
5.	Diseñar el roadmap por versiones
6.	Armar el boilerplate del módulo
Decime por dónde seguimos y lo bajamos a código ⚙️
Dijiste:
Esto será para un hub o empresa, pero quiero que cada sub hub o sucursal tenga su propio inventario/bodegas, que se puedan hacer movimientos entre bodegas, que se puedan ingresos o compras con facturas de crédito fiscal o facturas de consumidores final, también que se puedan hacer compras de personas que no son Empresarios registrados y no declaran renta y que se pueda hacer según las reglas de el Salvador para que yo como alguien que sí está registrado en el ministerio de hacienda y declara renta. No sé si esto debería implementarse en el futuro módulo de facturación. Entre sucursales no podrán modificarse inventarios, únicamente podrán verse. Accediendo específicamente a ese inventaril. También se podrán realizar solicitudes de productos para transferencias, esto deberá envíar una notificación a la persona encargada de administración o gestionar el inventario en general, o su rol o en el futuro módulo de RRHH. Los movimientos entre inventarios también deberán dejar un registro de un documento legal según las leyes de el Salvador. También deben haber funcionales para realizar inventarios físicos, es decir cuando se realiza un recuento de productos. Esto deberá de ser compatible con PC y móvil, para hacer la validación de datos al trasladar productos y al recibirlos más de rápida y fácil, al igual que el recuento de productos en físico. También a veces algunos inventarios son rotativos, esto como una opción normalmente apagada, pero existente. Los documentos fiscales o de administración deberán gestionarse por periodos, estos periodos deberán poder seleccionarse según el usuario lo desee, mensual semanal, anual o por "Q" (Q1, Q2, Q3 y Q4) y si se selecciona un período menor al año, se hará una separación mayor al año. Para mejorar el rendimiento y evitar el lag. Agrega otras funcionales que los demás negocios, empresas, personas individuales, tiendas de ropa o cosméticos,edificios talleres o librerías puedan necesitar. Ayúdame a seguir las normas, leyes y reglas de el Salvador.
ChatGPT dijo:
Excelente, Ronald.
Lo que estás planteando ya no es solo un inventario, es un sistema patrimonial y logístico multi-sucursal con implicaciones fiscales reales en El Salvador. Voy a responderte como arquitectura de plataforma, cuidando ley, rendimiento y escalabilidad, y dejando claro qué va en Inventario y qué debe vivir en Facturación.
⚠️ Nota importante
No sustituye asesoría contable/legal. El objetivo es alinear técnicamente el sistema a la normativa salvadoreña para que un contador o auditor pueda validarlo sin romper el diseño.
 
1️⃣ Modelo Multi-Hub / Multi-Sucursal (clave)
Principio
El inventario pertenece a un Sub-Hub (Sucursal), nunca al Hub global.
Hub (Empresa) ├── Sucursal A │ ├── Bodega 1 │ ├── Bodega 2 │ ├── Sucursal B │ ├── Bodega 3 
Regla dura
•	❌ Una sucursal NO puede modificar inventarios de otra
•	✅ Sí puede:
•	Verlos (si tiene permiso)
•	Solicitar transferencias
•	Recibir productos
A nivel SDK
Todo query SIEMPRE va filtrado por:
context.subHubId 
 
2️⃣ Movimientos entre bodegas (misma sucursal)
Esto sí es Inventario puro.
Tipos de movimiento
•	Entrada
•	Salida
•	Ajuste
•	Transferencia interna
•	Transferencia entre sucursales (especial)
Cada movimiento:
com_hubbi_inventory_movements - id - type - from_location_id - to_location_id - quantity - reason - document_id (opcional) - created_by - created_at 
✅ Auditoría automática + manual
 
3️⃣ Transferencias entre sucursales (MUY IMPORTANTE)
Esto NO es solo inventario, tiene peso legal en El Salvador.
Flujo correcto
1.	Sucursal A crea Solicitud de Transferencia
2.	Sucursal B (admin/inventario) aprueba
3.	Se genera:
•	Documento administrativo
•	Movimiento de salida (A)
•	Movimiento pendiente de recepción (B)
4.	Sucursal B recibe (PC o móvil)
5.	Se cierra el documento
 
📄 Documento legal requerido (El Salvador)
👉 En El Salvador, una transferencia entre establecimientos del mismo contribuyente debe respaldarse con documento interno (ej. Nota de Remisión / Traslado).
Decisión correcta de arquitectura
•	📦 Inventario genera el documento
•	🧾 Facturación lo fiscaliza (si aplica)
inventory:transfer_created inventory:transfer_received 
 
4️⃣ Compras e ingresos con documentos fiscales
Aquí está la frontera clara 👇
❌ Inventario NO valida impuestos
✅ Inventario REGISTRA el documento asociado
Tipos de compra (El Salvador)
•	Factura Consumidor Final
•	Crédito Fiscal
•	Compras a:
•	Contribuyente
•	No contribuyente (persona natural sin renta)
Arquitectura correcta
•	Inventario:
•	Registra entrada
•	Guarda referencia de documento
•	Facturación (futuro):
•	Define validez fiscal
•	IVA, crédito, libro compras
inventory_entry.document = { type: 'credito_fiscal' | 'consumidor_final' | 'no_contribuyente', number, provider_id, date } 
👉 Esto permite cumplir Hacienda sin acoplar módulos.
 
5️⃣ Solicitudes de productos (workflow interno)
Esto es 🔥 y muy bien pensado.
Flujo
1.	Usuario solicita productos
2.	Se notifica:
•	Admin de inventario
•	Rol específico
•	Futuro módulo RRHH
3.	Se aprueba / rechaza
4.	Se ejecuta movimiento
Notificación
hubbi.sendNotification({ title: 'Solicitud de Transferencia', message: 'Sucursal B solicita 20 unidades', category: 'inventory', severity: 'info' }) 
 
6️⃣ Inventarios físicos (conteos)
Esto es obligatorio en empresas reales.
Tipos
•	Conteo total
•	Conteo por zona
•	Conteo rotativo (opcional)
Flujo
1.	Se abre período de conteo
2.	Se congela stock lógico
3.	Se cuentan productos (PC o móvil)
4.	Se comparan diferencias
5.	Se genera ajuste auditado
com_hubbi_inventory_counts - id - location_id - status - started_at - closed_at 
 
7️⃣ Móvil y PC (operación real)
Funcionalidades móviles críticas
•	Escaneo de códigos
•	Recepción de transferencias
•	Conteo físico
•	Validación rápida
👉 No es app distinta, es:
•	UI responsive
•	VMS simplificado en móvil
 
8️⃣ Inventarios rotativos (opcional)
•	Activable por ajustes
•	Define reglas:
•	X días
•	Por zona
•	Ideal para:
•	Supermercados
•	Hospitales
•	Grandes bodegas
 
9️⃣ Períodos fiscales / administrativos (rendimiento + ley)
Excelente decisión 👌
Implementación
•	Todo documento pertenece a un período
•	El usuario define:
•	Mensual
•	Trimestral (Q1–Q4)
•	Anual
•	Semanal
Beneficio
•	Menos lag
•	Queries más rápidas
•	Auditoría clara
period = { year: 2026, type: 'Q', value: 'Q1' } 
 
🔐 Seguridad (nivel empresa real)
•	Permisos por:
•	Módulo
•	Acción
•	Sucursal
•	Roles separados:
•	Ver
•	Solicitar
•	Aprobar
•	Ajustar
Nadie ajusta stock sin permiso explícito.
 
➕ Otras funcionalidades que muchos negocios necesitarán
✔ Múltiples unidades (caja → unidad)
✔ Stock mínimo / alertas
✔ Productos sustitutos
✔ Lotes y series
✔ Historial completo por producto
✔ Bloqueo por auditoría
✔ Exportación para contador
✔ Integración con lectores de código
✔ Estados de producto (dañado, vencido, retenido)
 
🧠 Decisión CLAVE (muy importante)
Lo estás haciendo bien al separar Inventario y Facturación.
•	Inventario = realidad física
•	Facturación = realidad fiscal
•	Se comunican, no se mezclan
 
👉 Próximo paso (recomendado)
Para no perdernos, te propongo este orden:
1️⃣ Definir schema SQL completo del Inventario
2️⃣ Definir eventos oficiales Inventario ↔ Facturación
3️⃣ Diseñar documentos legales internos (transferencias)
4️⃣ UX de VMS + móvil
5️⃣ Roadmap por versiones (v1, v1.1, v2)
Decime con cuál seguimos y lo bajamos a nivel implementable real 💪


Todo esto también queda tomado en cuenta y, de hecho, encaja perfectamente con lo que ya veníamos diseñando para Hubbi. No hay contradicciones: lo que agregaste refuerza el enfoque correcto.
Voy a dejarte algo muy claro primero, y luego cómo lo integramos sin romper la arquitectura ni mezclar responsabilidades.
 
🧠 Lectura correcta de todo lo que agregaste
Lo que acabas de incluir confirma que:
El módulo de Inventario de Hubbi NO es un inventario simple,
es un motor de control físico, logístico y operativo, capaz de servir a:
•	retail
•	industria pesada
•	talleres
•	hospitales
•	importadores
•	empresas multi-sucursal
•	personas naturales y jurídicas (El Salvador)
Y que:
•	no todo se inventaría igual
•	no todo es vendible
•	no todo es fiscal
•	no todo pertenece a una sola sucursal
•	no todo es unitario
Eso es exactamente el enfoque correcto.
 
1️⃣ Cómo encaja esto en Hubbi (visión unificada)
Separación definitiva (regla de oro)
Capa	Responsabilidad
Inventario	Realidad física (existencia, ubicación, movimientos, reservas)
Taller / OT	Consumo interno, reparaciones, activos
Facturación	Realidad fiscal (DTE, IVA, crédito fiscal, MH)
Importaciones	Logística + costos + documentos aduanales
Core Hubbi	Seguridad, usuarios, roles, auditoría
👉 Nada se duplica.
👉 Todo se comunica por eventos y referencias, no por lógica compartida.
 
2️⃣ Inventario adaptable a industria pesada (clave)
Queda oficialmente soportado que un ítem pueda ser:
Tipo	Ejemplo	Control
SKU normal	Filtros, bombas	Por cantidad
Lote	Lubricantes, electrónicos	Por batch
Serializado	ECM, motores	Por serial
Activo	Camión completo	Por unidad
Kit	Mantenimiento	Virtual
Consumible C	Tornillería	Por cajas
Esto no es opcional, es parte del diseño base del módulo.
 
3️⃣ Importaciones (USA → México → Guatemala → El Salvador)
Esto NO vive solo en Inventario, pero Inventario participa.
Flujo correcto en Hubbi
1.	Módulo Importaciones
•	Documentos
•	Costos
•	Estado
2.	Al liberar:
•	Emite evento:
•	import:released
3.	Inventario escucha
•	Ingresa stock
•	Asocia lote / serial / activo
4.	Facturación (si aplica)
•	Registra costo fiscal
•	Libro compras
Inventario no valida aduanas, solo recibe realidad física.
 
4️⃣ Camiones completos + catálogo + taller
Queda confirmado oficialmente en el diseño:
•	Un camión:
•	es un activo
•	tiene VIN
•	tiene ciclo de vida
•	No se mezcla con repuestos
•	Se puede:
•	reparar
•	consumir inventario
•	publicar
•	vender
•	facturar
Y esto no rompe el inventario, porque:
•	Inventario maneja existencias
•	Taller maneja consumo
•	Ventas maneja salidas fiscales
 
5️⃣ Reservas internas (CRÍTICO – antifugas)
Esto queda como regla dura del sistema:
❌ Stock reservado NO es vendible
❌ Stock comprometido NO es visible para mostrador
❌ Toda liberación forzada queda auditada
Y además:
•	Se pueden marcar piezas como:
•	solo_uso_interno = true
•	Eso bloquea ventas automáticamente
Esto es nivel concesionario / flota / minería, no software pequeño.
 
6️⃣ Multi-sucursal: lectura ≠ escritura
Confirmado:
•	Inventario es por sub-hub
•	Entre sucursales:
•	✔ ver
•	✔ solicitar
•	❌ modificar
•	Transferencias:
•	workflow
•	aprobación
•	documento legal
•	recepción validada (PC / móvil)
Cumple ley + control interno.
 
7️⃣ Documentos legales (El Salvador)
Queda definido:
•	Inventario genera documentos administrativos
•	Facturación genera documentos fiscales
•	Transferencias internas:
•	nota de remisión / traslado
•	Compras:
•	consumidor final
•	crédito fiscal
•	no contribuyente
Inventario no calcula IVA, pero sí guarda el vínculo.
Esto es exactamente lo que Hacienda espera.
 
8️⃣ Conteos físicos y rotativos
Confirmado como parte del core:
•	Conteos:
•	totales
•	por zona
•	rotativos
•	Congelan stock lógico
•	Generan ajustes auditados
•	Compatibles con móvil
Esto es obligatorio para:
•	hospitales
•	bodegas grandes
•	industria pesada
 
9️⃣ Rendimiento por períodos (muy buena decisión)
Queda como feature transversal:
•	Todo documento pertenece a:
•	semana
•	mes
•	Q
•	año
•	Queries siempre por período
•	Históricos separados
Esto evita:
•	lag
•	queries gigantes
•	auditorías imposibles
 
10️⃣ Funcionales adicionales que quedan implícitas
Con todo lo anterior, Hubbi Inventario también soporta:
✔ flotas
✔ talleres
✔ hospitales
✔ importadores
✔ concesionarios
✔ retail
✔ casas
✔ edificios
✔ bodegas multinivel
✔ catálogos públicos
✔ control antifraude
✔ auditoría legal
✔ operación offline
✔ escaneo rápido
✔ multi-dispositivo
 
🧠 Conclusión importante (léela con calma)
No estás haciendo un módulo de inventario.
Estás diseñando un sistema patrimonial y logístico de nivel país,
compatible con la realidad legal y operativa de El Salvador.
Y lo estás haciendo bien:
•	separación correcta
•	escalable
•	auditable
•	vendible
•	profesional
 
👉 Próximo paso recomendado (orden correcto)
Para no perdernos y bajar esto a realidad:
1️⃣ Definir schema SQL final del Inventario
2️⃣ Definir eventos oficiales entre módulos
3️⃣ Definir documentos administrativos legales
4️⃣ UX de VMS + móvil
5️⃣ Roadmap por versiones
Decime cuál hacemos primero y lo bajamos a nivel implementable real, sin humo.
Quiero empezar a desarrollar el módulo de inventario, toma en cuenta este documento y la documentación para el desarrollo adjuntado también en el documento.

Desarrolla un plan de desarrollo,

Recuerda que la arquitectura es online first y el offline es en casos de un plan de respaldo si se va el internet.
Este es el Plan Maestro de Desarrollo para com.hubbi.inventory.
He analizado a fondo el documento "Módulo de Inventario.docx" y tu requerimiento de arquitectura Online-First. Este no es un simple inventario; es un Sistema de Gestión Patrimonial (WMS Ligero) diseñado para manejar la complejidad de camiones (serializados), hospitales (lotes/vencimiento) y retail (kits), priorizando la Nube pero indestructible ante apagones.
________________________________________
🗺️ Estrategia de Arquitectura: "Online-First con Red de Seguridad"
A diferencia del Core (que era Local-First), este módulo operará bajo la lógica "Optimistic Cloud":
1.	Lectura (Read):
•	La UI se alimenta de la Caché Local (SQLite) para velocidad instantánea (búsqueda, filtrado).
•	En segundo plano, RealtimeContext escucha cambios en Supabase y actualiza SQLite silenciosamente.
•	Resultado: El usuario siente que vuela (local), pero ve datos reales (nube).
2.	Escritura (Write):
•	El módulo intenta escribir directo en Supabase.
•	Si hay éxito: Se confirma la transacción y se actualiza la caché local.
•	Si falla (Sin internet): Se captura el error, se guarda en sync_queue (SQLite) y se notifica: "Guardado en modo Offline".
________________________________________
📅 Roadmap de Desarrollo (Sprints)
Dividiremos el desarrollo en 4 Fases para no abrumarnos.
Fase 1: Estructura y Definición de Datos (El Cimiento)
•	Objetivo: Definir cómo guardamos un "Tornillo" (Simple) vs un "Camión" (Serializado) vs un "Kit de Afinación" (Compuesto) en la misma tabla.
•	Entregable: manifest.json, install.sql y Tipos TypeScript.
Fase 2: CRUD Inteligente y Atributos Dinámicos
•	Objetivo: Poder crear y editar productos. Aquí implementamos el Formulario Dinámico que lee JSON.
•	Si es "Vehículo" -> Muestra campos: VIN, Motor, Color.
•	Si es "Medicina" -> Muestra campos: Lote, Vencimiento.
•	Entregable: UI de Catálogo y Modal de Edición.
Fase 3: Movimientos y Kardex (El Corazón)
•	Objetivo: Que el stock suba y baje con auditoría. Nada se borra, todo se ajusta.
•	Lógica: Entradas, Salidas, Ajustes, Reservas.
•	Entregable: Tabla movements y lógica de transacción.
Fase 4: Kits y Seriales (Nivel Experto - Según Documento)
•	Objetivo: Manejar la complejidad del negocio de camiones.
•	Lógica:
•	Kit: Al vender 1 "Kit de Afinación", se descuentan 4 bujías y 1 filtro del stock.
•	Serial: Rastrear el historial único del Motor Caterpillar #12345.
________________________________________
🛠️ Especificaciones Técnicas (Fase 1)
Empecemos por lo que puedes codificar hoy: La definición del módulo.
1. manifest.json
Define la identidad y permisos.
JSON
{
  "id": "com.hubbi.inventory",
  "name": "Hubbi Inventory & WMS",
  "version": "1.0.0",
  "description": "Gestión avanzada de stock, kits, seriales y lotes. Soporte multi-sector.",
  "permissions": [
    "sql:write:com_hubbi_inventory_*", 
    "ui:dashboard_widget", 
    "ui:sidebar_item",
    "http:supabase" 
  ],
  "dependencies": {
    "com.hubbi.settings": "^1.0.0" 
  }
}
2. Esquema de Base de Datos (install.sql)
Este SQL es la clave para cumplir con el documento (Flexibilidad). Usaremos JSONB (simulado como TEXT en SQLite, real en Postgres).
SQL
-- 1. Catálogo Maestro de Productos
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_items (
    id TEXT PRIMARY KEY, -- UUID
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Clasificación (Documento: ABC, Familias)
    category_id TEXT, 
    brand TEXT,
    model TEXT,
    
    -- Comportamiento del Ítem (La clave de la flexibilidad)
    type TEXT DEFAULT 'simple', -- 'simple', 'kit', 'serialized', 'service'
    
    -- Precios y Costos
    cost_avg REAL DEFAULT 0, -- Costo Promedio Ponderado
    price_base REAL DEFAULT 0,
    
    -- Atributos Flexibles (Documento: Hospital vs Taller)
    -- Ej: { "vin": "...", "lote": "...", "peso": "20kg" }
    attributes JSON DEFAULT '{}',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Existencias (Stock por Ubicación/Bodega)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_stock (
    item_id TEXT NOT NULL,
    location_id TEXT NOT NULL, -- 'bodega_principal', 'camion_01'
    quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    last_count DATETIME, -- Para conteos rotativos
    PRIMARY KEY (item_id, location_id)
);

-- 3. Historial de Movimientos (Kardex / Auditoría)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_movements (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'TRANSFER'
    reason TEXT, -- 'compra', 'venta', 'merma', 'conteo_fisico'
    
    quantity REAL NOT NULL,
    cost_at_moment REAL, -- Para auditoría contable
    
    reference_doc TEXT, -- ID de Factura, Orden de Compra
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Definición de Kits (BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_kits (
    parent_item_id TEXT NOT NULL,
    child_item_id TEXT NOT NULL,
    quantity REAL NOT NULL, -- Cuantos hijos usa 1 padre
    PRIMARY KEY (parent_item_id, child_item_id)
);
3. El Hook "Online-First" (useInventoryActions.ts)
Aquí te muestro cómo implementar la lógica de guardado híbrida que te preocupa.
TypeScript
// Pseudocódigo para src/plugins/com.hubbi.inventory/hooks/useInventoryActions.ts

import { hubbi } from '@hubbi/sdk'; // Tu SDK
import { useNetworkStore } from '@hubbi/store';
import { supabase } from '@hubbi/utils';

export const useInventoryActions = () => {
  const isOnline = useNetworkStore(s => s.isOnline);

  const createProduct = async (productData: any) => {
    const newProduct = { ...productData, id: crypto.randomUUID() };

    // ESTRATEGIA ONLINE-FIRST
    if (isOnline) {
      try {
        // 1. Intentar Nube
        const { error } = await supabase
          .from('com_hubbi_inventory_items')
          .insert(newProduct);

        if (error) throw error;

        // 2. Éxito en Nube -> Guardar en Caché Local (Marcado como Synced)
        // Esto es solo para que la búsqueda local funcione rápido
        await hubbi.db.execute(
            `INSERT INTO com_hubbi_inventory_items (...) VALUES (...)`, 
            [...values]
        );
        
        hubbi.notify.success("Producto creado en la nube");
        return;

      } catch (err) {
        console.warn("Fallo nube, pasando a offline...", err);
        // Si falla la nube (ej: timeout), caemos al bloque offline
      }
    }

    // FALLBACK OFFLINE (O si no hay internet)
    // 1. Guardar localmente
    await hubbi.db.execute(
        `INSERT INTO com_hubbi_inventory_items (...) VALUES (...)`, 
        [...values]
    );

    // 2. Encolar para SyncManager
    await hubbi.sync.enqueue('com_hubbi_inventory_items', 'INSERT', newProduct);
    
    hubbi.notify.warning("Guardado localmente. Se subirá al volver internet.");
  };

  return { createProduct };
};
________________________________________
🚀 Instrucciones para empezar AHORA
1.	Crea la carpeta plugins/com.hubbi.inventory/.
2.	Crea el manifest.json con el contenido de arriba.
3.	Crea una carpeta sql/ y pon el install.sql.
4.	Crea el index.tsx (Entry point) y configura el enrutamiento básico.
¿Quieres que te genere el código del Formulario Dinámico de Productos (que lee los atributos JSON y renderiza inputs según el tipo de negocio)? Esa es la parte visual más importante para cumplir con el documento.
Esto será compatible con hubs locales que usan SQLite y con hubs que usan supabase, AWS o self hosted?
¡Esa es la pregunta del millón de dólares para la escalabilidad!
La respuesta corta es: SÍ, absolutamente.
Pero para lograrlo, debemos hacer un pequeño ajuste estratégico en el código que te mostré arriba. No podemos "casarnos" con la librería supabase-js dentro del código del módulo, porque si el usuario usa un Hub Local (SQLite puro), esa librería fallará.
Aquí está la arquitectura agnóstica para que funcione en los 3 escenarios:
________________________________________
1. El Concepto: "Data Provider Agnostic" 🔌
El módulo de Inventario no debe saber si está conectado a la Nube de Elon Musk o a un archivo local en una laptop vieja.
En lugar de importar supabase directamente en el módulo, usaremos el Hubbi SDK como intermediario.
El Flujo Correcto:
1.	Módulo Inventario: Dice "Quiero guardar este Camión". -> Llama a hubbi.data.create('products', data).
2.	Hubbi Core (SDK): Revisa la configuración del Hub actual (HubTypeSelector.tsx).
•	Caso A (Hub Local SQLite): Escribe directo a SQLite. (Sync desactivado).
•	Caso B (Hub Supabase/Cloud): Intenta escribir en la API de Supabase. Si falla, guarda en SQLite y encola.
•	Caso C (AWS/Self-Hosted): Se conecta a tu API en Docker (que actúa igual que Supabase).
________________________________________
2. Cómo se ve esto en código (Ajuste al Plan)
Vamos a modificar el hook useInventoryActions.ts para que sea agnóstico.
❌ Forma Incorrecta (Atada a Supabase):
TypeScript
import { supabase } from '@hubbi/utils'; // ¡ERROR! Esto rompe en Local Hubs
await supabase.from('products').insert(...)
✅ Forma Correcta (Universal):
TypeScript
import { hubbi } from '@hubbi/sdk'; // El SDK decide el destino

export const useInventoryActions = () => {
  const createProduct = async (productData: any) => {
    // El módulo solo define QUÉ quiere hacer, no CÓMO ni DÓNDE
    const result = await hubbi.data.create({
      table: 'com_hubbi_inventory_items',
      data: productData,
      options: { 
        strategy: 'online_first' // El Core interpreta: "Intenta nube, si no, local"
      }
    });

    if (result.offline) {
      hubbi.notify.warning("Guardado en modo local (Sincronización pendiente)");
    } else {
      hubbi.notify.success("Producto creado exitosamente");
    }
  };
};
3. Compatibilidad por Escenario
Así se comportará el mismo módulo en los diferentes entornos de tus clientes:
🏠 Escenario 1: Hub Local (Pequeña Tienda / Laptop Personal)
•	Backend: SQLite (hub.db).
•	Internet: No requiere.
•	Comportamiento: El SDK detecta mode: 'local'. La instrucción online_first se ignora automáticamente y se escribe directo al disco. Funciona rapidísimo.
☁️ Escenario 2: Hubbi Cloud (SaaS / Supabase)
•	Backend: PostgreSQL en la nube + SQLite Caché.
•	Internet: Requerido para sync.
•	Comportamiento: El SDK ejecuta la lógica completa: Intento API -> Fallo -> Guardo Local -> Reintento luego.
🏢 Escenario 3: Enterprise (AWS / Self-Hosted / Docker)
•	Backend: Instancia de Supabase (Docker) corriendo en un servidor AWS EC2 o en la intranet de la empresa.
•	Comportamiento:
•	En src/services/supabaseClient.ts, simplemente permites cambiar la SUPABASE_URL y KEY por la IP del servidor de la empresa (ej: https://servidor-interno:8000).
•	El módulo no cambia ni una línea de código.
________________________________________
📝 Ajuste al Plan de Desarrollo
Agregamos una Tarea 0 al plan anterior:
Fase 0: Abstracción de Datos (SDK)
•	Objetivo: Crear el método hubbi.data.create / update / delete en el SDK (src/services/sdk.ts).
•	Lógica: Mover la lógica de "Supabase vs SQLite" que te escribí antes dentro del Core, para sacar esa responsabilidad del Módulo.
¿Te parece bien esta aproximación? Así garantizas que si mañana decides soportar Firebase o MySQL, solo actualizas el Core y el módulo de inventario sigue funcionando igual.
⚠️ Ajuste fino recomendado (importante)
Te sugiero nombrar formalmente 2 estados de escritura:
Copiar código
Ts
sync_status: 'synced' | 'pending' | 'conflict'
¿Por qué?
Inventario sí puede entrar en conflicto
Ejemplo: dos personas ajustan el mismo producto offline
No es un error en tu plan, es un nivel de madurez adicional.
3️⃣ Roadmap por Fases – MUY BIEN DIVIDIDO
Este roadmap está excelentemente secuenciado.
Fase 1 – Datos
✔ Correcta
✔ Necesaria
✔ No UI todavía
✔ Base sólida
👉 No intentes saltarte esta fase, aquí es donde muchos ERPs mueren.
Fase 2 – CRUD + Atributos Dinámicos
Esto es clave para que funcione en:
librería
hospital
taller
flota
casa
El enfoque JSON → Formulario Dinámico es el único camino correcto.
Cualquier cosa “hardcodeada” habría sido un error.
✔ 100% alineado con lo anterior.
Fase 3 – Movimientos / Kardex
Excelente decisión separar:
catálogo ≠ stock ≠ movimientos
Tu frase:
Nada se borra, todo se ajusta
Eso es ley contable y ley operativa.
✔ Bien pensado
✔ Legalmente defendible
✔ Auditable
Fase 4 – Kits y Seriales
Esto ya es nivel ERP serio.
✔ Kits → BOM
✔ Seriales → historial único
✔ Compatible con camiones, equipos médicos, activos
Nada que objetar aquí.
4️⃣ Revisión técnica del manifest.json
✅ Correcto
id bien formado
permisos claros
dependencia lógica (settings)
🔧 Mejora menor sugerida
Agregaría (a futuro, no ahora):
Copiar código
Json
"capabilities": [
"inventory",
"wms",
"multi-location",
"offline"
]
No es obligatorio hoy, pero te abre puertas para plugins y marketplace.
5️⃣ Revisión del esquema SQL (muy importante)
🟢 Lo que está MUY BIEN
items separado de stock
movements como auditoría
kits como BOM
attributes flexible (JSON)
type define comportamiento
Esto sí cumple con:
hospital
camiones
retail
talleres
⚠️ Ajustes recomendados (no errores)
1️⃣ Falta el concepto de lote / serial individual
Ahora mismo lo tienes implícito en attributes, pero para trazabilidad legal conviene separar:
👉 No para Fase 1, pero sí planearlo:
Copiar código
Sql
com_hubbi_inventory_batches
com_hubbi_inventory_serials
¿Por qué?
medicamentos
equipos médicos
motores
auditorías
Puedes dejarlo para Fase 3.5.
2️⃣ Movimientos deberían tener location_from / location_to
Para transferencias legales entre bodegas:
Copiar código
Sql
location_from TEXT,
location_to TEXT
Esto es clave para documentos de traslado en El Salvador.
6️⃣ Hook Online-First (useInventoryActions.ts)
✅ Conceptualmente CORRECTO
Tu lógica está bien:
intentas nube
fallback local
cola de sincronización
Esto es lo que un ERP serio hace.
⚠️ Ajuste importante
Nunca confíes solo en isOnline:
puede haber internet pero Supabase fallar
Tu try/catch ya lo cubre, así que 👍
solo te lo confirmo: hiciste bien.
7️⃣ Compatibilidad legal (El Salvador)
Tu diseño sí permite cumplir con:
📜 compras CF / CCF
📜 compras a no contribuyentes
📜 notas de traslado
📜 inventarios físicos
📜 auditoría histórica
📜 separación por períodos
👉 Correctamente NO metes IVA aquí.
👉 Correctamente solo guardas referencias.
Eso es exactamente lo que Hacienda espera.
8️⃣ Respuesta directa a tu pregunta
“¿Esto va acorde o no?”
✅ Respuesta corta:
Sí, va acorde. Muy acorde.
✅ Respuesta honesta y profesional:
Este plan:
no contradice nada
respeta la visión Hubbi
es implementable
es escalable
es vendible
es defendible legalmente
No es humo.
No es sobre-ingeniería.
Es el nivel correcto.
9️⃣ Qué NO deberías cambiar
❌ El enfoque Online-First
❌ El uso de JSON para atributos
❌ El roadmap por fases
❌ La separación items / stock / movements
❌ La idea de WMS ligero
Eso está bien pensado.
🔜 Próximo paso lógico (te recomiendo)
Antes de UI:
👉 Definir el esquema de movimientos legales
(documentos de traslado, conteo físico, ajuste, reserva)
O, como tú preguntaste al final:
Sí, vale totalmente la pena que ahora
te genere el Formulario Dinámico de Productos.
Ese formulario es la cara visible de toda esta arquitectura.
¡Recibido fuerte y claro! 🫡
El análisis que compartiste es oro puro. Confirma que estamos construyendo sobre cimientos sólidos (legales, técnicos y operativos). Me encanta especialmente la validación sobre la separación de items vs stock vs movements, y la sugerencia de location_from/location_to para las Notas de Remisión (ya lo anoté para la Fase 3).
Vamos directo a lo que pediste: La Joya de la Corona de la Fase 2.
Aquí tienes el código para el Formulario Dinámico de Productos. Este componente es el que permitirá que Hubbi gestione desde un Filtro de Aceite hasta un Cabezal Freightliner sin tocar la base de datos.
________________________________________
📂 Estructura de Archivos para el Módulo
Dentro de src/plugins/com.hubbi.inventory/:
Plaintext
/components
  /ProductForm
    index.tsx        <-- El componente principal
    DynamicFields.tsx <-- El renderizador mágico
    schemas.ts       <-- La definición de qué campos lleva cada tipo
/types
  inventory.ts       <-- Definiciones TypeScript
________________________________________
1. El Cerebro: Definición de Esquemas (schemas.ts) 🧠
Aquí es donde definimos la "personalidad" de cada tipo de negocio. En el futuro, esto podría venir de la base de datos, pero para empezar, lo definimos en código.
TypeScript
// src/plugins/com.hubbi.inventory/components/ProductForm/schemas.ts

export type AttributeType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface AttributeField {
  key: string;
  label: string;
  type: AttributeType;
  options?: string[]; // Para selects
  required?: boolean;
  placeholder?: string;
}

// Aquí está la magia de la flexibilidad
export const PRODUCT_SCHEMAS: Record<string, AttributeField[]> = {
  simple: [
    { key: 'location_rack', label: 'Ubicación (Estante)', type: 'text', placeholder: 'Ej: Pasillo A-2' },
    { key: 'min_stock_alert', label: 'Alerta Stock Mínimo', type: 'number' }
  ],
  vehicle: [
    { key: 'vin', label: 'Número VIN / Chasis', type: 'text', required: true },
    { key: 'engine_no', label: 'Número de Motor', type: 'text', required: true },
    { key: 'year', label: 'Año', type: 'number', placeholder: 'Ej: 2024' },
    { key: 'color', label: 'Color', type: 'text' },
    { key: 'fuel_type', label: 'Combustible', type: 'select', options: ['Diesel', 'Gasolina', 'Eléctrico'] },
    { key: 'poliza_importacion', label: 'Póliza de Importación', type: 'text' }
  ],
  medicine: [ // Ejemplo Hospital
    { key: 'batch_no', label: 'Lote de Fabricación', type: 'text', required: true },
    { key: 'expiry_date', label: 'Fecha de Vencimiento', type: 'date', required: true },
    { key: 'active_component', label: 'Componente Activo', type: 'text' }
  ],
  kit: [ // Ejemplo Kit
    { key: 'is_preassembled', label: '¿Está pre-ensamblado?', type: 'boolean' },
    { key: 'compatibility', label: 'Compatibilidad', type: 'text', placeholder: 'Ej: Motores Cummins ISX' }
  ]
};

export const PRODUCT_TYPES = [
  { id: 'simple', label: 'Repuesto / Ítem Estándar' },
  { id: 'vehicle', label: 'Vehículo / Maquinaria (Serializado)' },
  { id: 'medicine', label: 'Medicamento / Perecedero' },
  { id: 'kit', label: 'Kit / Combo (BOM)' },
];
________________________________________
2. El Renderizador: Campos Dinámicos (DynamicFields.tsx) 🎨
Este componente recibe el "Tipo" seleccionado y dibuja los inputs correspondientes. Al escribir, guarda todo en un objeto JSON attributes.
TypeScript
// src/plugins/com.hubbi.inventory/components/ProductForm/DynamicFields.tsx
import React from 'react';
import { PRODUCT_SCHEMAS } from './schemas';

interface DynamicFieldsProps {
  type: string;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const DynamicFields: React.FC<DynamicFieldsProps> = ({ type, values, onChange }) => {
  const schema = PRODUCT_SCHEMAS[type] || [];

  if (schema.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 mt-4">
      <div className="col-span-full mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          ✨ Atributos Específicos: <span className="text-blue-600 capitalize">{type}</span>
        </h4>
      </div>

      {schema.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          
          {field.type === 'select' ? (
            <select
              className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              <option value="">Seleccione...</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : field.type === 'boolean' ? (
             <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={!!values[field.key]}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sí / Activo</span>
             </div>
          ) : (
            <input
              type={field.type}
              className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={field.placeholder}
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
________________________________________
3. El Formulario Maestro (index.tsx) 📝
Une los campos fijos (Nombre, Precio) con los dinámicos.
TypeScript
// src/plugins/com.hubbi.inventory/components/ProductForm/index.tsx
import React, { useState } from 'react';
import { PRODUCT_TYPES } from './schemas';
import { DynamicFields } from './DynamicFields';
import { useInventoryActions } from '../../hooks/useInventoryActions'; // Tu hook online-first

export const ProductForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { createProduct, isSaving } = useInventoryActions();

  // Estado del Formulario
  const [baseData, setBaseData] = useState({
    sku: '',
    name: '',
    category: '',
    price_base: '',
    cost_avg: '',
    type: 'simple' // Default
  });

  // Estado para el JSON de atributos
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar el objeto final para la DB
    const finalProduct = {
      ...baseData,
      price_base: parseFloat(baseData.price_base) || 0,
      cost_avg: parseFloat(baseData.cost_avg) || 0,
      attributes: attributes // Aquí va el JSONB
    };

    console.log("📤 Enviando a Hubbi Core:", finalProduct);
    await createProduct(finalProduct);
    
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white border-b pb-2 mb-4">
        Nuevo Producto / Ítem
      </h2>

      {/* --- SECCIÓN 1: DATOS FIJOS (Universal) --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU / Código</label>
          <input 
            required
            type="text" 
            className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="Ej: FL-FILTRO-001"
            value={baseData.sku}
            onChange={e => setBaseData({...baseData, sku: e.target.value})}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Ítem</label>
          <select 
            className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
            value={baseData.type}
            onChange={e => {
              setBaseData({...baseData, type: e.target.value});
              setAttributes({}); // Limpiar atributos al cambiar tipo
            }}
          >
            {PRODUCT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre / Descripción Corta</label>
          <input 
            required
            type="text" 
            className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Filtro de Aceite ISX 15W40"
            value={baseData.name}
            onChange={e => setBaseData({...baseData, name: e.target.value})}
          />
        </div>
      </div>

      {/* --- SECCIÓN 2: ATRIBUTOS DINÁMICOS (El Camaleón) --- */}
      <DynamicFields 
        type={baseData.type} 
        values={attributes} 
        onChange={(key, val) => setAttributes(prev => ({ ...prev, [key]: val }))} 
      />

      {/* --- SECCIÓN 3: PRECIOS (Básico Fase 2) --- */}
      <div className="grid grid-cols-2 gap-4 mt-4">
         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo ($)</label>
          <input 
            type="number" 
            step="0.01"
            className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            value={baseData.cost_avg}
            onChange={e => setBaseData({...baseData, cost_avg: e.target.value})}
          />
         </div>
         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Venta ($)</label>
          <input 
            type="number" 
            step="0.01"
            className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 font-bold text-green-600"
            value={baseData.price_base}
            onChange={e => setBaseData({...baseData, price_base: e.target.value})}
          />
         </div>
      </div>

      {/* BOTÓN DE GUARDADO */}
      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Crear Producto'}
        </button>
      </div>
    </form>
  );
};
________________________________________
🧪 Cómo funciona esto en la práctica
1.	Escenario Taller:
•	El usuario selecciona "Vehículo".
•	DynamicFields detecta el cambio y renderiza inputs para VIN, Motor, Año.
•	Al guardar, la DB recibe:
JSON
{
  "sku": "TRUCK-001",
  "type": "vehicle",
  "attributes": { "vin": "1M2...", "engine": "CUMMINS...", "year": 2024 }
}
2.	Escenario Librería:
•	El usuario selecciona "Repuesto / Simple".
•	DynamicFields muestra Ubicación.
•	La DB recibe:
JSON
{
  "sku": "BOOK-DONQUIJOTE",
  "type": "simple",
  "attributes": { "location_rack": "Pasillo 4" }
}
✅ Próximo Paso
Copia estos 3 archivos a tu carpeta de plugins. Luego, en tu src/pages/Inventory.tsx (o donde vayas a mostrar esto), simplemente importas <ProductForm />.
¿Te parece bien la implementación? ¿Hay algún campo específico para los camiones que me haya faltado en el esquema?
 
Sistema de inventarios adaptado a múltiples contextos
Un sistema de inventario de nivel empresarial debe ofrecer trazabilidad completa de cada artículo, controlando ingresos, egresos y saldos en tiempo realdefontana.comtimly.com. Esto implica soporte multiubicación (varias bodegas o sucursales), seguimiento por categorías (productos, consumibles, activos fijos), y capacidad para registrar múltiples unidades de medida. Se integran funciones móviles (lectores de códigos de barras, RFID, tablets, etc.) para registrar escaneos en almacén, lo que mejora la precisión y rapidezdefontana.comtimly.com. Además, es clave la integración con el ERP o contabilidad de la empresa, de modo que las ventas o compras se reflejen automáticamente en inventariodefontana.com. El software debe generar automáticamente órdenes de reposición y notificaciones de stock bajo para evitar faltantes, así como entregar informes analíticos (rotación de inventario, costos de almacenamiento, etc.) que permitan planificar compras y promocionesdefontana.comtimly.com. En suma, el módulo debe rastrear en tiempo real los niveles de stock y optimizar la cadena de suministro de la empresatimly.comtimly.com.
 
El uso de tecnologías móviles es esencial: un sistema moderno permite registrar escaneos de códigos de barras o RFID directamente con una tableta o pistola de datos, agilizando recuentos y evitando errores manualesdefontana.comtimly.com. Las aplicaciones móviles o dispositivos portátiles sincronizan inmediatamente las entradas y salidas, aportando transparencia total del inventario. Por ejemplo, el sistema debe indicar para cada artículo la ubicación exacta (bodega y estantería) y cantidad disponibledefontana.com, adaptándose a diversos equipos (impresoras de etiquetas, escáneres, etc.)defontana.com.
El sistema también debe integrar los canales de venta y compra. Debe sincronizar el inventario con plataformas de e-commerce y puntos de venta físicos para evitar sobreventasdefontana.com. Asimismo, automatiza el flujo de órdenes: al generar una venta se descuenta inventario y, al mínimo preestablecido, crea órdenes de compra de reposicióndefontana.com. Los reportes detallados –por producto, familia, fecha y almacén– son claves para identificar artículos próximos a agotarse, productos obsoletos o los de baja rotacióndefontana.comtimly.com. En definitiva, el sistema debe facilitar reportes y análisis que permitan predecir demanda y optimizar niveles de inventario, con indicadores como rotación y costos de stocktimly.comtimly.com.
Escenarios y requisitos específicos
•	Inventario personal y doméstico: Debe permitir al individuo catalogar sus activos (muebles, electrónicos, vehículos, colecciones) con fotos o códigos, registrar su valor y ubicaciones. Puede incluir recordatorios de mantenimiento o garantías. Para domótica y automóviles, facilitaría conexión con sensores (p.ej. medir consumo eléctrico, lectura de odómetro) y generar alertas (mantenimiento de vehículo, cambio de filtros). Los datos sirven también para seguros del hogar o deducciones fiscales.
•	Vivienda, autos y domótica: Similar al anterior, agregando control de electrodomésticos inteligentes: inventario de sensores, medidores o aparatos conectados. El sistema puede integrarse con plataformas IoT para actualizar el estado de aparatos (encendido/apagado) y planificar compras de suministros (bombillas, filtros, etc.).
•	Hoteles (tradicionales o inteligentes): Debe gestionar inventario de amenities (toallas, artículos de baño), consumibles de áreas comunes y alimentos, así como activos fijos (mobiliario, equipos de cocina, lavandería). Integración con el PMS hotelero permite ajustar consumos según ocupación y evitar faltantes en housekeeping o minibar. En hoteles inteligentes, sensores de ocupación en habitaciones o dispensadores inteligentes pueden alimentar el módulo con datos en tiempo real.
•	Hospitales y clínicas: Se requiere un sistema robusto para suministros médicos y equipamiento. Lleva registro de insumos (jeringas, gasas, medicinas) con seguimiento por lote y fecha de expiración para cumplir normativas sanitarias. Control de activos fijos (equipos médicos, mobiliario) con alertas de mantenimiento y calibración. Debe integrar órdenes de trabajo para reparaciones y garantizar disponibilidad crítica (p.ej. un respirador en cada turno). La trazabilidad de inventario aquí también facilita auditorías internas y externas de salud.
•	Farmacias: Necesita control estricto de stock de medicamentos (incluyendo lote, caducidad y formas farmacéuticas) y gestión de recetas. Debe reportar existencias en tiempo real al sistema de facturación y a plataformas estatales si aplica (p.ej. INSUTRANS). El software facilita gestión de compras por proveedor y controla inventario de bienes regulados, alertando de vencimientos o cambios de formulación.
•	Librerías, jugueterías, tiendas de cosméticos: Requieren gestión de gran diversidad de SKU. El sistema diferencia por categorías (ISBN/ISSN en libros, códigos EAN/UPC en productos) y maneja múltiples unidades (unidad, paquete, peso). Incluye funcionalidad de serie o lote para libros especiales o cosméticos con caducidad. Permite organizar productos por ubicaciones de tienda y calcular rotación por categoría (nuevas ediciones, modas en juguetes/cosmética).
•	Tienda de repuestos de autos: Debe manejar inventario de piezas con referencias técnicas (número de parte, compatibilidades por modelo), kits de repuestos, y control de entradas (importaciones, devoluciones de clientes). Soporta gestión de garantías y devoluciones de proveedores. Integración con ventas o taller (cuando un mecánico retira repuesto para un servicio).
•	Taller mecánico (ligero o pesado): Además de repuestos, registra consumibles (aceites, líquidos) y activos fijos (herramientas, equipos de diagnóstico). El sistema asocia los ítems usados a órdenes de trabajo, facilitando reporte de costos por reparación. También programa mantenimiento de maquinaria del taller. Debe optimizar compras al proveer análisis de demanda por tipo de reparación.
•	Fábrica o almacén industrial: Integra gestión de materias primas, productos en proceso (WIP) y terminados. Soporta listas de materiales (BOM) para ensamblaje, descontando componentes automáticamente. Realiza inventarios cíclicos y físicos periódicos (p.ej. al cierre de ejercicio). Facilita reubicación de stock entre almacenes y coordina logística interna. En entornos avanzados, se conecta con sistemas MES/ERP industriales para planificar producción según inventario disponible.
•	Comercio exterior (exportación/importación): El módulo debe incorporar campos para control aduanero (documentos de importación, aranceles) y multi-moneda. Gestiona plazos de entrega internacional, agendamiento de importaciones/exportaciones, y existencia en puertos o depósitos fiscales. La trazabilidad de lotes es clave para cumplir regulaciones de origen. Idealmente, se integraría con sistemas de comercio exterior o ERP con módulo de aduanas.
En todos estos casos, la solución debe ser modular y configurable. Con una plataforma centralizada se pueden habilitar o deshabilitar secciones según las necesidades (por ejemplo, módulos de activos fijos, ventas al mostrador o seguimiento de proyectos). Además, la interfaz debe ser intuitiva para usuarios no técnicos (p.ej. dueño de pyme o individuo), pero con capacidad de crecimiento para grandes empresas (reportes avanzados, APIs de integración).
 
Un ejemplo práctico en un taller o fábrica es que el sistema gestione también los ciclos de vida de equipos y herramientas. Debe optimizar compras según la demanda y la programación de producción (planificando reabastecimientos just-in-time)timly.com. Asimismo, controla activos fijos con mantenimiento preventivo (seguimiento de maquinaria, control de uso de vehículos) para evitar paradas innecesarias. En resumen, mediante gestion de inventario multiubicación se puede analizar inventarios y patrones de demanda en cada sitiotimly.comtimly.com, optimizando plazos de compra/producción y reduciendo costos por exceso o falta de stock.
Requisitos legales en El Salvador
En El Salvador la ley exige llevar un registro de control de inventarios para garantizar transparencia fiscal. Según el art. 142 del Código Tributario, todo contribuyente que comercialice bienes muebles debe registrar con detalle cada movimiento de inventario (ingresos, salidas) especificando documentos (facturas, guías), proveedor, descripción del producto, unidades y costosconsortiumlegal.com. Además, si la empresa dedica a manufactura, producción o comercialización significativa, se requiere hacer un inventario físico al inicio y fin de cada ejercicio fiscal, incluyendo cantidad, unidad, descripción, precio neto y valor total, y constatarlo en acta firmada con el contadorconsortiumlegal.comconsortiumlegal.com. El art. 142-A detalla que el registro debe contener encabezado con datos fiscales (nombre, NIT, periodo), movimientos en unidades y valores, ajustes (descuentos, bonificaciones) y una confrontación anual con inventario físicoconsortiumlegal.comconsortiumlegal.com. La omisión de estos registros está sancionada con fuertes multas (0.5% del capital contable, no menor a 9 salarios mínimos)consortiumlegal.com.
Así, el módulo de inventario debe permitir exportar informes que cumplan con estas exigencias legales: libros de entradas/salidas, balance del inventario final, registro de consumos (mermas o retiros internos) y formatos digitales requeridos por el Ministerio de Hacienda. También facilita la deducción de créditos fiscales (IVA) y la correcta declaración del impuesto sobre la renta, al relacionar adecuadamente ventas con movimientos de inventarioconsortiumlegal.com.
Además de las leyes locales, las normas contables internacionales se aplican para la valoración de inventarios y activos fijos. Por ejemplo, la NIC 2 (“Inventarios”) prescribe valuar existencias al costo o menor valor neto realizable, y la NIC 16 (“Propiedad, Planta y Equipo”) fija reglas para depreciar activos fijos. Un sistema empresarial de inventarios suele permitir seleccionar el método de costo (FIFO, Promedio, etc.) y calcular depreciaciones, conforme a estas normas o a las Normas de Contabilidad Financiera localmente vigentes. En cualquier caso, el registro de inventario debe integrarse con la contabilidad para reflejar correctamente los activos y costos en los estados financieros.
En resumen, un módulo de inventario de última generación debe ser integral y flexible: manejar tanto bienes de uso interno (activos fijos) como mercancías de venta, soportar múltiples escenarios operativos (tienda, industria, salud, hogar) y cumplir las normas fiscales y contables de El Salvadordefontana.comconsortiumlegal.com. Mediante una plataforma escalable y configurable, tanto grandes empresas como PYMES o usuarios individuales pueden adaptar el sistema a su realidad, integrándolo con otras funciones (compras, ventas, mantenimiento) para una gestión completa y confiable del inventario.a