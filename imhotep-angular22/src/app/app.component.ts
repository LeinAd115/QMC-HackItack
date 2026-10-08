
import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store, Role, Item } from './store';
import { Almacenes } from './components/almacenes/almacenes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, Almacenes],
  templateUrl: './app.component.html'
})
export class AppComponent {

  store = inject(Store);

  role = signal<Role | null>(null);
  page = signal('dashboard');

  username = 'almacenista';
  password = 'demo123';

  message = signal('');
  error = signal(false);

  itemId = 'ALT-024';
  workerId = '12345';
  quantity = 1;
  target = 'Contratistas';
  supervisorCode = '';
  scanner = '';

  worker = {
    id: '',
    name: '',
    area: 'Midrex',
    active: true
  };

  newItem: Item = {
    id: '',
    name: '',
    kind: 'consumible',
    warehouse: 'Kepler',
    quantity: 1,
    limit: 1,
    inspection: 'no_aplica',
    status: 'apto'
  };

  readonly accounts = [
    { username: 'almacenista', role: 'almacenista' as Role },
    { username: 'supervisor', role: 'supervisor' as Role },
    { username: 'compras', role: 'compras' as Role },
    { username: 'rh', role: 'rh' as Role }
  ];

  readonly sections = [
    { id: 'dashboard', name: 'Resumen', title: 'Panel de control' },
    { id: 'entrega', name: 'Entregar', title: 'Entrega de equipo' },
    { id: 'devolucion', name: 'Devolver', title: 'Devolución de equipo' },
    { id: 'traspaso', name: 'Traspasar', title: 'Traspaso entre almacenes' },
    { id: 'inventario', name: 'Inventario', title: 'Inventario' },
    { id: 'almacenes', name: 'Almacenes', title: 'Almacenes IMHOTEP' },
    { id: 'trabajadores', name: 'Trabajadores', title: 'Trabajadores' },
    { id: 'movimientos', name: 'Movimientos', title: 'Historial de movimientos' }
  ];

  readonly pageTitle = computed(() => {
    return this.sections.find(s => s.id === this.page())?.title
      ?? 'Página no encontrada';
  });

  readonly visible = computed(() =>
    this.sections.filter(s =>
      this.role() === 'supervisor' ||
      (this.role() === 'almacenista' && s.id !== 'trabajadores') ||
      (this.role() === 'compras' &&
        ['dashboard', 'inventario', 'almacenes', 'movimientos'].includes(s.id)) ||
      (this.role() === 'rh' &&
        ['dashboard', 'trabajadores'].includes(s.id))
    )
  );

  readonly selected = computed(() =>
    this.store.data().items.find(x => x.id === this.itemId)
  );

  readonly activeLoans = computed(() =>
    this.store.data().workers.flatMap(w =>
      this.store.pending(w.id).map(p => ({
        worker: w,
        item: p.item,
        quantity: p.quantity
      }))
    )
  );

  login() {
    const a = this.accounts.find(
      x => x.username === this.username.trim().toLowerCase()
    );

    if (!a || this.password !== 'demo123') {
      this.alert('Credenciales incorrectas', true);
      return;
    }

    this.role.set(a.role);
    this.page.set('dashboard');
    this.message.set('');
  }

  logout() {
    this.role.set(null);
    this.password = '';
    this.message.set('');
  }

  navigate(p: string) {
    this.page.set(p);
    this.message.set('');
  }

  alert(s: string, isError = false) {
    this.error.set(isError);
    this.message.set(s);
  }

  run(type: 'entrega' | 'devolucion' | 'traspaso') {
    try {
      const folio = this.store.move(
        type,
        this.itemId,
        this.workerId,
        Number(this.quantity),
        this.target,
        this.username,
        this.role() === 'supervisor' &&
          this.supervisorCode === 'AUTORIZAR'
      );

      this.alert('Movimiento registrado: ' + folio);
      this.supervisorCode = '';

    } catch (e) {
      this.alert((e as Error).message, true);
    }
  }

  registerWorker() {
    try {
      this.store.addWorker({ ...this.worker });

      this.worker = {
        id: '',
        name: '',
        area: 'Midrex',
        active: true
      };

      this.alert('Trabajador registrado');

    } catch (e) {
      this.alert((e as Error).message, true);
    }
  }

  registerItem() {
    try {
      this.store.addItem({
        ...this.newItem,
        quantity: Number(this.newItem.quantity),
        limit: Number(this.newItem.limit)
      });

      this.newItem = {
        id: '',
        name: '',
        kind: 'consumible',
        warehouse: 'Kepler',
        quantity: 1,
        limit: 1,
        inspection: 'no_aplica',
        status: 'apto'
      };

      this.alert('Artículo registrado');

    } catch (e) {
      this.alert((e as Error).message, true);
    }
  }

  deactivate(id: string) {
    try {
      this.store.deactivate(id);
      this.alert('Baja registrada');

    } catch (e) {
      this.alert((e as Error).message, true);
    }
  }

  scan() {
    const value = this.scanner.trim().toUpperCase();

    const item = this.store.data().items.find(
      i => i.id.toUpperCase() === value
    );

    if (!item) {
      this.alert('Código no encontrado', true);
      return;
    }

    this.itemId = item.id;
    this.scanner = '';

    this.alert('Artículo identificado: ' + this.itemId);
  }

  exportCsv() {
    const rows = [
      [
        'Folio', 'Tipo', 'Articulo', 'Trabajador',
        'Origen', 'Destino', 'Cantidad', 'Responsable', 'Fecha'
      ],
      ...this.store.data().movements.map(m => [
        m.folio,
        m.type,
        m.itemId,
        m.workerId,
        m.from,
        m.to,
        String(m.quantity),
        m.user,
        m.date
      ])
    ];

    const csv = rows
      .map(r =>
        r.map(x => '"' + String(x).replaceAll('"', '""') + '"')
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'imhotep-movimientos.csv';
    a.click();

    URL.revokeObjectURL(url);
  }

  print() {
    window.print();
  }
}
