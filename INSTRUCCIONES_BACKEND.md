# IMHOTEP - Etapa 2: MySQL y Flask

La interfaz Angular sigue usando localStorage. La API adjunta es una primera etapa **independiente**, no está conectada a Angular ni ofrece todavía entregas, devoluciones o autenticación.

1. En MySQL Workbench, abre `backend/schema.sql` y ejecuta todo el script. Creará la base y los seis almacenes.
2. Abre una terminal en `backend` y ejecuta `py -m venv .venv` y `.\.venv\Scripts\Activate.ps1` (si PowerShell bloquea la activación, usa `.venv\Scripts\python.exe` en los comandos siguientes).
3. Ejecuta `python -m pip install -r requirements.txt`.
4. Copia `.env.example` a `.env` y coloca tu usuario/contraseña de MySQL. No subas `.env` a GitHub.
5. Ejecuta `python app.py`.
6. Abre `http://127.0.0.1:5000/api/health`; debe devolver `{"status":"ok","database":"connected"}`.
7. Visita `/api/almacenes` y `/api/existencias`. Las existencias comienzan vacías: no se copiaron los datos ficticios del navegador.

**Seguridad:** El endpoint de traspasos es una demostración de transacciones y aún no tiene autenticación. No exponer este servidor a Internet ni utilizarlo para inventario real. Falta implementar inicio de sesión, permisos, entregas/devoluciones, autorización de supervisor, baja de trabajadores, carga inicial y pruebas de concurrencia.
