/* =========================================
   PEDIDOS (Firestore, colección "pedidos")
   Descuenta stock con una transacción para
   evitar vender más de lo disponible.
========================================= */

import { auth, db } from "./firebase-config.js";
import { carrito, calcularTotales, vaciarCarrito } from "./carrito.js";

import {
    collection,
    doc,
    addDoc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


/* =========================================
   VALIDAR ANTES DE IR A "DATOS DE ENTREGA"
   (el link "Realizar pedido" en carrito.html)
========================================= */

const linkRealizarPedido = document.querySelector(".boton-comprar");

if (linkRealizarPedido) {

    linkRealizarPedido.addEventListener("click", function (event) {

        if (carrito.length === 0) {

            event.preventDefault();
            alert("Tu carrito está vacío.");
            return;

        }

        if (!auth.currentUser) {

            event.preventDefault();
            alert("Debes iniciar sesión para realizar un pedido.");
            window.location.href = "login.html";

        }

    });

}


/* =========================================
   FORMULARIO DE DATOS DE ENTREGA
   -> aquí se confirma el pedido de verdad
========================================= */

const entregaForm = document.getElementById("entregaForm");

if (entregaForm) {

    entregaForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!auth.currentUser) {
            alert("Debes iniciar sesión para realizar un pedido.");
            window.location.href = "login.html";
            return;
        }

        if (carrito.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        const datosEntrega = {

            nombre: document.getElementById("nombreEntrega").value.trim(),
            telefono: document.getElementById("telefonoEntrega").value.trim(),
            direccion: document.getElementById("direccionEntrega").value.trim(),
            distrito: document.getElementById("distritoEntrega").value,
            referencia: document.getElementById("referenciaEntrega").value.trim(),

            metodoEntrega: document.querySelector(
                'input[name="metodoEntrega"]:checked'
            ).value,

            metodoPago: document.querySelector(
                'input[name="metodoPago"]:checked'
            ).value

        };

        const botonSubmit = entregaForm.querySelector('button[type="submit"]');
        botonSubmit.disabled = true;
        botonSubmit.textContent = "Procesando...";

        try {

            const pedidoId = await confirmarPedido(datosEntrega);

            vaciarCarrito();

            window.location.href = "pedido.html?id=" + pedidoId;

        } catch (error) {

            console.error(error);
            alert(error.message || "No se pudo procesar el pedido. Intenta nuevamente.");

            botonSubmit.disabled = false;
            botonSubmit.textContent = "Confirmar pedido";

        }

    });

}


/* =========================================
   TRANSACCIÓN: descuenta stock y crea el pedido
========================================= */

async function confirmarPedido(datosEntrega) {

    const totales = calcularTotales();
    const usuario = auth.currentUser;

    // 1) Descontar stock dentro de una transacción: si algún producto
    //    no tiene suficiente stock, TODA la operación se cancela y no
    //    se cobra ni se crea el pedido.
    await runTransaction(db, async (transaccion) => {

        for (const item of carrito) {

            const productoRef = doc(db, "productos", item.id);
            const productoSnap = await transaccion.get(productoRef);

            if (!productoSnap.exists()) {
                throw new Error("El producto '" + item.nombre + "' ya no existe.");
            }

            const stockActual = productoSnap.data().stock || 0;

            if (stockActual < item.cantidad) {
                throw new Error(
                    "Ya no hay suficiente stock de '" + item.nombre + "' " +
                    "(disponible: " + stockActual + ")."
                );
            }

            transaccion.update(productoRef, { stock: stockActual - item.cantidad });

        }

    });

    // 2) Si el stock se descontó sin problemas, recién ahí creamos el pedido
    const pedidoRef = await addDoc(collection(db, "pedidos"), {

        uid: usuario.uid,
        clienteNombre: usuario.displayName || datosEntrega.nombre,
        clienteCorreo: usuario.email,

        items: carrito.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad
        })),

        entrega: datosEntrega,

        subtotal: totales.subtotal,
        envio: totales.envio,
        total: totales.total,

        estado: "pendiente",
        fecha: serverTimestamp()

    });

    return pedidoRef.id;

}


/* =========================================
   MOSTRAR DATOS DEL PEDIDO (pedido.html)
========================================= */

export async function mostrarPedido() {

    const contenedor = document.getElementById("datosPedido");

    if (!contenedor) {
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    const pedidoId = parametros.get("id");

    if (!pedidoId) {
        contenedor.innerHTML = "<p>No se encontró información del pedido.</p>";
        return;
    }

    try {

        const pedidoSnap = await getDoc(doc(db, "pedidos", pedidoId));

        if (!pedidoSnap.exists()) {
            contenedor.innerHTML = "<p>No se encontró este pedido.</p>";
            return;
        }

        const pedido = pedidoSnap.data();

        const fecha = pedido.fecha
            ? pedido.fecha.toDate().toLocaleString()
            : "—";

        const itemsHtml = pedido.items.map(item =>
            `<p>${item.cantidad} × ${item.nombre} — S/ ${(item.precio * item.cantidad).toFixed(2)}</p>`
        ).join("");

        contenedor.innerHTML = `

            <p><strong>N° de pedido:</strong> ${pedidoId}</p>
            <p><strong>Cliente:</strong> ${pedido.clienteNombre}</p>
            <p><strong>Correo:</strong> ${pedido.clienteCorreo}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>

            <hr style="margin: 12px 0;">

            ${itemsHtml}

            <hr style="margin: 12px 0;">

            <p><strong>Entrega:</strong> ${pedido.entrega.metodoEntrega} — ${pedido.entrega.distrito}</p>
            <p><strong>Pago:</strong> ${pedido.entrega.metodoPago}</p>
            <p><strong>Total:</strong> S/ ${pedido.total.toFixed(2)}</p>

        `;

    } catch (error) {

        console.error(error);
        contenedor.innerHTML = "<p>No se pudo cargar el pedido.</p>";

    }

}
