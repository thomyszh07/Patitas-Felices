import { auth, db } from "./firebase-config.js";
import { carrito, calcularTotales, vaciarCarrito } from "./carrito.js";
import { mostrarNotificacion } from "./notificaciones.js";
import { collection, doc, getDoc, runTransaction, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const form = $("entregaForm");
const API_URL =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://patitas-felices-1jlr.onrender.com";

function datosEntrega() {
    return {
        nombre: $("nombreEntrega").value.trim(),
        telefono: $("telefonoEntrega").value.trim(),
        direccion: $("direccionEntrega").value.trim(),
        distrito: $("distritoEntrega").value,
        referencia: $("referenciaEntrega").value.trim(),
        metodoEntrega: document.querySelector('[name="metodoEntrega"]:checked').value,
        metodoPago: document.querySelector('[name="metodoPago"]:checked').value
    };
}

document.querySelector(".boton-comprar")?.addEventListener("click", e => {
    if (!carrito.length) {
        e.preventDefault();
        return mostrarNotificacion("Tu carrito está vacío.", "error");
    }

    if (!auth.currentUser) {
        e.preventDefault();
        mostrarNotificacion("Debes iniciar sesión.", "error");
        setTimeout(() => location.href = "login.html", 1200);
    }
});

form?.addEventListener("submit", async e => {
    e.preventDefault();

    if (!auth.currentUser)
        return mostrarNotificacion("Debes iniciar sesión.", "error");

    if (!carrito.length)
        return mostrarNotificacion("Tu carrito está vacío.", "error");

    const datos = datosEntrega();

    if (datos.metodoPago === "PayPal")
        return mostrarNotificacion("Usa el botón de PayPal para pagar.", "error");

    const boton = form.querySelector("button[type='submit']");
    boton.disabled = true;
    boton.textContent = "Procesando...";

    try {
        const id = await guardarPedido(datos);
        vaciarCarrito();
        location.href = `pedido.html?id=${id}`;
    } catch (error) {
        mostrarNotificacion(error.message, "error");
        boton.disabled = false;
        boton.textContent = "Confirmar pedido";
    }
});

async function guardarPedido(entrega, pago = null) {
    const totales = calcularTotales();
    const pedidoRef = doc(collection(db, "pedidos"));

    await runTransaction(db, async t => {
        const productos = [];

        for (const item of carrito) {
            const ref = doc(db, "productos", item.id);
            const snap = await t.get(ref);

            if (!snap.exists())
                throw new Error(`${item.nombre} no existe.`);

            const stock = snap.data().stock || 0;

            if (stock < item.cantidad)
                throw new Error(`Stock insuficiente de ${item.nombre}.`);

            productos.push({ item, ref, stock });
        }

        productos.forEach(({ item, ref, stock }) =>
            t.update(ref, { stock: stock - item.cantidad })
        );

        t.set(pedidoRef, {
            uid: auth.currentUser.uid,
            clienteNombre: auth.currentUser.displayName || entrega.nombre,
            clienteCorreo: auth.currentUser.email,
            items: carrito.map(({ id, nombre, precio, cantidad }) =>
                ({ id, nombre, precio, cantidad })),
            entrega,
            ...totales,
            estado: pago ? "pagado" : "pendiente",
            pago,
            fecha: serverTimestamp()
        });
    });

    return pedidoRef.id;
}


/* PAYPAL */

const paypalRadio = document.querySelector('input[value="PayPal"]');
const paypalBox = $("paypal-button-container");

if (paypalRadio && paypalBox && window.paypal) {

    document.querySelectorAll('[name="metodoPago"]').forEach(radio =>
        radio.addEventListener("change", () =>
            paypalBox.style.display = paypalRadio.checked ? "block" : "none"
        )
    );

    paypal.Buttons({

        createOrder: async () => {
            if (!form.checkValidity()) {
                form.reportValidity();
                throw new Error("Completa los datos");
            }

            const { total } = calcularTotales();

            const r = await fetch(`${API_URL}/api/paypal/orden`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ total })
            });

            const orden = await r.json();

            if (!r.ok) throw new Error(orden.error);

            return orden.id;
        },

        onApprove: async data => {
            try {
                const r = await fetch(
                    `${API_URL}/api/paypal/orden/${data.orderID}/capturar`,
                    { method: "POST" }
                );

                const pagoPayPal = await r.json();

                if (!r.ok || pagoPayPal.status !== "COMPLETED")
                    throw new Error("No se pudo completar el pago.");

                const pago = {
                    metodo: "PayPal",
                    estado: "COMPLETED",
                    orderId: data.orderID,
                    captureId:
                        pagoPayPal.purchase_units?.[0]
                            ?.payments?.captures?.[0]?.id || ""
                };

                const id = await guardarPedido(datosEntrega(), pago);

                vaciarCarrito();
                location.href = `pedido.html?id=${id}`;

            } catch (error) {
                mostrarNotificacion(error.message, "error");
            }
        },

        onCancel: () =>
            mostrarNotificacion("Pago cancelado.", "error"),

        onError: error => {
            console.error(error);
            mostrarNotificacion("Error con PayPal.", "error");
        }

    }).render("#paypal-button-container");
}


/* MOSTRAR PEDIDO */

export async function mostrarPedido() {
    const contenedor = $("datosPedido");
    if (!contenedor) return;

    const id = new URLSearchParams(location.search).get("id");

    if (!id)
        return contenedor.innerHTML = "<p>No se encontró el pedido.</p>";

    try {
        const snap = await getDoc(doc(db, "pedidos", id));

        if (!snap.exists())
            return contenedor.innerHTML = "<p>El pedido no existe.</p>";

        const p = snap.data();

        const productos = p.items.map(item =>
            `<p>${item.cantidad} × ${item.nombre} — S/ ${(item.precio * item.cantidad).toFixed(2)}</p>`
        ).join("");

        contenedor.innerHTML = `
            <p><strong>N° pedido:</strong> ${id}</p>
            <p><strong>Cliente:</strong> ${p.clienteNombre}</p>
            <p><strong>Correo:</strong> ${p.clienteCorreo}</p>
            <hr>${productos}<hr>
            <p><strong>Entrega:</strong> ${p.entrega.metodoEntrega}</p>
            <p><strong>Distrito:</strong> ${p.entrega.distrito}</p>
            <p><strong>Pago:</strong> ${p.entrega.metodoPago}</p>
            <p><strong>Estado:</strong> ${p.estado}</p>
            <p><strong>Total:</strong> S/ ${p.total.toFixed(2)}</p>
        `;

    } catch {
        contenedor.innerHTML = "<p>No se pudo cargar el pedido.</p>";
    }
}