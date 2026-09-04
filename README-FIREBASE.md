# PetShop + Firebase — guía de puesta en marcha

## 1. Pega tu configuración

Abre `js/firebase-config.js` y reemplaza los valores de `firebaseConfig`
con los que te dio la consola de Firebase (Configuración del proyecto > Tus apps).

## 2. Activa Authentication y Firestore

En la consola de Firebase:
- **Authentication > Sign-in method** → activa "Correo electrónico/contraseña".
- **Firestore Database** → crea la base en modo producción.

## 3. Carga los productos iniciales (stock)

Como las reglas de seguridad no permiten crear productos desde el navegador
(a propósito, para que nadie invente productos falsos), agrégalos manualmente
la primera vez desde la consola:

**Firestore Database > Iniciar colección > ID: `productos`**

Crea un documento por producto con estos campos (puedes usar los mismos
datos que ya tenías en tu array `productos` del script.js viejo, agregando
el campo `stock`):

| campo      | tipo    | ejemplo                  |
|------------|---------|---------------------------|
| nombre     | string  | Alimento para perro       |
| categoria  | string  | alimentos                 |
| precio     | number  | 45                        |
| imagen     | string  | 🦴                        |
| stock      | number  | 20                        |

Repite para tus 8 productos (alimentos, collar, ropa, etc.). El ID del
documento lo puede generar Firestore automáticamente ("ID automático").

> Si luego quieres un panel de administración para agregar/editar productos
> sin entrar a la consola, es un paso natural siguiente — dímelo y lo armamos.

## 4. Publica las reglas de seguridad

Con Firebase CLI instalado (`npm install -g firebase-tools`):

```bash
firebase login
firebase init        # elige Firestore y Hosting, usa los archivos que ya están aquí
firebase deploy --only firestore:rules
```

## 5. Publica el sitio (Hosting)

```bash
firebase deploy --only hosting
```

Al terminar te da una URL tipo `https://tu-proyecto.web.app` ya funcionando
con Auth + Firestore + Hosting.

## 6. Cómo quedó organizado el código

```
js/
  firebase-config.js   → conexión a Firebase (tus claves van aquí)
  auth.js              → registro, login, logout, estado de sesión en el menú
  productos.js         → carga el catálogo y stock desde Firestore
  carrito.js           → carrito de compra (se queda en localStorage)
  pedidos.js           → transacción de stock + creación del pedido + factura
  main.js              → une todo y arranca la página
firestore.rules        → quién puede leer/escribir cada colección
firebase.json          → configuración de Hosting
```

## Notas importantes

- Las contraseñas ya no se guardan en texto plano: las maneja Firebase Auth.
- El stock se descuenta con una **transacción** (`runTransaction`), así que
  si dos personas compran el último producto al mismo tiempo, solo una lo
  consigue — no se puede vender de más.
- El "comprobante"/factura vive como documento en la colección `pedidos`
  (con número de pedido, cliente, items y total). Si más adelante quieres
  un PDF descargable, se puede agregar con una librería como jsPDF sin
  tocar el resto de la arquitectura.
- Las reglas de Firestore son deliberadamente simples para un proyecto
  académico. En un caso real, descontar stock se haría desde una Cloud
  Function en vez de directamente desde el navegador, para blindarlo aún
  más contra manipulación.
