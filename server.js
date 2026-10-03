import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const app = express();
const PAYPAL_URL = "https://api-m.sandbox.paypal.com";

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Patitas Felices API",
            version: "1.0.0",
            description: "API REST para gestionar los pagos con PayPal de Patitas Felices"
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor local"
            }
        ]
    },
    apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

/* ===== OBTENER TOKEN DE PAYPAL ===== */

async function obtenerToken() {

    const credenciales = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const respuesta = await fetch(
        `${PAYPAL_URL}/v1/oauth2/token`,
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${credenciales}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error_description || "Error al conectar con PayPal"
        );
    }

    return datos.access_token;
}


/* ===== SERVIDOR FUNCIONANDO ===== */

app.get("/", (req, res) => {

    res.send("Servidor PayPal funcionando");

});


/* ===== PROBAR CONEXIÓN PAYPAL ===== */

/**
 * @swagger
 * /api/paypal/test:
 *   get:
 *     summary: Probar conexión con PayPal
 *     description: Comprueba que las credenciales del servidor permiten conectarse con PayPal Sandbox.
 *     tags:
 *       - PayPal
 *     responses:
 *       200:
 *         description: Conexión con PayPal correcta
 *       500:
 *         description: Error al conectar con PayPal
 */

app.get("/api/paypal/test", async (req, res) => {

    try {

        await obtenerToken();

        res.json({
            ok: true,
            mensaje: "Conexión con PayPal correcta"
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            error: error.message
        });

    }

});


/* ===== CREAR ORDEN PAYPAL ===== */

/**
 * @swagger
 * /api/paypal/orden:
 *   post:
 *     summary: Crear una orden de PayPal
 *     description: Crea una orden de pago en PayPal Sandbox.
 *     tags:
 *       - PayPal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - total
 *             properties:
 *               total:
 *                 type: number
 *                 example: 50.00
 *     responses:
 *       200:
 *         description: Orden creada correctamente
 *       400:
 *         description: Total inválido
 *       500:
 *         description: Error al crear la orden en PayPal
 */

app.post("/api/paypal/orden", async (req, res) => {

    try {

        const totalPEN = Number(req.body.total);

        if (!totalPEN || totalPEN <= 0) {
            throw new Error("Total del carrito inválido");
        }

        const tipoCambio = Number(
            process.env.PEN_POR_USD || 3.75
        );

        const totalUSD = (
            totalPEN / tipoCambio
        ).toFixed(2);


        const token = await obtenerToken();


        const respuesta = await fetch(
            `${PAYPAL_URL}/v2/checkout/orders`,
            {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    intent: "CAPTURE",

                    purchase_units: [
                        {
                            description: "Compra en Patitas Felices",

                            amount: {
                                currency_code: "USD",
                                value: totalUSD
                            }
                        }
                    ]

                })
            }
        );


        const datos = await respuesta.json();


        if (!respuesta.ok) {
            throw new Error(
                datos.message || "No se pudo crear la orden"
            );
        }


        res.json({
            ...datos,
            totalPEN,
            totalUSD
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


/* ===== CAPTURAR PAGO PAYPAL ===== */

/**
 * @swagger
 * /api/paypal/orden/{id}/capturar:
 *   post:
 *     summary: Capturar un pago de PayPal
 *     description: Captura una orden de PayPal después de que el usuario haya aprobado el pago.
 *     tags:
 *       - PayPal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden creada por PayPal
 *     responses:
 *       200:
 *         description: Pago capturado correctamente
 *       400:
 *         description: ID de orden inválido
 *       500:
 *         description: Error al capturar el pago
 */

app.post(
    "/api/paypal/orden/:id/capturar",
    async (req, res) => {

        try {

            const token = await obtenerToken();


            const respuesta = await fetch(
                `${PAYPAL_URL}/v2/checkout/orders/${req.params.id}/capture`,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


            const datos = await respuesta.json();


            if (!respuesta.ok) {
                throw new Error(
                    datos.message ||
                    "No se pudo capturar el pago"
                );
            }


            res.json(datos);


        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);


/* ===== INICIAR SERVIDOR ===== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Servidor activo en el puerto ${PORT}`
    );

});