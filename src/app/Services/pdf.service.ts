import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Producto } from '../Models/models';

const pdfMakeAny = pdfMake as any;
pdfMakeAny.vfs = (pdfFonts as any).vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  // PDF
  generarReporteProductos(productos: Producto[]): void {
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });


    const tableBody: Array<Array<any>> = [
      [
        { text: 'Código', style: 'tableHeader', bold: true },
        { text: 'Nombre', style: 'tableHeader', bold: true },
        { text: 'Descripción', style: 'tableHeader', bold: true },
        { text: 'Precio', style: 'tableHeader', bold: true },
        { text: 'Stock', style: 'tableHeader', bold: true },
        { text: 'Estado', style: 'tableHeader', bold: true }
      ]
    ];

    productos.forEach(producto => {
      tableBody.push([
        { text: producto.codigo, style: 'tableCell' },
        { text: producto.nombre, style: 'tableCell' },
        { text: producto.descripcion || 'N/A', style: 'tableCell' },
        { text: this.formatCurrency(producto.precio), style: 'tableCell', alignment: 'right' },
        { text: producto.stock.toString(), style: 'tableCell', alignment: 'center' },
        {
          text: producto.activo ? 'Activo' : 'Inactivo',
          style: 'tableCell',
          color: producto.activo ? '#155724' : '#721c24',
          bold: true
        }
      ]);
    });

    const totalProductos = productos.length;
    const productosActivos = productos.filter(p => p.activo).length;
    const productosInactivos = productos.filter(p => !p.activo).length;
    const valorTotalInventario = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);
    const stockTotal = productos.reduce((sum, p) => sum + p.stock, 0);

    const documentDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape', 
      pageMargins: [40, 60, 40, 60],

      header: {
        margin: [40, 20, 40, 0],
        columns: [
          {
            text: 'Sistema de Gestión de Productos',
            style: 'header',
            alignment: 'left'
          },
          {
            text: fechaActual,
            style: 'subheader',
            alignment: 'right'
          }
        ]
      },

      footer: (currentPage: number, pageCount: number) => {
        return {
          margin: [40, 0, 40, 0],
          columns: [
            {
              text: 'Generado automáticamente por el Sistema CRUD',
              style: 'footer',
              alignment: 'left'
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              style: 'footer',
              alignment: 'right'
            }
          ]
        };
      },

      content: [
        {
          text: 'REPORTE DE PRODUCTOS',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },

        {
          style: 'statisticsBox',
          margin: [0, 0, 0, 20],
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                {
                  text: [
                    { text: 'Total de Productos\n', style: 'statLabel' },
                    { text: totalProductos.toString(), style: 'statValue' }
                  ],
                  alignment: 'center'
                },
                {
                  text: [
                    { text: 'Productos Activos\n', style: 'statLabel' },
                    { text: productosActivos.toString(), style: 'statValue', color: '#155724' }
                  ],
                  alignment: 'center'
                },
                {
                  text: [
                    { text: 'Stock Total\n', style: 'statLabel' },
                    { text: stockTotal.toString(), style: 'statValue' }
                  ],
                  alignment: 'center'
                },
                {
                  text: [
                    { text: 'Valor Total Inventario\n', style: 'statLabel' },
                    { text: this.formatCurrency(valorTotalInventario), style: 'statValue', color: '#0c5460' }
                  ],
                  alignment: 'center'
                }
              ]
            ]
          },
          layout: {
            fillColor: '#f8f9fa',
            hLineWidth: () => 0,
            vLineWidth: () => 0
          }
        },

        {
          text: 'Detalle de Productos',
          style: 'sectionHeader',
          margin: [0, 10, 0, 10]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
            body: tableBody
          },
          layout: {
            fillColor: (rowIndex: number) => {
              return rowIndex === 0 ? '#667eea' : (rowIndex % 2 === 0 ? '#f8f9fa' : null);
            },
            hLineWidth: (i: number, node: any) => {
              return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
            },
            vLineWidth: () => 0.5,
            hLineColor: () => '#dee2e6',
            vLineColor: () => '#dee2e6',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6
          }
        },

        this.getProductosBajoStock(productos),
        {
          text: '\nNotas:',
          style: 'notesHeader',
          margin: [0, 20, 0, 5]
        },
        {
          ul: [
            'Los productos marcados como "Inactivo" no están disponibles para la venta.',
            'Los precios mostrados están en dólares estadounidenses (USD).',
            'El valor total del inventario se calcula como: Precio × Stock de cada producto.',
            `Reporte generado el ${fechaActual}.`
          ],
          style: 'notes'
        }
      ],

      styles: {
        header: {
          fontSize: 14,
          bold: true,
          color: '#667eea'
        },
        subheader: {
          fontSize: 10,
          color: '#6c757d'
        },
        title: {
          fontSize: 20,
          bold: true,
          color: '#2c3e50'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#495057',
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          fontSize: 10,
          color: 'white',
          bold: true,
          alignment: 'center'
        },
        tableCell: {
          fontSize: 9,
          color: '#495057'
        },
        statLabel: {
          fontSize: 10,
          color: '#6c757d'
        },
        statValue: {
          fontSize: 18,
          bold: true,
          color: '#2c3e50'
        },
        footer: {
          fontSize: 8,
          color: '#6c757d',
          italics: true
        },
        notesHeader: {
          fontSize: 11,
          bold: true,
          color: '#495057'
        },
        notes: {
          fontSize: 9,
          color: '#6c757d',
          lineHeight: 1.3
        },
        warningBox: {
          fontSize: 10,
          color: '#856404',
          fillColor: '#fff3cd',
          margin: [0, 5, 0, 5]
        }
      }
    };

    const nombreArchivo = `Reporte_Productos_${this.getTimestamp()}.pdf`;
    pdfMake.createPdf(documentDefinition).download(nombreArchivo);
  }

  private getProductosBajoStock(productos: Producto[]): any {
    const productosBajoStock = productos.filter(p => p.stock < 10 && p.activo);

    if (productosBajoStock.length === 0) {
      return {
        text: '\n✓ Todos los productos activos tienen stock adecuado (≥10 unidades).',
        style: 'notes',
        color: '#155724',
        margin: [0, 10, 0, 0]
      };
    }

    const tableBody: Array<Array<any>> = [
      [
        { text: 'Código', bold: true, fontSize: 9 },
        { text: 'Producto', bold: true, fontSize: 9 },
        { text: 'Stock', bold: true, fontSize: 9, alignment: 'center' }
      ]
    ];

    productosBajoStock.forEach(p => {
      tableBody.push([
        { text: p.codigo, fontSize: 8 },
        { text: p.nombre, fontSize: 8 },
        { text: p.stock.toString(), fontSize: 8, alignment: 'center', color: '#721c24', bold: true }
      ]);
    });

    return {
      stack: [
        {
          text: '\n⚠️ Productos con Bajo Stock (< 10 unidades)',
          style: 'sectionHeader',
          color: '#856404',
          margin: [0, 10, 0, 10]
        },
        {
          table: {
            widths: ['auto', '*', 'auto'],
            body: tableBody
          },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#fff3cd' : null,
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ffeaa7',
            vLineColor: () => '#ffeaa7'
          }
        }
      ]
    };
  }


  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  private getTimestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
}
