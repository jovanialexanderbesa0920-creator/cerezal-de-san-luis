# Cerezal de San Luis

Plataforma web para la gestión de conjuntos residenciales: centraliza la comunicación entre la portería y los residentes.

Parte del ecosistema de productos de **Atreum Tech**.

## Qué hace
- Registro de **visitantes**, **correspondencia** y **parqueaderos de visitantes** en tiempo real.
- **Directorio seguro con llamadas puente** (Twilio): la portería llama al residente sin ver su número personal.
- Roles de administrador (portería) y residente, con autenticación mediante Firebase Auth.
- Interfaz en modo oscuro con glassmorphism.

## Stack
React 18, Vite, Tailwind CSS, Firebase (Firestore, Auth, Cloud Functions en Node.js) y Twilio.

## Cómo correrlo
```bash
cd ResidencialApp
npm install
cp .env.example .env   # variables de tu proyecto Firebase
npm run dev
```
Las funciones de `functions/` necesitan las variables de `functions/.env.example` (Twilio).

## Documentación
- `INFORME_TECNICO_CEREZAL.txt`: arquitectura y estructura de datos.
- `Resumen_Comercial_Cerezal.md`: resumen del producto.
