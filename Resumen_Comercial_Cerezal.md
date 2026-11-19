# CEREZAL DE SAN LUIS
**Sistema Avanzado de Gestión Residencial Premium**

---

## 1. Resumen Ejecutivo
**Cerezal de San Luis** es una aplicación en la nube diseñada específicamente para conjuntos residenciales de alta gama que buscan modernizar su operación, aumentar radicalmente la seguridad de sus residentes y ofrecer una experiencia de usuario (UX) ágil y premium. 

A diferencia de las soluciones tradicionales basadas en cuadernos de papel, grupos de WhatsApp o software anticuado, Cerezal de San Luis ofrece una arquitectura moderna con **protección de datos grado bancario**, flujos de trabajo en tiempo real y anonimización de contactos celulares. Es una herramienta dual, diseñada tanto para la **Administración y Operativos de Portería** como para la comodidad del **Residente**.

---

## 2. Características y Módulos Principales

La plataforma se despliega a través de cuatro módulos principales altamente optimizados:

### 📞 Directorio Seguro (Citofonía Privada en la Nube)
El avance tecnológico más destacado de la aplicación es su sistema de llamadas "tipo Uber".
*   **Anonimato Total:** Los números telefónicos personales de los dueños, arrendatarios o familiares **nunca** son expuestos a la portería.
*   **Llamadas encriptadas vía Twilio:** Cuando la portería desea comunicarse con una casa, el sistema hace un puente seguro en la nube. La plataforma llama primero a la portería y luego al residente, conectándolos sin que ninguno vea el número del otro.
*   **Autogestión de Residentes:** Cada propietario puede actualizar sus tres números de contacto principales directamente desde su perfil, sin intermediarios.

### 🛡️ Seguridad y Control de Visitantes
Reemplaza la tradicional y vulnerable bitácora de portería.
*   **Pre-Autorización:** Los residentes pueden "Anunciar Visita" desde su celular antes de que esta llegue, agilizando el ingreso.
*   **Control de Estado en Tiempo Real:** La portería marca las visitas como `Esperadas`, `Activas` (en el conjunto) o `Salida`.
*   **Registro Fotográfico y Documental:** Capacidad de capturar el nombre, cédula y unidad de destino, guardando el histórico protegido en la nube.

### 📦 Mi Correo (Gestión Inteligente de Paquetería)
Para solucionar el caos de la correspondencia moderna (compras online, domicilios, recibos).
*   **Inventario Digital:** La portería registra cada sobre o paquete vinculado a una casa.
*   **Estados de Entrega:** Control total sobre qué paquetes están "En Portería" y cuáles ya fueron "Entregados" al residente.
*   **Notificación Silenciosa:** El residente ve en tiempo real en su panel qué tiene pendiente por recoger.

### 🚗 Control de Vehículos y Parqueaderos de Visitantes
*   **Inventario Privado Automotor:** Cada residente gestiona su propio inventario de vehículos (carro, moto). Control estricto de máximo 2 vehículos por unidad.
*   **Estado de Presencia:** Permite alternar el estado del vehículo (`Dentro` o `Fuera`) del conjunto.
*   **Asignación de Parqueadero de Visitantes:** Un sistema visual para la portería donde se controla en tiempo real qué bahías de visitantes están ocupadas y cuáles libres.

---

## 3. Experiencia de Usuario y Roles

La plataforma cuenta con un diseño *Dark Mode Premium*, con estética moderna (glassmorphism, animaciones sutiles y contraste de acentos naranjas/dorados) que transmite confianza y exclusividad.

*   **Perfil Residente:** Acceso granulado (aislado) únicamente a la información de su propia unidad. Panel minimalista enfocado en sus paquetes, sus visitas y la gestión de su núcleo familiar.
*   **Perfil Operativo / Admin:** Visión omnisciente de todo el condominio. Acceso a búsquedas rápidas, edición masiva, control de bahías y herramientas de auditoría (logs) de seguridad.

---

## 4. Arquitectura Tecnológica y Seguridad

*   **Infraestructura en la Nube:** Operada sobre **Google Firebase** (Firestore, Cloud Functions v2, y Auth). Alta disponibilidad y escalabilidad sin servidores locales.
*   **Seguridad:** Autenticación estricta con protección por IAM Roles. Reglas de Firestore configuradas para bloquear lecturas de agentes externos e impedir que un residente acceda a información de sus vecinos.
*   **Integración VoIP:** Uso del **SDK de Telefonia de Twilio** bajo un entorno de funciones sin servidor (Serverless HTTP endpoints) validando y redirigiendo llamadas en fracciones de segundo utilizando Node.js.
*   **Frontend Modular:** Desarrollado con **React y Vite**, con despliegue instantáneo web y diseño 100% responsivo para usarse desde celulares, tablets de portería o computadores de escritorio.

---

## 5. Propuesta de Valor para Inversionistas y Condominios

Cerezal de San Luis ataca directamente problemáticas sensibles e inmediatas en la propiedad horizontal latinoamericana:
1.  **Protección a la Intimidad Legal (Habeas Data):** Al ocultar los celulares personales de las bases de portería, se evita la extorsión, robo de datos o filtraciones, previniendo demandas.
2.  **Optimización del Tiempo:** Menos llamadas por el citófono anticuado; la información está en la aplicación de cada residente.
3.  **Valorización Comercial:** Tener un sistema premium y propio añade valor a la percepción tecnológica del condominio frente a compradores.
