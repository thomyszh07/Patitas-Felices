/* =========================================
   CARRITO (localStorage — está bien que se
   quede aquí, es información temporal de la
   sesión de compra, no necesita Firestore)
========================================= */

import { mostrarNotificacion } from "./notificaciones.js";

export let carrito =
    JSON.parse(localStorage.getItem("carrito")) || [];


export function guardarCarrito() {

    localStorage.setItem("carrito", JSON.stringify(carrito));

    actualizarContador();

}


export function agregarItem(producto) {

    const productoExistente =
        carrito.find(item => item.id === producto.id);

    if (productoExistente) {

        productoExistente.cantidad++;

    } else {

        carrito.push({

            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1

        });

    }

    guardarCarrito();

    mostrarNotificacion(producto.nombre + " fue agregado al carrito.", "exito");

}


export function cambiarCantidad(id, cambio) {

    const item = carrito.find(producto => producto.id === id);

    if (!item) {
        return;
    }

    item.cantidad += cambio;

    if (item.cantidad <= 0) {

        carrito = carrito.filter(producto => producto.id !== id);

    }

    guardarCarrito();

    mostrarCarrito();

}


export function eliminarProducto(id) {

    carrito = carrito.filter(producto => producto.id !== id);

    guardarCarrito();

    mostrarCarrito();

}


export function vaciarCarrito() {

    carrito = [];

    localStorage.removeItem("carrito");

    actualizarContador();

}


export function actualizarContador() {

    const contador = document.getElementById("contadorCarrito");

    if (!contador) {
        return;
    }

    let cantidad = 0;

    carrito.forEach(item => {
        cantidad += item.cantidad;
    });

    contador.textContent = cantidad;

}


export function calcularTotales() {

    let subtotal = 0;

    carrito.forEach(item => {
        subtotal += item.precio * item.cantidad;
    });

    const envio = carrito.length === 0 ? 0 : 5;

    return {
        subtotal: subtotal,
        envio: envio,
        total: subtotal + envio
    };

}


export function mostrarCarrito() {

    const contenedor = document.getElementById("productosCarrito");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    if (carrito.length === 0) {

        contenedor.innerHTML = `
            <div class="item-carrito">
                <p>Tu carrito está vacío 🛒</p>
            </div>
        `;

        actualizarTotalesEnPantalla();

        return;

    }

        carrito.forEach(item => {

        const elemento = document.createElement("div");

        elemento.classList.add("item-carrito");

        // Normalizamos barras por si acaso vengan con "\"
        const rutaImagen = typeof item.imagen === "string" ? item.imagen.replace(/\\/g, "/") : "";

        // Comprueba si es una URL, Base64 o si termina en una extensión de imagen común
        const esImagen = rutaImagen && (
            rutaImagen.startsWith("http://") ||
            rutaImagen.startsWith("https://") ||
            rutaImagen.startsWith("data:image/") ||
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(rutaImagen)
        );

        const contenidoImagen = esImagen
            ? `<img src="${rutaImagen}" alt="${item.nombre}" loading="lazy">`
            : (item.imagen || "🐾");

        elemento.innerHTML = `

            <div class="item-principal">

                <div class="item-imagen">
                    ${contenidoImagen}
                </div>

                <div class="item-info">
                    <h3>${item.nombre}</h3>
                    <p class="item-precio">S/ ${item.precio.toFixed(2)}</p>
                </div>

            </div>

            <div class="cantidad">
                <button onclick="cambiarCantidad('${item.id}', -1)">-</button>
                <span>${item.cantidad}</span>
                <button onclick="cambiarCantidad('${item.id}', 1)">+</button>
            </div>

            <button class="eliminar" onclick="eliminarProducto('${item.id}')">
                Eliminar
            </button>

        `;

        contenedor.appendChild(elemento);

    });

    actualizarTotalesEnPantalla();

}


function actualizarTotalesEnPantalla() {

    const subtotalElemento = document.getElementById("subtotal");
    const totalElemento = document.getElementById("total");

    if (!subtotalElemento || !totalElemento) {
        return;
    }

    const totales = calcularTotales();

    subtotalElemento.textContent = "S/ " + totales.subtotal.toFixed(2);
    totalElemento.textContent = "S/ " + totales.total.toFixed(2);

}
