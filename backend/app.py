import os
from datetime import date
from uuid import uuid4
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r'/api/*': {'origins': os.getenv('FRONTEND_ORIGIN', 'http://localhost:4200')}})

def connect():
    return mysql.connector.connect(host=os.getenv('DB_HOST','127.0.0.1'),port=int(os.getenv('DB_PORT','3306')),user=os.getenv('DB_USER','root'),password=os.getenv('DB_PASSWORD',''),database=os.getenv('DB_NAME','imhotep'))

def fail(message, status=400):
    return jsonify({'error':message}),status

@app.get('/api/health')
def health():
    try:
        db=connect();db.close()
        return jsonify({'status':'ok','database':'connected'})
    except mysql.connector.Error:
        return fail('No se pudo conectar con MySQL',503)

@app.get('/api/almacenes')
def warehouses():
    db=connect()
    try:
        cur=db.cursor(dictionary=True);cur.execute('SELECT id,nombre FROM almacenes ORDER BY id');return jsonify(cur.fetchall())
    finally: db.close()

@app.get('/api/existencias')
def stock():
    db=connect()
    try:
        cur=db.cursor(dictionary=True)
        cur.execute('SELECT a.id,a.nombre,al.nombre AS almacen,e.cantidad FROM existencias e JOIN articulos a ON a.id=e.articulo_id JOIN almacenes al ON al.id=e.almacen_id ORDER BY al.id,a.nombre')
        consumibles=cur.fetchall()
        cur.execute("SELECT p.id,a.nombre,al.nombre AS almacen,1 AS cantidad,p.estado,p.inspeccion_hasta FROM piezas p JOIN articulos a ON a.id=p.articulo_id JOIN almacenes al ON al.id=p.almacen_id WHERE p.trabajador_id IS NULL ORDER BY al.id,p.id")
        return jsonify({'consumibles':consumibles,'piezas':cur.fetchall()})
    finally: db.close()

@app.get('/api/movimientos')
def movements():
    db=connect()
    try:
        cur=db.cursor(dictionary=True);cur.execute('SELECT * FROM movimientos ORDER BY id DESC LIMIT 200');rows=cur.fetchall()
        for r in rows:r['fecha']=r['fecha'].isoformat()
        return jsonify(rows)
    finally:db.close()

@app.post('/api/traspasos/consumibles')
def transfer_consumable():
    payload=request.get_json(silent=True) or {}
    try:
        articulo=str(payload['articulo_id']);origen=int(payload['origen_id']);destino=int(payload['destino_id']);cantidad=int(payload['cantidad']);responsable=str(payload['responsable']).strip()
    except (KeyError,ValueError,TypeError):return fail('Datos incompletos o inválidos')
    if origen==destino or cantidad<=0 or not responsable:return fail('Origen/destino, cantidad o responsable inválidos')
    db=connect()
    try:
        db.start_transaction();cur=db.cursor(dictionary=True)
        cur.execute("SELECT tipo FROM articulos WHERE id=%s",(articulo,));item=cur.fetchone()
        if not item or item['tipo']!='consumible':db.rollback();return fail('El artículo no es un consumible')
        # Bloqueo consistente para evitar entregas simultáneas sobre el mismo saldo.
        cur.execute('SELECT cantidad FROM existencias WHERE articulo_id=%s AND almacen_id=%s FOR UPDATE',(articulo,origen));row=cur.fetchone()
        if not row or row['cantidad']<cantidad:db.rollback();return fail('Existencias insuficientes',409)
        cur.execute('UPDATE existencias SET cantidad=cantidad-%s WHERE articulo_id=%s AND almacen_id=%s',(cantidad,articulo,origen))
        cur.execute('INSERT INTO existencias(articulo_id,almacen_id,cantidad) VALUES(%s,%s,%s) ON DUPLICATE KEY UPDATE cantidad=cantidad+VALUES(cantidad)',(articulo,destino,cantidad))
        folio='IMH-'+uuid4().hex[:12].upper()
        cur.execute("INSERT INTO movimientos(folio,tipo,articulo_id,origen_id,destino_id,cantidad,responsable) VALUES(%s,'traspaso',%s,%s,%s,%s,%s)",(folio,articulo,origen,destino,cantidad,responsable))
        db.commit();return jsonify({'folio':folio,'mensaje':'Traspaso registrado'}),201
    except mysql.connector.Error:
        db.rollback();return fail('Error de base de datos al registrar el traspaso',500)
    finally:db.close()

if __name__=='__main__':app.run(debug=True,host='127.0.0.1',port=5000)
