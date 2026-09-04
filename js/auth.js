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

            alert("Registro exitoso. Ahora puedes iniciar sesión.");

            window.location.href = "login.html";

        } catch (error) {

            alert(traducirErrorAuth(error.code));

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

            alert("Bienvenido/a " + (credencial.user.displayName || correo));

            window.location.href = "index.html";

        } catch (error) {

            alert(traducirErrorAuth(error.code));

        }

    });

}


/* =========================================
   CERRAR SESIÓN
========================================= */

export async function cerrarSesion() {

    await signOut(auth);

    alert("Has cerrado sesión.");

    window.location.href = "index.html";

}


/* =========================================
   ESTADO DE SESIÓN EN EL MENÚ
   (se ejecuta automáticamente en cada página)
========================================= */

onAuthStateChanged(auth, function (usuario) {

    const menuUsuario = document.getElementById("menuUsuario");

    if (!menuUsuario) {
        return;
    }

    if (usuario) {

        menuUsuario.textContent = "Mi cuenta (" + (usuario.displayName || usuario.email) + ")";

        menuUsuario.href = "#";

        menuUsuario.onclick = function (event) {

            event.preventDefault();

            cerrarSesion();

        };

    } else {

        menuUsuario.textContent = "Iniciar sesión";

        menuUsuario.href = "login.html";

        menuUsuario.onclick = null;

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
