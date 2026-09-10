const fs = require('fs');
const path = '/Users/alexissotomayor/Documents/Trabajo/Zelify/Repositorios/Backend/credit-decision-engine/src/configuration/configuration.service.ts';
let content = fs.readFileSync(path, 'utf8');

// For Solicitudes query:
content = content.replace(/fr\.product\s+AS "Producto",\s*/g, '');
content = content.replace(/fr\.zelify_user_id\s+AS "ID Zelify",\s*/g, '');

// For Pagos query:
content = content.replace(/ps\.user_id\s+AS "ID Usuario",\s*/g, '');
content = content.replace(/ps\.interest_rate\s+AS "Tasa de Interés",\s*/g, '');
// product is already removed by the first regex if it's the exact same string, but let's check
// In Pagos it's: fr.product                  AS "Producto",
// That matches the first regex!

fs.writeFileSync(path, content);
console.log("Replaced fields successfully!");
