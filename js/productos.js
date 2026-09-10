/* =========================================
   PRODUCTOS (Firestore, colección "productos")
   Cada documento debe tener:
   { nombre, categoria, precio, imagen, stock }
========================================= */

import { db } from "./firebase-config.js";
import { agregarItem } from "./carrito.js";
import { mostrarNotificacion } from "./notificaciones.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


// Caché en memoria de los productos ya cargados, para no
// tener que volver a pedirlos a Firestore cada vez que se filtra
let productosCache = [];


export async function cargarProductos() {

    const listaContenedor = document.getElementById("listaProductos");
    const destacadosContenedor = document.getElementById("destacadosContenedor");

    // Si esta página no muestra productos, no hacemos nada (evita
    // lecturas innecesarias a Firestore)
    if (!listaContenedor && !destacadosContenedor) {
        return;
    }

    try {

        const snapshot = await getDocs(collection(db, "productos"));

        productosCache = snapshot.docs.map(documento => ({
            id: documento.id,
            ...documento.data()
        }));

        mostrarProductos("todos");
        mostrarDestacados();

    } catch (error) {

        console.error("Error cargando productos:", error);

        if (listaContenedor) {
            listaContenedor.innerHTML = "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
        }

    }

}


export function mostrarProductos(categoria = "todos") {

    const contenedor = document.getElementById("listaProductos");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    let productosMostrar = productosCache;

    if (categoria !== "todos") {

        productosMostrar = productosCache.filter(
            producto => producto.categoria === categoria
        );

    }

    if (productosMostrar.length === 0) {
        contenedor.innerHTML = "<p>No hay productos en esta categoría todavía.</p>";
        return;
    }

    productosMostrar.forEach(producto => {

        contenedor.appendChild(crearTarjetaProducto(producto));

    });

}


function mostrarDestacados() {

    const contenedor = document.getElementById("destacadosContenedor");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    // Los primeros 3 productos como "destacados" — ajusta el criterio si quieres
    productosCache.slice(0, 3).forEach(producto => {

        contenedor.appendChild(crearTarjetaProducto(producto));

    });

}


function crearTarjetaProducto(producto) {

    const tarjeta = document.createElement("div");
    tarjeta.classList.add("producto");

    const sinStock = !producto.stock || producto.stock <= 0;

    // Normalizamos barras por si acaso vengan con "\"
    const rutaImagen = typeof producto.imagen === "string" ? producto.imagen.replace(/\\/g, "/") : "";

    // Comprueba si es una URL, Base64 o si termina en una extensión de imagen común
    const esImagen = rutaImagen && (
        rutaImagen.startsWith("http://") || 
        rutaImagen.startsWith("https://") || 
        rutaImagen.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(rutaImagen)
    );

    const contenidoImagen = esImagen
        ? `<img src="${rutaImagen}" alt="${producto.nombre}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
        : (producto.imagen || "🐾");

    tarjeta.innerHTML = `

        <div class="producto-imagen">
            ${contenidoImagen}
        </div>

        <h3>${producto.nombre}</h3>

        <p class="precio">S/ ${Number(producto.precio).toFixed(2)}</p>

        <p style="font-size:13px; margin-bottom:10px; color:${sinStock ? "#c0392b" : "#4a3a2a"}">
            ${sinStock ? "Sin stock" : "Stock: " + producto.stock}
        </p>

        <button
            class="boton"
            ${sinStock ? "disabled" : ""}
            onclick="agregarAlCarrito('${producto.id}')">
            ${sinStock ? "Agotado" : "Agregar al carrito"}
        </button>

    `;

    return tarjeta;

}


export function agregarAlCarrito(id) {

    const producto = productosCache.find(producto => producto.id === id);

    if (!producto) {
        return;
    }

    if (!producto.stock || producto.stock <= 0) {
        mostrarNotificacion("Este producto no tiene stock disponible.", "error");
        return;
    }

    agregarItem(producto);

}
