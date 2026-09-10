/* =========================================
   PUNTO DE ENTRADA
   Une todos los módulos y expone en window()
   las funciones que los HTML llaman con onclick,
   ya que los módulos ES no son globales por defecto.
========================================= */

import "./auth.js";

import {
    cargarProductos,
    mostrarProductos,
    agregarAlCarrito
} from "./productos.js";

import {
    mostrarCarrito,
    actualizarContador,
    cambiarCantidad,
    eliminarProducto
} from "./carrito.js";

import { mostrarPedido } from "./pedidos.js";
import "./pedidos.js"; // registra los listeners de datos-entrega.html
import "./perfil.js"; // registra los listeners de perfil.html

// Exponer al scope global para los onclick="..." en el HTML
window.mostrarProductos = mostrarProductos;
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarProducto = eliminarProducto;


document.addEventListener("DOMContentLoaded", function () {

    cargarProductos();     // productos.html / index.html (async, viene de Firestore)
    mostrarCarrito();      // carrito.html
    actualizarContador();  // contador del header
    mostrarPedido();       // pedido.html (lee ?id=... de la URL)

});
