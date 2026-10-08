import { Injectable, signal } from '@angular/core';
export type Role='almacenista'|'supervisor'|'compras'|'rh';
export interface Worker {id:string;name:string;area:string;active:boolean;}
export interface Item {id:string;name:string;kind:'pieza'|'consumible';warehouse:string;quantity:number;limit:number;inspection:'vigente'|'vencida'|'no_aplica';status:'apto'|'no_apto';}
export interface Movement {folio:string;type:'entrega'|'devolucion'|'traspaso';itemId:string;workerId:string;from:string;to:string;quantity:number;user:string;date:string;}
interface Data {workers:Worker[];items:Item[];movements:Movement[];}
const W=['Kepler','Contratistas','Midrex','HYL','Laminador','Minas'];
const SEED:Data={workers:[{id:'12345',name:'Juan Pérez García',area:'Midrex',active:true},{id:'12346',name:'María López',area:'HYL',active:true}],items:[
{id:'ALT-024',name:'Arnés Kevlar',kind:'pieza',warehouse:'Kepler',quantity:1,limit:1,inspection:'vigente',status:'apto'},
{id:'ALT-025',name:'Arnés poliéster',kind:'pieza',warehouse:'Kepler',quantity:1,limit:1,inspection:'vencida',status:'apto'},
{id:'ALT-026',name:'Bandola',kind:'pieza',warehouse:'Contratistas',quantity:1,limit:1,inspection:'vigente',status:'apto'},
{id:'ALT-027',name:'Gancho doble de vida',kind:'pieza',warehouse:'Contratistas',quantity:1,limit:1,inspection:'vigente',status:'apto'},
{id:'HER-101',name:'Minipulidor',kind:'pieza',warehouse:'Midrex',quantity:1,limit:1,inspection:'no_aplica',status:'apto'},
{id:'EPP-100',name:'Guantes',kind:'consumible',warehouse:'HYL',quantity:40,limit:3,inspection:'no_aplica',status:'apto'},
{id:'CON-101',name:'Discos de corte 9 pulgadas',kind:'consumible',warehouse:'Laminador',quantity:30,limit:5,inspection:'no_aplica',status:'apto'}],movements:[]};
@Injectable({providedIn:'root'}) export class Store {
 readonly warehouses=W;
 readonly data=signal<Data>(this.load());
 private load():Data{try{const s=localStorage.getItem('imhotep-demo-v1');return s?JSON.parse(s) as Data:structuredClone(SEED)}catch{return structuredClone(SEED)}}
 private save(d:Data){this.data.set(d);localStorage.setItem('imhotep-demo-v1',JSON.stringify(d))}
 get balance(){return (workerId:string,itemId:string)=>this.data().movements.filter(m=>m.workerId===workerId&&m.itemId===itemId).reduce((n,m)=>n+(m.type==='entrega'?m.quantity:m.type==='devolucion'?-m.quantity:0),0)}
 get pending(){return (workerId:string)=>this.data().items.map(i=>({item:i,quantity:this.balance(workerId,i.id)})).filter(x=>x.quantity>0)}
 addWorker(w:Worker){if(!w.id.trim()||!w.name.trim()||this.data().workers.some(x=>x.id===w.id))throw Error('Identificador duplicado o datos incompletos');this.save({...this.data(),workers:[...this.data().workers,{...w,active:true}]})}
 addItem(i:Item){if(!i.id.trim()||!i.name.trim()||this.data().items.some(x=>x.id===i.id)||!Number.isInteger(i.quantity)||i.quantity<0||!Number.isInteger(i.limit)||i.limit<1)throw Error('Artículo duplicado o datos inválidos');this.save({...this.data(),items:[...this.data().items,i]})}
 move(type:Movement['type'],itemId:string,workerId:string,quantity:number,to:string,user:string,authorized=false){const d=structuredClone(this.data());const i=d.items.find(x=>x.id===itemId);const origin=i?.warehouse||'';if(!i)throw Error('Artículo inexistente');if(!Number.isInteger(quantity)||quantity<1)throw Error('La cantidad debe ser un entero positivo');if(type==='entrega'){
 const w=d.workers.find(x=>x.id===workerId);if(!w||!w.active)throw Error('Trabajador inexistente o dado de baja');if(i.status!=='apto'||i.inspection==='vencida')throw Error('Entrega bloqueada: equipo no apto o inspección vencida');if(i.kind==='pieza'&&quantity!==1)throw Error('Las piezas individuales se entregan de una en una');if(i.quantity<quantity)throw Error('Existencias insuficientes');if(this.balance(workerId,itemId)+quantity>i.limit&&!authorized)throw Error('Se excede el límite. Se requiere autorización del supervisor');i.quantity-=quantity;
 }else if(type==='devolucion'){
 if(i.kind==='consumible')throw Error('Los consumibles no requieren devolución');if(this.balance(workerId,itemId)<quantity)throw Error('El trabajador no tiene esa cantidad pendiente');i.quantity+=quantity;
 }else{if(!W.includes(to)||to===i.warehouse)throw Error('Selecciona un almacén destino distinto');if(i.quantity<quantity)throw Error('Existencias insuficientes');if(i.kind==='pieza'&&quantity!==1)throw Error('Traspaso de pieza individual: cantidad 1');if(i.kind==='pieza')i.warehouse=to;else{const target=d.items.find(x=>x.name===i.name&&x.warehouse===to&&x.kind==='consumible');if(target)target.quantity+=quantity;else d.items.push({...i,id:i.id+'-'+to.toUpperCase(),warehouse:to,quantity});i.quantity-=quantity;}}
 const folio='IMH-'+String(Date.now());d.movements.unshift({folio,type,itemId,workerId:type==='traspaso'?'':workerId,from:origin,to:type==='traspaso'?to:'Trabajador',quantity,user,date:new Date().toISOString()});this.save(d);return folio;
 }
 deactivate(id:string){if(this.pending(id).length)throw Error('Baja bloqueada: el trabajador tiene artículos pendientes de devolución');this.save({...this.data(),workers:this.data().workers.map(w=>w.id===id?{...w,active:false}:w)})}
 reset(){this.save(structuredClone(SEED))}
}
