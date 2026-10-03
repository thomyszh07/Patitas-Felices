import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PAYPAL_URL = "https://api-m.sandbox.paypal.com";

app.use(cors());
app.use(express.json());


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

app.listen(3000, () => {

    console.log(
        "Servidor activo en http://localhost:3000"
    );

});