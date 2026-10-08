
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Almacen {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:5000/api';

  obtenerAlmacenes(): Observable<Almacen[]> {
    return this.http.get<Almacen[]>(
      `${this.apiUrl}/almacenes`
    );
  }
}
