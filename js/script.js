/* =========================================
   PRODUCTOS
========================================= */

const productos = [

    {
        id: 1,
        nombre: "Alimento para perro",
        categoria: "alimentos",
        precio: 45,
        imagen: "🦴"
    },

    {
        id: 2,
        nombre: "Collar para perro",
        categoria: "accesorios",
        precio: 25,
        imagen: "🐕"
    },

    {
        id: 3,
        nombre: "Ropa para mascota",
        categoria: "ropa",
        precio: 35,
        imagen: "👕"
    },

    {
        id: 4,
        nombre: "Alimento para gato",
        categoria: "alimentos",
        precio: 40,
        imagen: "🐱"
    },

    {
        id: 5,
        nombre: "Correa para perro",
        categoria: "accesorios",
        precio: 30,
        imagen: "🦮"
    },

    {
        id: 6,
        nombre: "Cama para mascota",
        categoria: "accesorios",
        precio: 65,
        imagen: "🛏️"
    },

    {
        id: 7,
        nombre: "Shampoo para mascota",
        categoria: "cuidado",
        precio: 28,
        imagen: "🧴"
    },

    {
        id: 8,
        nombre: "Vitaminas para mascota",
        categoria: "cuidado",
        precio: 35,
        imagen: "💊"
    }

];


/* =========================================
   CARRITO
========================================= */

let carrito =
    JSON.parse(localStorage.getItem("carrito")) || [];


/* =========================================
   MOSTRAR PRODUCTOS
========================================= */

function mostrarProductos(categoria = "todos") {

    const contenedor =
        document.getElementById("listaProductos");

    if (!contenedor) {
        return;
    }


    contenedor.innerHTML = "";


    let productosMostrar = productos;


    if (categoria !== "todos") {

        productosMostrar =
            productos.filter(
                producto =>
                    producto.categoria === categoria
            );

    }


    productosMostrar.forEach(producto => {

        const tarjeta =
            document.createElement("div");

        tarjeta.classList.add("producto");


        tarjeta.innerHTML = `

            <div class="producto-imagen">

                ${producto.imagen}

            </div>


            <h3>
                ${producto.nombre}
            </h3>


            <p class="precio">
                S/ ${producto.precio.toFixed(2)}
            </p>


            <button
                class="boton"
                onclick="agregarAlCarrito(${producto.id})">

                Agregar al carrito

            </button>

        `;


        contenedor.appendChild(tarjeta);

    });

}


/* =========================================
   AGREGAR AL CARRITO
========================================= */

function agregarAlCarrito(id) {

    const producto =
        productos.find(
            producto => producto.id === id
        );


    if (!producto) {
        return;
    }


    const productoExistente =
        carrito.find(
            item => item.id === id
        );


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


    alert(
        producto.nombre +
        " fue agregado al carrito."
    );

}


/* =========================================
   GUARDAR CARRITO
========================================= */

function guardarCarrito() {

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );

    actualizarContador();

}


/* =========================================
   CONTADOR DEL CARRITO
========================================= */

function actualizarContador() {

    const contador =
        document.getElementById("contadorCarrito");


    if (!contador) {
        return;
    }


    let cantidad = 0;


    carrito.forEach(item => {

        cantidad += item.cantidad;

    });


    contador.textContent = cantidad;

}


/* =========================================
   MOSTRAR CARRITO
========================================= */

function mostrarCarrito() {

    const contenedor =
        document.getElementById("productosCarrito");


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML = "";


    if (carrito.length === 0) {

        contenedor.innerHTML = `

            <div class="item-carrito">

                <p>
                    Tu carrito está vacío 🛒
                </p>

            </div>

        `;

        actualizarTotales();

        return;
    }


    carrito.forEach(item => {

        const elemento =
            document.createElement("div");


        elemento.classList.add(
            "item-carrito"
        );


        elemento.innerHTML = `

            <div class="item-info">

                <h3>
                    ${item.imagen}
                    ${item.nombre}
                </h3>

                <p class="item-precio">
                    S/ ${item.precio.toFixed(2)}
                </p>

            </div>


            <div class="cantidad">

                <button
                    onclick="cambiarCantidad(
                        ${item.id},
                        -1
                    )">

                    -

                </button>


                <span>
                    ${item.cantidad}
                </span>


                <button
                    onclick="cambiarCantidad(
                        ${item.id},
                        1
                    )">

                    +

                </button>

            </div>


            <button
                class="eliminar"
                onclick="eliminarProducto(
                    ${item.id}
                )">

                Eliminar

            </button>

        `;


        contenedor.appendChild(elemento);

    });


    actualizarTotales();

}


/* =========================================
   CAMBIAR CANTIDAD
========================================= */

function cambiarCantidad(id, cambio) {

    const item =
        carrito.find(
            producto => producto.id === id
        );


    if (!item) {
        return;
    }


    item.cantidad += cambio;


    if (item.cantidad <= 0) {

        carrito =
            carrito.filter(
                producto => producto.id !== id
            );

    }


    guardarCarrito();

    mostrarCarrito();

}


/* =========================================
   ELIMINAR PRODUCTO
========================================= */

function eliminarProducto(id) {

    carrito =
        carrito.filter(
            producto => producto.id !== id
        );


    guardarCarrito();

    mostrarCarrito();

}


/* =========================================
   TOTALES
========================================= */

function actualizarTotales() {

    const subtotalElemento =
        document.getElementById("subtotal");

    const totalElemento =
        document.getElementById("total");


    if (!subtotalElemento || !totalElemento) {
        return;
    }


    let subtotal = 0;


    carrito.forEach(item => {

        subtotal +=
            item.precio * item.cantidad;

    });


    let envio = 5;


    if (carrito.length === 0) {
        envio = 0;
    }


    const total =
        subtotal + envio;


    subtotalElemento.textContent =
        "S/ " + subtotal.toFixed(2);


    totalElemento.textContent =
        "S/ " + total.toFixed(2);

}


/* =========================================
   REGISTRO
========================================= */

const registroForm =
    document.getElementById("registroForm");


if (registroForm) {

    registroForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const nombre =
                document.getElementById(
                    "nombre"
                ).value;


            const correo =
                document.getElementById(
                    "correo"
                ).value;


            const password =
                document.getElementById(
                    "password"
                ).value;


            const telefono =
                document.getElementById(
                    "telefono"
                ).value;


            let usuarios =
                JSON.parse(
                    localStorage.getItem(
                        "usuarios"
                    )
                ) || [];


            const usuarioExistente =
                usuarios.find(
                    usuario =>
                        usuario.correo === correo
                );


            if (usuarioExistente) {

                alert(
                    "Este correo ya está registrado."
                );

                return;

            }


            const nuevoUsuario = {

                nombre: nombre,

                correo: correo,

                password: password,

                telefono: telefono

            };


            usuarios.push(nuevoUsuario);


            localStorage.setItem(
                "usuarios",
                JSON.stringify(usuarios)
            );


            alert(
                "Registro exitoso. Ahora puedes iniciar sesión."
            );


            window.location.href =
                "login.html";

        }
    );

}


/* =========================================
   LOGIN
========================================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const correo =
                document.getElementById(
                    "loginCorreo"
                ).value;


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            const usuarios =
                JSON.parse(
                    localStorage.getItem(
                        "usuarios"
                    )
                ) || [];


            const usuario =
                usuarios.find(
                    usuario =>
                        usuario.correo === correo &&
                        usuario.password === password
                );


            if (!usuario) {

                alert(
                    "Correo o contraseña incorrectos."
                );

                return;

            }


            localStorage.setItem(
                "sesion",
                JSON.stringify(usuario)
            );


            alert(
                "Bienvenido/a " +
                usuario.nombre
            );


            window.location.href =
                "index.html";

        }
    );

}


/* =========================================
   USUARIO EN EL MENÚ
========================================= */

function actualizarUsuario() {

    const menuUsuario =
        document.getElementById(
            "menuUsuario"
        );


    if (!menuUsuario) {
        return;
    }


    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );


    if (sesion) {

        menuUsuario.textContent =
            "Mi cuenta";


        menuUsuario.href =
            "#";


        menuUsuario.onclick =
            function(event) {

                event.preventDefault();

                cerrarSesion();

            };

    } else {

        menuUsuario.textContent =
            "Iniciar sesión";


        menuUsuario.href =
            "login.html";

    }

}


/* =========================================
   CERRAR SESIÓN
========================================= */

function cerrarSesion() {

    localStorage.removeItem(
        "sesion"
    );


    alert(
        "Has cerrado sesión."
    );


    window.location.href =
        "index.html";

}


/* =========================================
   REALIZAR PEDIDO
========================================= */

function realizarPedido() {

    if (carrito.length === 0) {

        alert(
            "Tu carrito está vacío."
        );

        return;

    }


    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );


    if (!sesion) {

        alert(
            "Debes iniciar sesión para realizar un pedido."
        );


        window.location.href =
            "login.html";


        return;

    }


    const pedido = {

        usuario: sesion.nombre,

        correo: sesion.correo,

        productos: carrito,

        fecha:
            new Date().toLocaleString(),

        total:
            carrito.reduce(
                (total, item) =>
                    total +
                    item.precio *
                    item.cantidad,
                5
            )

    };


    localStorage.setItem(
        "ultimoPedido",
        JSON.stringify(pedido)
    );


    localStorage.removeItem(
        "carrito"
    );


    carrito = [];


    window.location.href =
        "pedido.html";

}


/* =========================================
   MOSTRAR DATOS DEL PEDIDO
========================================= */

function mostrarPedido() {

    const contenedor =
        document.getElementById(
            "datosPedido"
        );


    if (!contenedor) {
        return;
    }


    const pedido =
        JSON.parse(
            localStorage.getItem(
                "ultimoPedido"
            )
        );


    if (!pedido) {
        return;
    }


    contenedor.innerHTML = `

        <p>
            <strong>Cliente:</strong>
            ${pedido.usuario}
        </p>

        <p>
            <strong>Correo:</strong>
            ${pedido.correo}
        </p>

        <p>
            <strong>Fecha:</strong>
            ${pedido.fecha}
        </p>

        <p>
            <strong>Total:</strong>
            S/ ${pedido.total.toFixed(2)}
        </p>

    `;

}


/* =========================================
   EJECUTAR AL CARGAR LA PÁGINA
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        mostrarProductos();

        mostrarCarrito();

        actualizarContador();

        actualizarUsuario();

        mostrarPedido();

    }
);

/* =========================================
   DATOS DE ENTREGA
========================================= */

const entregaForm = document.getElementById("entregaForm");

if (entregaForm) {

    entregaForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const nombre =
            document.getElementById("nombreEntrega").value;

        const telefono =
            document.getElementById("telefonoEntrega").value;

        const direccion =
            document.getElementById("direccionEntrega").value;

        const distrito =
            document.getElementById("distritoEntrega").value;

        const referencia =
            document.getElementById("referenciaEntrega").value;

        const metodoEntrega =
            document.querySelector(
                'input[name="metodoEntrega"]:checked'
            ).value;

        const metodoPago =
            document.querySelector(
                'input[name="metodoPago"]:checked'
            ).value;


        const datosEntrega = {

            nombre: nombre,

            telefono: telefono,

            direccion: direccion,

            distrito: distrito,

            referencia: referencia,

            metodoEntrega: metodoEntrega,

            metodoPago: metodoPago

        };


        localStorage.setItem(
            "datosEntrega",
            JSON.stringify(datosEntrega)
        );


        window.location.href = "pedido.html";

    });

}