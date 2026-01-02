(function(n,l){typeof exports=="object"&&typeof module<"u"?module.exports=l(require("react/jsx-runtime"),require("react")):typeof define=="function"&&define.amd?define(["react/jsx-runtime","react"],l):(n=typeof globalThis<"u"?globalThis:n||self,n.com=n.com||{},n.com.hubbi=n.com.hubbi||{},n.com.hubbi.inventory=l(n.HubbiJSX,n.React))})(this,function(n,l){"use strict";const s=window.hubbi;/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var N={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),v=(e,t)=>{const i=l.forwardRef(({color:o="currentColor",size:d=24,strokeWidth:a=2,absoluteStrokeWidth:c,className:y="",children:u,...r},b)=>l.createElement("svg",{ref:b,...N,width:d,height:d,stroke:o,strokeWidth:c?Number(a)*24/Number(d):a,className:["lucide",`lucide-${x(e)}`,y].join(" "),...r},[...t.map(([_,w])=>l.createElement(_,w)),...Array.isArray(u)?u:[u]]));return i.displayName=`${e}`,i};/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=v("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=v("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=v("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]),A=()=>{const[e,t]=l.useState([]),[i,o]=l.useState(!0),[d,a]=l.useState(null),c=l.useCallback(async()=>{o(!0);const r=await s.data.query(`
            SELECT 
                s.item_id,
                s.location_id,
                s.quantity as current_qty,
                s.min_stock,
                s.reorder_point,
                i.name as item_name,
                i.sku as item_sku,
                l.name as location_name
            FROM com_hubbi_inventory_stock s
            JOIN com_hubbi_inventory_items i ON s.item_id = i.id
            LEFT JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
            WHERE s.quantity <= s.reorder_point OR s.quantity <= s.min_stock
            ORDER BY (s.min_stock - s.quantity) DESC
        `);if(r&&Array.isArray(r)){const b=r.map(_=>({..._,severity:_.current_qty<=_.min_stock?"critical":_.current_qty<=_.reorder_point?"warning":"ok"}));t(b)}a(new Date),o(!1)},[]);l.useEffect(()=>{c();const r=()=>{c()};return s.events.on("inventory:stock:increased",r),s.events.on("inventory:stock:decreased",r),()=>{s.events.off("inventory:stock:increased",r),s.events.off("inventory:stock:decreased",r)}},[c]);const y=e.filter(r=>r.severity==="critical").length,u=e.filter(r=>r.severity==="warning").length;return{alerts:e,criticalCount:y,warningCount:u,loading:i,lastCheck:d,refresh:c}},p=({compact:e=!1})=>{const{alerts:t,criticalCount:i,warningCount:o,loading:d,lastCheck:a,refresh:c}=A(),y=e?t.slice(0,3):t;return n.jsxs("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden",children:[n.jsxs("div",{className:"p-4 border-b border-gray-100 flex items-center justify-between",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(g,{size:20,className:"text-orange-500"}),n.jsx("h3",{className:"font-semibold text-gray-900",children:"Alertas de Stock"}),i>0&&n.jsx("span",{className:"bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold",children:i}),o>0&&n.jsx("span",{className:"bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold",children:o})]}),n.jsx("button",{onClick:c,disabled:d,className:"p-2 hover:bg-gray-100 rounded-full text-gray-500 disabled:opacity-50",children:n.jsx(C,{size:16,className:d?"animate-spin":""})})]}),n.jsx("div",{className:`${e?"max-h-32":"max-h-64"} overflow-auto`,children:y.length===0?n.jsxs("div",{className:"p-8 text-center text-gray-400",children:[n.jsx(g,{size:32,className:"mx-auto mb-2 opacity-30"}),n.jsx("p",{children:"No hay alertas de stock"})]}):n.jsx("div",{className:"divide-y divide-gray-100",children:y.map((u,r)=>n.jsxs("div",{className:`p-3 flex items-center gap-3 ${u.severity==="critical"?"bg-red-50":u.severity==="warning"?"bg-yellow-50":""}`,children:[n.jsx(T,{size:18,className:u.severity==="critical"?"text-red-500":"text-yellow-500"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("div",{className:"font-medium text-gray-900 truncate",children:u.item_name}),n.jsxs("div",{className:"text-xs text-gray-500",children:[u.location_name||"Sin ubicación"," • Stock: ",u.current_qty," / Mínimo: ",u.min_stock]})]}),n.jsx("div",{className:`text-xs font-bold px-2 py-1 rounded ${u.severity==="critical"?"bg-red-100 text-red-700":"bg-yellow-100 text-yellow-700"}`,children:u.severity==="critical"?"CRÍTICO":"BAJO"})]},r))})}),a&&n.jsxs("div",{className:"p-2 border-t border-gray-100 text-xs text-gray-400 text-center",children:["Última verificación: ",a.toLocaleTimeString()]})]})},m="com.hubbi.inventory";async function f(){const e=await s.db.query("SELECT * FROM hubbi_fiscal_periods WHERE is_current = TRUE",[],{moduleId:m});return e&&e.length>0?e[0]:null}async function O(e){const t=await s.db.query("SELECT * FROM hubbi_fiscal_periods WHERE id = ?",[e],{moduleId:m});return t&&t.length>0?t[0]:null}async function E(e){const[t,i,o]=await Promise.all([O(e),f(),s.db.query("SELECT * FROM hubbi_fiscal_config WHERE id = 'default'",[],{moduleId:m})]);if(!t||!i||!o||o.length===0)return!1;const d=o[0];if(t.status==="closed"||t.status==="locked")return!1;const a=i.year*12+i.month,c=t.year*12+t.month;return a-c<=d.lock_after_periods}async function k(e){const{itemId:t,locationId:i}=e;let o=`
    SELECT 
      s.item_id as itemId,
      s.location_id as locationId,
      s.quantity as totalStock,
      COALESCE((
        SELECT SUM(r.quantity) 
        FROM com_hubbi_inventory_reservations r 
        WHERE r.item_id = s.item_id 
          AND r.location_id = s.location_id 
          AND r.status = 'active'
      ), 0) as reservedStock,
      s.min_stock as minStock,
      s.reorder_point as reorderPoint
    FROM com_hubbi_inventory_stock s
    WHERE s.item_id = ?
  `;const d=[t];return i&&(o+=" AND s.location_id = ?",d.push(i)),(await s.db.query(o,d,{moduleId:"com.hubbi.inventory"})).map(c=>({itemId:c.itemId,locationId:c.locationId,totalStock:c.totalStock,reservedStock:c.reservedStock,availableStock:c.totalStock-c.reservedStock,minStock:c.minStock,reorderPoint:c.reorderPoint}))}async function I(e){const t=await k({itemId:e.itemId,locationId:e.locationId});if(t.length===0)return{available:!1,currentStock:0,requestedQuantity:e.quantity};const i=t[0];return{available:i.availableStock>=e.quantity,currentStock:i.availableStock,requestedQuantity:e.quantity}}async function L(e){let t=`
    SELECT 
      i.id as itemId,
      i.name as itemName,
      i.sku,
      s.location_id as locationId,
      s.quantity as currentStock,
      s.reorder_point as reorderPoint,
      (s.reorder_point - s.quantity) as deficit
    FROM com_hubbi_inventory_stock s
    JOIN com_hubbi_inventory_items i ON s.item_id = i.id
    WHERE s.quantity <= s.reorder_point
      AND i.is_active = TRUE
  `;const i=[];return e!=null&&e.locationId&&(t+=" AND s.location_id = ?",i.push(e.locationId)),t+=" ORDER BY deficit DESC",await s.db.query(t,i,{moduleId:"com.hubbi.inventory"})}async function M(e){var o;const t=await I({itemId:e.itemId,locationId:e.locationId,quantity:e.quantity});if(!t.available)return{success:!1,error:`Stock insuficiente. Disponible: ${t.currentStock}, Solicitado: ${e.quantity}`};const i=crypto.randomUUID();return await s.db.execute(`
    INSERT INTO com_hubbi_inventory_reservations 
      (id, item_id, location_id, quantity, reference_type, reference_id, created_by, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `,[i,e.itemId,e.locationId,e.quantity,e.referenceType,e.referenceId,e.createdBy,e.expiresAt||null],{moduleId:"com.hubbi.inventory"}),h("reservation:created",{reservationId:i,itemId:e.itemId,quantity:e.quantity,referenceType:e.referenceType,referenceId:e.referenceId}),(o=s.audit)==null||o.call(s,{action:"reservation_created",entity:"inventory_reservation",entityId:i,description:`Reserva de ${e.quantity} unidades para ${e.referenceType}:${e.referenceId}`}),{success:!0,reservationId:i}}async function D(e){const t=await s.db.query("SELECT * FROM com_hubbi_inventory_reservations WHERE id = ? AND status = 'active'",[e.reservationId],{moduleId:"com.hubbi.inventory"});if(t.length===0)return{success:!1,error:"Reserva no encontrada o ya consumida"};const i=t[0],o=crypto.randomUUID(),d=await s.db.query("SELECT weighted_average_cost FROM com_hubbi_inventory_items WHERE id = ?",[i.item_id],{moduleId:"com.hubbi.inventory"}),a=d.length>0?d[0].weighted_average_cost:0,c=i.quantity;return await s.db.execute(`
    INSERT INTO com_hubbi_inventory_movements 
      (id, item_id, location_id, type, reason, quantity, cost_at_moment, total_value, created_by)
    VALUES (?, ?, ?, 'OUT', 'internal_use', ?, ?, ?, ?)
  `,[o,i.item_id,i.location_id,c,a,c*a,e.consumedBy],{moduleId:"com.hubbi.inventory"}),await s.db.execute(`
    UPDATE com_hubbi_inventory_stock 
    SET quantity = quantity - ? 
    WHERE item_id = ? AND location_id = ?
  `,[c,i.item_id,i.location_id],{moduleId:"com.hubbi.inventory"}),await s.db.execute(`
    UPDATE com_hubbi_inventory_reservations SET status = 'consumed' WHERE id = ?
  `,[e.reservationId],{moduleId:"com.hubbi.inventory"}),h("reservation:consumed",{reservationId:e.reservationId,movementId:o,itemId:i.item_id,quantity:c}),h("stock:decreased",{itemId:i.item_id,locationId:i.location_id,quantity:c,reason:"internal_use",movementId:o}),{success:!0,movementId:o}}async function R(e){return await s.db.execute(`
    UPDATE com_hubbi_inventory_reservations SET status = 'cancelled' WHERE id = ?
  `,[e.reservationId],{moduleId:"com.hubbi.inventory"}),h("reservation:cancelled",{reservationId:e.reservationId,reason:e.reason}),{success:!0}}async function U(e){var u;if(e.type==="OUT"&&e.reason!=="correction"){const r=await I({itemId:e.itemId,locationId:e.locationId,quantity:e.quantity});if(!r.available)return{success:!1,error:`Stock insuficiente. Disponible: ${r.currentStock}, Solicitado: ${e.quantity}`}}let t=e.periodId;if(!t){const r=await f();t=r==null?void 0:r.id}if(t&&!await E(t))return{success:!1,error:`El período ${t} está cerrado o bloqueado. No se pueden registrar movimientos.`};if(e.subHubId){const r=s.permissions.has("inventory:edit_all_subhubs"),b=s.getContext(),_=e.subHubId===(b==null?void 0:b.subHubId),w=s.permissions.has("inventory:edit_own_subhub")&&_;if(!r&&!w)return{success:!1,error:"No tienes permiso para modificar inventario de esta sucursal."}}const i=crypto.randomUUID();let o=e.unitCost||0;if(!e.unitCost){const r=await s.db.query("SELECT weighted_average_cost FROM com_hubbi_inventory_items WHERE id = ? ",[e.itemId],{moduleId:"com.hubbi.inventory"});o=r.length>0?r[0].weighted_average_cost:0}await s.db.execute(`
    INSERT INTO com_hubbi_inventory_movements
                (id, item_id, location_id, type, reason, quantity, cost_at_moment, total_value,
                    document_type, document_number, document_uuid, created_by, sub_hub_id, period_id)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,[i,e.itemId,e.locationId,e.type,e.reason,e.quantity,o,e.quantity*o,e.documentType||null,e.documentNumber||null,e.documentUuid||null,e.createdBy,e.subHubId||null,t||null],{moduleId:"com.hubbi.inventory"});let d=e.quantity;e.type==="OUT"||e.type==="TRANSFER_OUT"?d=-e.quantity:e.type==="ADJUST"&&(d=e.quantity),await s.db.execute(`
    INSERT INTO com_hubbi_inventory_stock(item_id, location_id, quantity)
            VALUES(?, ?, ?)
    ON CONFLICT(item_id, location_id) DO UPDATE SET quantity = quantity + ?
                `,[e.itemId,e.locationId,d,d],{moduleId:"com.hubbi.inventory"}),(e.type==="IN"||e.type==="TRANSFER_IN")&&e.unitCost&&await H(e.itemId,e.quantity,e.unitCost);const a=await s.db.query("SELECT quantity FROM com_hubbi_inventory_stock WHERE item_id = ? AND location_id = ? ",[e.itemId,e.locationId],{moduleId:"com.hubbi.inventory"}),c=a.length>0?a[0].quantity:0,y=e.type==="IN"||e.type==="TRANSFER_IN"||e.type==="ADJUST"&&e.quantity>0;return h(y?"stock:increased":"stock:decreased",{itemId:e.itemId,locationId:e.locationId,quantity:e.quantity,reason:e.reason,movementId:i,newStock:c}),(u=s.audit)==null||u.call(s,{action:`stock_${e.type.toLowerCase()}`,entity:"inventory_movement",entityId:i,description:`${e.type==="IN"?"Entrada":"Salida"} de ${e.quantity} unidades - ${e.reason}`}),{success:!0,movementId:i,newStock:c}}async function H(e,t,i){const o=await s.db.query("SELECT weighted_average_cost FROM com_hubbi_inventory_items WHERE id = ? ",[e],{moduleId:"com.hubbi.inventory"}),d=await s.db.query("SELECT SUM(quantity) as total FROM com_hubbi_inventory_stock WHERE item_id = ? ",[e],{moduleId:"com.hubbi.inventory"}),a=o.length>0?o[0].weighted_average_cost:0,c=d.length>0?d[0].total-t:0,y=c*a,u=t*i,r=c+t,b=r>0?(y+u)/r:i;await s.db.execute("UPDATE com_hubbi_inventory_items SET weighted_average_cost = ?, last_cost = ? WHERE id = ? ",[b,i,e],{moduleId:"com.hubbi.inventory"})}async function W(e){let t="SELECT * FROM com_hubbi_inventory_items WHERE ";const i=[];if(e.id)t+="id = ? ",i.push(e.id);else if(e.sku)t+="sku = ? ",i.push(e.sku);else return null;const o=await s.db.query(t,i,{moduleId:"com.hubbi.inventory"});return o.length>0?o[0]:null}async function P(e){let t=`
    SELECT * FROM com_hubbi_inventory_items 
    WHERE is_active = TRUE AND is_internal_use_only = FALSE
                `;const i=[];return e!=null&&e.categoryId&&(t+=" AND category_id = ? ",i.push(e.categoryId)),e!=null&&e.search&&(t+=" AND(name LIKE ? OR sku LIKE ?)",i.push(`% ${e.search}% `,` % ${e.search}% `)),t+=" ORDER BY name LIMIT ? ",i.push((e==null?void 0:e.limit)||100),await s.db.query(t,i,{moduleId:"com.hubbi.inventory"})}async function $(e){return await s.db.query(`
    SELECT
            k.child_item_id as componentId,
                i.name as componentName,
                i.sku as componentSku,
                k.quantity
    FROM com_hubbi_inventory_kits k
    JOIN com_hubbi_inventory_items i ON k.child_item_id = i.id
    WHERE k.parent_item_id = ?
                `,[e],{moduleId:"com.hubbi.inventory"})}function h(e,t){window.dispatchEvent(new CustomEvent(`inventory:${e} `,{detail:{moduleId:"com.hubbi.inventory",timestamp:new Date().toISOString(),...t}}))}function F(){var e,t;(t=(e=window.hubbi)==null?void 0:e.modules)!=null&&t.expose&&(window.hubbi.modules.expose("getStock",k),window.hubbi.modules.expose("checkAvailability",I),window.hubbi.modules.expose("getLowStockItems",L),window.hubbi.modules.expose("createReservation",M),window.hubbi.modules.expose("consumeReservation",D),window.hubbi.modules.expose("cancelReservation",R),window.hubbi.modules.expose("recordMovement",U),window.hubbi.modules.expose("getItem",W),window.hubbi.modules.expose("getSellableItems",P),window.hubbi.modules.expose("getKitComponents",$),window.hubbi.modules.expose("getCurrentPeriod",f),window.hubbi.modules.expose("isPeriodEditable",E))}const B=()=>n.jsxs("div",{className:"inventory-settings p-4",children:[n.jsx("h2",{className:"text-lg font-bold",children:"Configuración de Inventario"}),n.jsx("p",{className:"text-gray-500",children:"Próximamente: Ajustes de costos, prefijos y permisos."})]}),j=()=>n.jsx(p,{compact:!0}),J=()=>{var i,o,d;if(!(((d=(o=(i=window.hubbi)==null?void 0:i.permissions)==null?void 0:o.has)==null?void 0:d.call(o,"inventory:access"))??!0))return null;const t=()=>{var a,c;return(c=(a=window.hubbi)==null?void 0:a.navigate)==null?void 0:c.call(a,"/inventory")};return n.jsxs("button",{onClick:t,className:"w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2",children:[n.jsx("svg",{className:"w-5 h-5 text-indigo-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:n.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"})}),n.jsx("span",{children:"Inventario"})]})},S=async()=>{var e,t;(t=(e=window.hubbi)==null?void 0:e.widgets)!=null&&t.register&&(window.hubbi.widgets.register({slotName:"settings_tab",moduleId:"com.hubbi.inventory",component:B,priority:10}),window.hubbi.widgets.register({slotName:"dashboard_widget",moduleId:"com.hubbi.inventory",component:j,priority:20}),window.hubbi.widgets.register({slotName:"sidebar_item",moduleId:"com.hubbi.inventory",component:J,priority:30})),F(),V()};async function V(){var e,t,i;if(!(!((t=(e=window.hubbi)==null?void 0:e.db)!=null&&t.query)||!((i=window.hubbi)!=null&&i.sendNotification)))try{const o=await window.hubbi.db.query(`
      SELECT i.name, s.quantity, s.reorder_point, l.name as location_name
      FROM com_hubbi_inventory_stock s
      JOIN com_hubbi_inventory_items i ON s.item_id = i.id
      JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
      WHERE s.quantity <= s.min_stock AND i.is_active = TRUE
      LIMIT 5
    `,[],{moduleId:"com.hubbi.inventory"});o.length>0&&await window.hubbi.sendNotification({title:"⚠️ Stock Crítico",message:`${o.length} productos requieren reabastecimiento urgente`,category:"inventory",severity:"warning",actionUrl:"/inventory/alerts"})}catch{}}const q=()=>n.jsxs("div",{className:"p-6",children:[n.jsx("h1",{className:"text-2xl font-bold mb-4",children:"Hubbi Inventory & WMS"}),n.jsx("p",{className:"text-gray-600",children:"Módulo de inventario cargado exitosamente. Configuración en progreso..."})]});function z(){const e="com.hubbi.inventory";typeof window<"u"&&window.hubbi&&typeof window.hubbi.register=="function"?(window.hubbi.register(e,q),typeof S=="function"&&S().catch(t=>{console.error("[Inventory Module] Activation error:",t)}),console.log(`[PluginEntry] Plugin '${e}' registered successfully`)):console.error("[PluginEntry] window.hubbi.register not found. Cannot register plugin.")}return z(),q});
