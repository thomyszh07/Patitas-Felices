import "./auth.js";
import "./perfil.js";

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


Object.assign(window, {
    mostrarProductos,
    agregarAlCarrito,
    cambiarCantidad,
    eliminarProducto
});


document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    mostrarCarrito();
    actualizarContador();
    mostrarPedido();
});