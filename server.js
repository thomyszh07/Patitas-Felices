import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PAYPAL_URL = "https://api-m.sandbox.paypal.com";
const RENDER_URL = "https://patitas-felices-1jlr.onrender.com";

app.use(cors());
app.use(express.json());

/* =========================
   SWAGGER
========================= */

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Patitas Felices API",
            version: "1.0.0",
            description: "API REST para gestionar pagos con PayPal"
        },
        servers: [
            {
                url: RENDER_URL,
                description: "Servidor Render"
            },
            {
                url: "http://localhost:3000",
                description: "Servidor local"
            }
        ]
    },
    apis: ["./server.js"]
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

/* =========================
   PAYPAL
========================= */

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

/* =========================
   RUTA PRINCIPAL
========================= */

app.get("/", (req, res) => {
    res.send("Servidor PayPal de Patitas Felices funcionando");
});

/* =========================
   PROBAR PAYPAL
========================= */

/**
 * @swagger
 * /api/paypal/test:
 *   get:
 *     summary: Probar conexión con PayPal
 *     tags: [PayPal]
 *     responses:
 *       200:
 *         description: Conexión correcta
 *       500:
 *         description: Error de conexión
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

/* =========================
   CREAR ORDEN
========================= */

/**
 * @swagger
 * /api/paypal/orden:
 *   post:
 *     summary: Crear una orden de PayPal
 *     tags: [PayPal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [total]
 *             properties:
 *               total:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Orden creada
 *       400:
 *         description: Total inválido
 *       500:
 *         description: Error de PayPal
 */
app.post("/api/paypal/orden", async (req, res) => {
    try {
        const totalPEN = Number(req.body.total);

        if (!totalPEN || totalPEN <= 0) {
            return res.status(400).json({
                error: "Total del carrito inválido"
            });
        }

        const tipoCambio = Number(
            process.env.PEN_POR_USD || 3.75
        );

        const totalUSD = (totalPEN / tipoCambio).toFixed(2);
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

/* =========================
   CAPTURAR PAGO
========================= */

/**
 * @swagger
 * /api/paypal/orden/{id}/capturar:
 *   post:
 *     summary: Capturar una orden de PayPal
 *     tags: [PayPal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pago capturado
 *       400:
 *         description: ID inválido
 *       500:
 *         description: Error de PayPal
 */
app.post("/api/paypal/orden/:id/capturar", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: "ID de orden inválido"
            });
        }

        const token = await obtenerToken();

        const respuesta = await fetch(
            `${PAYPAL_URL}/v2/checkout/orders/${id}/capture`,
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
                datos.message || "No se pudo capturar el pago"
            );
        }

        res.json(datos);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   INICIAR SERVIDOR
========================= */

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
    console.log(`Swagger disponible en /api-docs`);
});