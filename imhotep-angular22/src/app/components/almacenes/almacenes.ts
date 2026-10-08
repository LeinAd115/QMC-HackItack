
import { Component, inject, OnInit, signal } from '@angular/core';
import { InventarioService, Almacen } from '../../services/inventario';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [],
  templateUrl: './almacenes.html',
  styleUrl: './almacenes.css'
})
export class Almacenes implements OnInit {

  private inventarioService = inject(InventarioService);

  // Estados reactivos
  almacenes = signal<Almacen[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string>('');

  ngOnInit(): void {
    this.cargarAlmacenes();
  }

  cargarAlmacenes(): void {

    this.cargando.set(true);
    this.error.set('');

    this.inventarioService.obtenerAlmacenes().subscribe({

      next: (datos) => {
        console.log('Almacenes recibidos:', datos);

        this.almacenes.set(datos);
        this.cargando.set(false);
      },

      error: (err) => {
        console.error('Error al consultar almacenes:', err);

        this.error.set('No se pudieron cargar los almacenes.');
        this.cargando.set(false);
      }

    });
  }
}
