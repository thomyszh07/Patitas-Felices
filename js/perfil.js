import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const perfilNombre = document.getElementById("perfilNombre");
const perfilCorreo = document.getElementById("perfilCorreo");
const passwordForm = document.getElementById("passwordForm");

if (perfilNombre || perfilCorreo || passwordForm) {

    onAuthStateChanged(auth, function (usuario) {

        if (!usuario) {
            window.location.href = "login.html";
            return;
        }

        if (perfilNombre) {
            perfilNombre.textContent = usuario.displayName || "Usuario";
        }

        if (perfilCorreo) {
            perfilCorreo.textContent = usuario.email;
        }

    });

}

if (passwordForm) {

    passwordForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const actual = document.getElementById("passwordActual").value;
        const nueva = document.getElementById("passwordNueva").value;
        const confirmar = document.getElementById("passwordConfirmar").value;

        if (nueva !== confirmar) {
            alert("Las contraseñas nuevas no coinciden.");
            return;
        }

        if (nueva.length < 6) {
            alert("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        const usuario = auth.currentUser;

        if (!usuario) {
            window.location.href = "login.html";
            return;
        }

        try {

            const credencial = EmailAuthProvider.credential(usuario.email, actual);

            await reauthenticateWithCredential(usuario, credencial);

            await updatePassword(usuario, nueva);

            alert("Contraseña actualizada correctamente.");

            passwordForm.reset();

        } catch (error) {

            alert(traducirErrorPassword(error.code));

        }

    });

}

function traducirErrorPassword(codigo) {

    const mensajes = {
        "auth/wrong-password": "La contraseña actual es incorrecta.",
        "auth/invalid-credential": "La contraseña actual es incorrecta.",
        "auth/weak-password": "La nueva contraseña debe tener al menos 6 caracteres.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
        "auth/requires-recent-login": "Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo."
    };

    return mensajes[codigo] || "Ocurrió un error. Intenta nuevamente.";

}