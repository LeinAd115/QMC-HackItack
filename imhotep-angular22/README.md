# IMHOTEP · Hackatón · Angular 22

## Iniciar
Requiere Node compatible con Angular 22. Ejecutar `npm install` y `npm start`. Abrir http://localhost:4200.

## Usuarios de demostración
`almacenista`, `supervisor`, `compras`, `rh`. Contraseña compartida `demo123` (solo simulación).

## Alcance del prototipo
Inventario, trabajadores, entrega, devolución, traspaso, límites, validación de inspección, adeudos, baja condicionada, historial y exportación CSV. Entrada de código por teclado o lector USB que se comporte como teclado. Los archivos originales están conservados en `src/app/plantilla-original/` como referencia, no están cargados en la interfaz nueva.

## Limitaciones críticas
No hay autenticación segura ni backend. `localStorage` NO sincroniza almacenes ni protege los datos. No se implementó lector QR con cámara, vale PDF/QR, firmas, flujo real de aprobación ni base de datos. Un supervisor puede autorizar un límite con `AUTORIZAR` en la demostración, pero esto NO es una autorización segura. Para producción: Flask API + MySQL con transacciones y registro auditable, JWT/sesiones, control de acceso servidor, tabla de inventario por almacén, serialización por pieza y vales digitales.

## Prueba manual
1. Entrar como almacenista y entregar `ALT-024` a `12345`.
2. Intentar repetir la entrega: debe bloquear por falta de existencias.
3. Intentar entregar `ALT-025`: bloqueado por inspección vencida.
4. Entrar como rh, intentar dar de baja `12345`: bloqueado por adeudo.
5. Devolver `ALT-024`, después dar de baja `12345` desde rh.
6. Registrar traspaso de una pieza desde un almacén a otro.
7. Consultar historial y exportar CSV.

## Pendientes prioritarios
1. Corregir modelo de inventario por almacén y persistir en MySQL.
2. Captura QR por cámara y generación de vale con folio y QR.
3. Autorización del supervisor registrada con usuario, fecha y motivo.
4. Inspecciones y estado por número de serie; firma y responsable de entrega.
5. Pruebas concurrentes y respaldos.
