import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Product {
  title: string;
  price: number;
  image: string;
  url: string;
  store: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  searchText = '';
  products: Product[] = [];
  loading = false;

  private http = inject(HttpClient);

  search() {
    if (!this.searchText.trim()) return;

    this.loading = true;

    this.http
      .get<any[]>(
        `http://localhost:3000/products/search?query=${encodeURIComponent(
          this.searchText,
        )}`,
      )
      .subscribe({
        next: result => {
          console.log(result);
          this.products = result;
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.loading = false;
        },
      });
  }
}