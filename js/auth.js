/* =========================================
   AUTENTICACIÓN (Firebase Auth + Firestore)
========================================= */

import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { mostrarNotificacion } from "./notificaciones.js";


/* =========================================
   REGISTRO
========================================= */

const registroForm = document.getElementById("registroForm");

if (registroForm) {

    registroForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const password = document.getElementById("password").value;
        const telefono = document.getElementById("telefono").value.trim();

        try {

            const credencial =
                await createUserWithEmailAndPassword(auth, correo, password);

            // Guardamos el nombre como displayName del usuario de Auth
            await updateProfile(credencial.user, { displayName: nombre });

            // Guardamos datos adicionales (teléfono) en Firestore, ligados al uid
            await setDoc(doc(db, "usuarios", credencial.user.uid), {
                nombre: nombre,
                correo: correo,
                telefono: telefono
            });

            mostrarNotificacion("Registro exitoso. Ahora puedes iniciar sesión.", "exito");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1400);

        } catch (error) {

            mostrarNotificacion(traducirErrorAuth(error.code), "error");

        }

    });

}


/* =========================================
   LOGIN
========================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const correo = document.getElementById("loginCorreo").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {

            const credencial =
                await signInWithEmailAndPassword(auth, correo, password);

            mostrarNotificacion("Bienvenido/a " + (credencial.user.displayName || correo), "exito");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1400);

        } catch (error) {

            mostrarNotificacion(traducirErrorAuth(error.code), "error");

        }

    });

}


/* =========================================
   CERRAR SESIÓN
========================================= */

export async function cerrarSesion() {

    await signOut(auth);

    mostrarNotificacion("Has cerrado sesión.", "info");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1400);

}


/* =========================================
   ESTADO DE SESIÓN EN EL MENÚ
   (se ejecuta automáticamente en cada página)
========================================= */

const menuUsuario = document.getElementById("menuUsuario");
const menuUsuarioBoton = document.getElementById("menuUsuarioBoton");
const menuUsuarioTexto = document.getElementById("menuUsuarioTexto");
const menuUsuarioNombre = document.getElementById("menuUsuarioNombre");
const menuUsuarioCorreo = document.getElementById("menuUsuarioCorreo");
const menuUsuarioCerrarSesion = document.getElementById("menuUsuarioCerrarSesion");

if (menuUsuario && menuUsuarioBoton) {

    menuUsuarioBoton.addEventListener("click", function (event) {

        event.stopPropagation();

        if (menuUsuario.dataset.logueado === "true") {
            menuUsuario.classList.toggle("abierto");
        } else {
            window.location.href = "login.html";
        }

    });

    document.addEventListener("click", function () {
        menuUsuario.classList.remove("abierto");
    });

    if (menuUsuarioCerrarSesion) {

        menuUsuarioCerrarSesion.addEventListener("click", function (event) {

            event.stopPropagation();

            cerrarSesion();

        });

    }

}

onAuthStateChanged(auth, function (usuario) {

    if (!menuUsuario) {
        return;
    }

    menuUsuario.classList.add("listo");

    if (usuario) {

        menuUsuario.dataset.logueado = "true";

        if (menuUsuarioTexto) {
            menuUsuarioTexto.textContent = "MI CUENTA";
        }

        if (menuUsuarioNombre) {
            menuUsuarioNombre.textContent = usuario.displayName || "Usuario";
        }

        if (menuUsuarioCorreo) {
            menuUsuarioCorreo.textContent = usuario.email || "";
        }

    } else {

        menuUsuario.dataset.logueado = "false";

        menuUsuario.classList.remove("abierto");

        if (menuUsuarioTexto) {
            menuUsuarioTexto.textContent = "INICIAR SESIÓN";
        }

    }

});


/* =========================================
   MENSAJES DE ERROR EN ESPAÑOL
========================================= */

function traducirErrorAuth(codigo) {

    const mensajes = {
        "auth/email-already-in-use": "Este correo ya está registrado.",
        "auth/invalid-email": "El correo no es válido.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
        "auth/user-not-found": "Correo o contraseña incorrectos.",
        "auth/wrong-password": "Correo o contraseña incorrectos.",
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde."
    };

    return mensajes[codigo] || "Ocurrió un error. Intenta nuevamente.";

}
