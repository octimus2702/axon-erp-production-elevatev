# Axon ERP Enterprise - Sistema de Gestión Contable, Operativa y Ascensores

**Axon ERP** es una plataforma web integral y Progressive Web App (PWA) de alto rendimiento desarrollada para empresas del sector industrial, contable y de obras, con especialización en empresas de instalación, mantenimiento, modernización y reparación de ascensores, montacargas y sistemas de elevación.

---

## 🏢 Soporte Multi-Empresa Nativo
El sistema admite gestión unificada y cambio rápido entre identidades comerciales:
- **Tecno Elevatev C.A.**: Especialistas en ascensores, obras y servicios de elevación.
- **Soluciones Integrales DAKACO C.A.**: Soluciones integrales de ingeniería y suministros.

---

## 🛠️ Servicios Integrados & Plantillas Rápidas
Incluye presupuestación y facturación pre-configurada para los servicios más comunes del sector:
1. **Mantenimiento Preventivo Mensual** (atención de emergencias y guardias 24/7).
2. **Mantenimiento Correctivo y Diagnóstico** (atención técnica urgente, destraba de cabinas).
3. **Ajustes Técnicos, Nivelación y Calibración** (frenos, pesacargas y holguras).
4. **Reparación y Reemplazo de Componentes** (operadores, contactores, cortinas infrarrojas).
5. **Modernización Integral a Tecnología VVVF** (cuadros CanBus, Yaskawa L1000A, botoneras COP).
6. **Nuevas Instalaciones** (suministro, obra civil/mecánica/eléctrica de ascensores).
7. **Transporte, Flete y Logística** (traslado especializado de máquinas de tracción).

---

## 🚀 Módulos Principales del Sistema

1. **Contabilidad, Nómina & SENIAT**:
   - Libro Diario y Libro Mayor T en tiempo real.
   - Gestión de Nómina de Empleados, CESTATICKET, recibos y quincenas.
   - Retenciones de IVA (75% / 100%) y retenciones de ISLR.
2. **Facturación Fiscal y Cuentas por Cobrar/Pagar**:
   - Carga automatizada con plantillas de servicios.
   - Multimoneda nativa (USD $ y Bolívares Bs. S.) con actualización en vivo de tasa BCV.
3. **Presupuestos y Cotizaciones Profesionales**:
   - Conversión a factura en 1-clic.
   - Exportación limpia e impresión lista para clientes en PDF.
4. **Recibos de Pago y Notas de Entrega**:
   - Registro de abonos, firma digital interactiva en pantalla.
5. **Clientes y Expedientes Técnicos de Ascensores**:
   - Ficha técnica detallada por equipo (marca, paradas, tipo de máquina, historial de fallas).
6. **Reportes Técnicos e Inspecciones**:
   - Diagnósticos de obra, fotos y requerimientos de materiales.
7. **Inventario de Repuestos & Kárdex**:
   - Control de stock de piezas críticas (variadores, tarjetas, cables de tracción, patines).
8. **Seguridad PWA, Biometría & PIN Local**:
   - Autenticación WebAuthn (Touch ID / Face ID / Huella dactilar).
   - Bloqueo por PIN de seguridad configurable (4-6 dígitos).
   - Funcionamiento autónomo offline con sincronización en cola.

---

## ⚡ Instalación y Ejecución Local en Windows (Acceso Rápido)

Para instalar y ejecutar el proyecto en un servidor local o PC con Windows sin usar la consola de comandos, se incluyen scripts de automatización:

1. **Instalación Automática:**
   - Haz doble clic sobre el archivo **`Instalar_Axon_ERP.bat`**.
   - El script verificará Node.js, instalará todas las dependencias (`npm install`) y compilará la PWA (`npm run build`). También ofrecerá crear un acceso directo en tu Escritorio.

2. **Iniciar el Servidor:**
   - Haz doble clic sobre el archivo **`Iniciar_Sistema.bat`**.
   - Se abrirá automáticamente el navegador en `http://localhost:3000` con la aplicación lista para usarse.

---

## 💻 Instalación Manual mediante Consola (Linux / macOS / Windows)

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd TU_REPOSITORIO
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abrir en el navegador: `http://localhost:3000`

4. **Compilar para producción:**
   ```bash
   npm run build
   npm run preview
   ```

---

## 📤 Pasos para Subir el Proyecto a GitHub

### Método 1: Exportación Directa desde AI Studio (El más fácil)
1. En la esquina superior derecha del panel de **AI Studio**, haz clic en el menú **Settings** (o el icono de exportar).
2. Selecciona **Export to GitHub** (o **Export ZIP**).
3. Conecta tu cuenta de GitHub y elige si deseas crear un repositorio Público o Privado.
4. ¡Listo! El código completo con todos los cambios se subirá automáticamente a tu cuenta.

### Método 2: Subir mediante Git por Consola
1. Descarga el archivo comprimido (.ZIP) desde el panel de AI Studio.
2. Descomprime la carpeta en tu computadora y abre una terminal (Git Bash, CMD o PowerShell) en esa ubicación.
3. Ejecuta los siguientes comandos:
   ```bash
   git init
   git add .
   git commit -m "Axon ERP Enterprise - Versión Oficial con PWA y Automatizadores"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/NOMBRE_DEL_REPOSITORIO.git
   git push -u origin main
   ```

---

## 🌐 Despliegue en Línea en Render (Paso a Paso)

Axon ERP incluye configuración lista para **Render.com** en el archivo `render.yaml`. Puedes desplegarlo gratis siguiendo estos pasos:

### Paso 1: Subir el proyecto a GitHub
Sigue los pasos indicados arriba para tener tu proyecto subido a tu repositorio de **GitHub**.

### Paso 2: Crear el servicio en Render
1. Ingresa a [https://dashboard.render.com/](https://dashboard.render.com/) e inicia sesión (puedes entrar directamente con tu cuenta de GitHub).
2. Haz clic en el botón **New +** (arriba a la derecha) y selecciona **Static Site** (Sitio Estático).
3. Conecta tu cuenta de GitHub y selecciona el repositorio de **Axon ERP**.

### Paso 3: Configurar los parámetros del despliegue
Llena los campos con esta información exactas:
- **Name**: `axon-erp` (o el nombre que prefieras).
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Paso 4: Configurar redirección para Single Page Application (PWA)
Para asegurarte de que las rutas y la PWA funcionen al recargar la página:
1. En el menú lateral del proyecto en Render, ve a **Redirects/Rewrites**.
2. Añade la siguiente regla:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

3. Haz clic en **Create Static Site**.
4. ¡Listo! En 1-2 minutos Render te dará un enlace público seguro (ejemplo: `https://axon-erp.onrender.com`) para acceder al sistema desde cualquier dispositivo en el mundo.

---

## 📄 Licencia y Créditos
Desarrollado para **Tecno Elevatev C.A.** y **Soluciones Integrales DAKACO C.A.** Todos los derechos reservados.

