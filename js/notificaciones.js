/* =========================================
   NOTIFICACIONES (toasts)
   Reemplaza los alert() del navegador por
   notificaciones flotantes que se cierran
   solas, acordes con el tema de la tienda.
========================================= */

function obtenerContenedor() {

    let contenedor = document.getElementById("toast-container");

    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "toast-container";
        document.body.appendChild(contenedor);
    }

    return contenedor;
}

const ICONOS = {
    exito: "✔",
    error: "✖",
    info: "🐾"
};

/**
 * Muestra una notificación flotante.
 * @param {string} mensaje - Texto a mostrar.
 * @param {"exito"|"error"|"info"} tipo - Estilo de la notificación.
 * @param {number} duracion - Tiempo en ms antes de cerrarse sola.
 */
export function mostrarNotificacion(mensaje, tipo = "info", duracion = 3500) {

    const contenedor = obtenerContenedor();

    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;

    toast.innerHTML = `
        <span class="toast-icono">${ICONOS[tipo] || ICONOS.info}</span>
        <span class="toast-texto"></span>
        <button type="button" class="toast-cerrar" aria-label="Cerrar">&times;</button>
    `;

    toast.querySelector(".toast-texto").textContent = mensaje;

    contenedor.appendChild(toast);

    // Doble requestAnimationFrame: asegura que el navegador pinte el
    // estado inicial (oculto) antes de añadir la clase visible, para
    // que la transición de entrada sí se dispare.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add("toast-visible");
        });
    });

    let cerrado = false;

    const cerrar = () => {

        if (cerrado) return;
        cerrado = true;

        toast.classList.remove("toast-visible");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });

        // Respaldo por si transitionend no llega a dispararse
        setTimeout(() => toast.remove(), 500);
    };

    toast.querySelector(".toast-cerrar").addEventListener("click", cerrar);

    setTimeout(cerrar, duracion);
}
