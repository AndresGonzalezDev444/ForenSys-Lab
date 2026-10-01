# 🔬 ForenSys Lab

<p align="center">
  <img src="Forensys-lab.png" alt="ForenSys Lab" width="420">
</p>

<p align="center">
  <strong>Digital Forensics · OSINT · Cyber Intelligence · Biometric Analysis</strong>
</p>

<p align="center">
  <a href="https://github.com/AndresGonzalezDev444/ForenSys-Lab">
    <img src="https://img.shields.io/badge/GitHub-ForenSys--Lab-181717?style=for-the-badge&logo=github">
  </a>
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white">
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white">
  <img src="https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?style=for-the-badge">
</p>

---

## 🧠 ¿Qué es ForenSys Lab?

**ForenSys Lab** es una plataforma web de laboratorio forense orientada al estudio de **informática forense, OSINT, ciberinteligencia, análisis de evidencia digital y registro biométrico**.

El proyecto combina un backend desarrollado con **FastAPI**, persistencia mediante **SQLite + SQLAlchemy**, autenticación, gestión de sujetos y fotografías, análisis de metadatos y varios módulos de inteligencia abierta.

La interfaz principal está construida como una aplicación web integrada en `static/index.html` y presenta los diferentes módulos de la suite ForenSys.

> ⚠️ **Uso responsable:** el proyecto está pensado para fines educativos, académicos, de laboratorio, investigación y análisis autorizado. Las funciones de OSINT deben utilizarse respetando la legislación aplicable, la privacidad y los términos de servicio de las fuentes consultadas.

---

# 🕵️ ¿Qué incluye?

La versión actual del repositorio integra varias áreas dentro de una misma plataforma:

```text
                         🔬 FORENSYS LAB
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
   🧬 Biométrica            🛡️ Cyber                 🌐 OSINT
        │                       │                       │
   AFIS / Huellas          MetaInspect            Username Intel
   Registro facial         Metadatos              Email Intel
   Fotografías             Hashes                 Phone Intel
   Cámara                   EXIF/GPS               CC Intel
                                                  Name Intel
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                     📁 Gestión de Evidencias
                                │
                                ▼
                     🗃️ Casos + Archivos
```

---

# ✨ Módulos principales

## 🧬 1. AFIS — Cotejo de Huella Dactilar

La interfaz incluye un módulo de **cotejo de huella dactilar (AFIS)** con dos fuentes de comparación:

- 🔎 Huella de consulta.
- 🗃️ Huella almacenada en base de datos.

La interfaz contempla indicadores como:

- Porcentaje/valor de coincidencia.
- Nivel de confianza.
- Minucias coincidentes.
- Minucias descartadas.
- Rotación.
- Traslación.
- Escala.
- Calidad de la huella de consulta.
- Calidad de la coincidencia.
- Tiempo de procesamiento.

También existe una opción de **cotejar una nueva huella** desde la interfaz.

> El módulo está presentado como componente biométrico del laboratorio; la interfaz actualmente expone métricas y flujo de cotejo, por lo que no debe interpretarse automáticamente como un sistema AFIS oficial de uso operativo.

---

## 👤 2. Registro de sujetos

ForenSys permite registrar sujetos con información estructurada como:

```text
Nombre
Apellido
Cédula / Identificador
Perfil conductual / antecedentes
Fotografía facial
Huella dactilar
```

El modelo de datos contempla además una relación de fotografías faciales asociadas a cada sujeto.

Las fotografías pueden:

- 📤 Subirse como archivo.
- 📷 Enviarse como imagen codificada en Base64.
- 🏷️ Guardarse indicando el ángulo de captura.
- 🗑️ Eliminarse.
- 🔄 Asociarse nuevamente al sujeto.

El backend guarda las fotografías en `static/faces/` y registra la referencia en la base de datos. 

---

# 📸 3. Captura facial

El frontend incluye una sección llamada:

**Cámara de Fichaje (Foto Facial)**

y permite realizar una captura desde cámara desde la interfaz web.

También existe un flujo específico para recibir una fotografía desde Base64, etiquetándola como captura de webcam cuando corresponde. 

---

# 🛡️ 4. ForenSys Cyber & MetaInspect

Este módulo está orientado al **análisis de evidencia digital y metadatos**.

El endpoint de MetaInspect recibe un archivo y obtiene información como:

### 📄 Información básica

- Nombre del archivo.
- Tamaño.
- Tipo MIME.
- MD5.
- SHA-256.

### 📷 Datos del dispositivo / imagen

Cuando están disponibles:

- Fabricante.
- Modelo.
- Software.
- Resolución.
- Resolución horizontal/vertical.

### 📸 Parámetros de captura

Puede extraer:

- Apertura (`FNumber`).
- Tiempo de exposición.
- ISO.
- Distancia focal.
- Flash.
- Fecha/hora original de captura.

### 📍 GPS

Cuando la imagen contiene coordenadas EXIF, ForenSys intenta extraer:

- Latitud decimal.
- Longitud decimal.
- Coordenadas en formato DMS.
- Altitud.
- Fecha/hora GPS.
- Dirección de captura.
- GPS DOP.
- Enlace de Google Maps.

La extracción se realiza con `exifread`, mientras que los hashes MD5/SHA-256 se calculan sobre el contenido del archivo recibido. 

---

# 🌐 5. ForenSys OSINT & NetTracker

La plataforma integra varios módulos de **OSINT (Open Source Intelligence)**.

## 👤 Username Intelligence

Utiliza **Sherlock Project** para buscar la presencia de un nombre de usuario en distintas plataformas.

El backend verifica la disponibilidad de Sherlock en el entorno virtual y, si es necesario, puede instalar el proyecto local incluido en:

```text
tools/sherlock
```

Los resultados se registran y se genera un reporte JSON. 

---

## 📧 Email Intelligence

Permite analizar una dirección de correo electrónico y generar hallazgos relacionados con servicios donde exista una posible presencia de esa cuenta.

El módulo utiliza:

- `user-scanner` como motor principal.
- `holehe` como fallback.

Los resultados se almacenan en archivos JSON dentro de `reports/`. 

---

## 📱 Phone Intelligence

El módulo de teléfono utiliza `phonenumbers` para analizar el número y obtener información estructurada como:

- Formato E.164.
- Formato internacional.
- Formato nacional.
- Validez.
- Posibilidad del número.
- Tipo de línea.
- Información de operador/ubicación cuando está disponible.

También genera enlaces y consultas OSINT complementarias, incluyendo búsquedas web y referencias a servicios externos. 
---

## 🪪 CC Intelligence — Colombia

Este módulo está orientado a números de identificación colombianos.

El sistema:

- Valida el formato introducido.
- Consulta información pública mediante **Datos Abiertos Colombia / SODA API**.
- Procesa resultados asociados al conjunto consultado.
- Genera enlaces de portales oficiales.
- Construye búsquedas avanzadas mediante Google Dorks.
- Genera un reporte JSON.

Entre las fuentes/enlaces contemplados por la interfaz y el backend se encuentran portales institucionales como Procuraduría, Policía, Contraloría, Rama Judicial, ADRES, SIMIT, RUES, SISBEN y Libreta Militar. 

---

## 🧑 Name Intelligence

El sistema también cuenta con un módulo para investigar un **nombre completo**.

La lógica combina:

- Datos Abiertos Colombia.
- Consultas SODA.
- Google Dorks.
- Búsquedas relacionadas con redes sociales.

Los resultados se registran en un reporte JSON.

---

# 📁 6. Gestión de casos y evidencias

La plataforma incluye una sección específica de:

> **Gestión de Evidencias**

con soporte para:

- 📂 Crear casos.
- 🧾 Identificar el caso mediante hash.
- 📝 Añadir descripción.
- 👤 Registrar quién crea el caso.
- 📤 Adjuntar archivos.
- 🗒️ Agregar notas.
- 🔐 Registrar hashes de evidencia.
- 🌐 Registrar IP de subida.
- 🕒 Registrar fecha/hora de carga.

La interfaz contempla una vista de **Casos Activos** y un panel de detalle para cada caso.

El modelo de base de datos define las entidades `Case` y `Evidence`, incluyendo MD5, SHA-256, tipo de archivo, tamaño, usuario que sube la evidencia, IP, timestamp y notas. 

---

# 🔐 Autenticación y usuarios

ForenSys utiliza autenticación basada en **OAuth2 Password Bearer**.

El backend incorpora:

- Login mediante `/api/login`.
- Tokens Bearer.
- Usuarios con roles.
- Hash de contraseñas con `bcrypt`.
- Endpoint para consultar el usuario autenticado.

El modelo `User` contiene:

```text
id
username
hashed_password
role
```

y el rol predeterminado del modelo es `investigator`. 

> 🔒 El código actual crea un usuario administrativo de desarrollo al iniciar por primera vez. Antes de cualquier despliegue real, conviene reemplazar esa configuración por credenciales seguras y gestionadas externamente.

---

# 🗃️ Base de datos

La aplicación utiliza:

**SQLite + SQLAlchemy**

La base de datos configurada actualmente es:

```text
ciberforense.db
```

La conexión se define mediante:

```text
sqlite:///./ciberforense.db
```

y SQLAlchemy se utiliza para crear y gestionar las entidades del sistema. 

---

# 🧱 Arquitectura

```text
                         🌐 Navegador
                              │
                              ▼
                     ┌─────────────────┐
                     │ static/index    │
                     │ HTML + CSS + JS │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │     FastAPI     │
                     │      API       │
                     └────────┬────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        🔐 Auth          🧬 Forensics        🌐 OSINT
             │                │                │
             ▼                ▼                ▼
         bcrypt          EXIF / Hash       Sherlock
         OAuth2          Evidence          Holehe
                            │              phonenumbers
                            │              SODA API
                            ▼
                     ┌───────────────┐
                     │   SQLAlchemy  │
                     └───────┬───────┘
                             ▼
                         🗃️ SQLite
```

---

# 🛠️ Tecnologías

| Tecnología | Función |
|---|---|
| 🐍 Python | Lenguaje principal |
| ⚡ FastAPI | Backend / API REST |
| 🚀 Uvicorn | Servidor ASGI |
| 🗃️ SQLite | Base de datos local |
| 🧩 SQLAlchemy | ORM |
| 📐 Pydantic | Esquemas y validación |
| 🔐 bcrypt | Hash de contraseñas |
| 📷 exifread | Lectura de metadatos EXIF |
| 🖼️ Pillow | Procesamiento de imágenes |
| 🔢 NumPy | Operaciones numéricas |
| 🌐 requests | Consultas HTTP |
| 📱 phonenumbers | Análisis de números telefónicos |
| 🕵️ Sherlock Project | Username OSINT |
| 🔎 holehe | Email OSINT |
| 🌍 HTML/CSS/JavaScript | Interfaz web |
| 📡 WebSockets | Comunicación en tiempo real |
| 🧪 scikit-learn | Base preparada para componentes de análisis/ML |

La configuración automatizada del proyecto instala varias de estas dependencias mediante `setup.bat`. Para utilizar todos los módulos actuales también existen dependencias adicionales utilizadas directamente por el backend. 

---

# 📁 Estructura del proyecto

```text
ForenSys-Lab/
│
├── 🐍 main.py
├── 🗃️ database.py
├── 🧱 models.py
├── 📐 schemas.py
│
├── 🌐 static/
│   └── index.html
│
├── 🧰 tools/
│   └── sherlock/
│
├── 📊 reports/
│
├── 🪟 setup.bat
├── ▶️ iniciar.bat
├── 🚫 .gitignore
│
└── 🔬 forensys-lab.png
```

> Los archivos de base de datos y ciertos archivos de evidencia no se versionan en Git según las reglas actuales del `.gitignore`.

---

# 💻 Requisitos

- Windows 10/11, Linux o un entorno Python compatible.
- Python 3.x.
- `pip`.
- Navegador web moderno.

Para algunas funciones OSINT se necesita conexión a Internet y disponibilidad de las fuentes externas utilizadas por cada módulo.

---

# 🚀 Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/AndresGonzalezDev444/ForenSys-Lab.git
cd ForenSys-Lab
```

---

## 2. Crear entorno virtual

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / Kali

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Instalar dependencias

Para cubrir las librerías utilizadas por el backend actual:

```bash
pip install fastapi "uvicorn[standard]" sqlalchemy opencv-contrib-python scikit-learn websockets jinja2 python-multipart numpy bcrypt exifread pillow requests phonenumbers
```

> `setup.bat` automatiza la creación del entorno virtual y la instalación de varias dependencias principales. Si se van a utilizar todos los módulos actuales, es recomendable instalar también las dependencias adicionales mostradas arriba. 

---

# ▶️ Ejecución

## Opción A — Windows

El repositorio incluye:

```text
iniciar.bat
```

Ejecutarlo desde la carpeta raíz:

```text
iniciar.bat
```

Este script activa el entorno configurado y ejecuta:

```text
python main.py
```


---

## Opción B — Uvicorn

Con el entorno virtual activado:

```bash
uvicorn main:app --reload
```

Después abre:

```text
http://127.0.0.1:8000
```

> El backend está definido como una aplicación FastAPI con el nombre `ForenSys Vision API`. 

---

# 📚 Documentación de la API

FastAPI genera automáticamente documentación interactiva.

Una vez iniciado el servidor:

```text
http://127.0.0.1:8000/docs
```

y la documentación alternativa:

```text
http://127.0.0.1:8000/redoc
```

La API incluye endpoints para autenticación, sujetos, fotografías y módulos de análisis. 

---

# 🔌 Endpoints destacados

| Método | Endpoint | Función |
|---|---|---|
| `POST` | `/api/login` | Autenticación |
| `GET` | `/api/users/me` | Usuario autenticado |
| `GET` | `/api/suspects` | Listar sujetos |
| `POST` | `/api/suspects` | Registrar sujeto |
| `GET` | `/api/suspects/{id}` | Consultar sujeto |
| `POST` | `/api/suspects/{id}/photo` | Subir fotografía |
| `POST` | `/api/suspects/{id}/photo_base64` | Registrar captura Base64 |
| `GET` | `/api/suspects/{id}/photos` | Listar fotografías |
| `DELETE` | `/api/photos/{id}` | Eliminar fotografía |
| `POST` | `/api/cyber/extract_metadata` | Analizar metadatos |
| `POST` | `/api/osint/analyze` | Username OSINT |
| `POST` | `/api/osint/email` | Email Intelligence |
| `POST` | `/api/osint/phone` | Phone Intelligence |
| `POST` | `/api/osint/cedula` | CC Intelligence |
| `POST` | `/api/osint/name` | Name Intelligence |

Los endpoints anteriores se encuentran implementados en `main.py`. 

---

# 📊 Reportes

Los módulos OSINT generan archivos JSON dentro de:

```text
reports/
```

Ejemplos de nomenclatura:

```text
reports/
├── osint_report_usuario.json
├── email_report_correo_at_dominio.json
├── phone_report_plus_57XXXXXXXXX.json
├── cedula_report_XXXXXXXXXX.json
└── name_report_nombre_apellido.json
```

Esto permite conservar los resultados y utilizarlos posteriormente para documentación o análisis. 

---

# 🧪 Casos de uso

## 🎓 Laboratorio académico

ForenSys Lab puede utilizarse como laboratorio para estudiar:

- Informática forense.
- OSINT.
- Ciberinteligencia.
- Metadatos.
- Hashing.
- Gestión de evidencia.
- Autenticación.
- APIs REST.
- Bases de datos.
- Desarrollo web con Python.

---

## 🔍 Análisis de evidencia digital

Ejemplo conceptual:

```text
Archivo
   ↓
📥 Carga
   ↓
🔐 MD5 / SHA-256
   ↓
📷 EXIF
   ↓
📍 GPS
   ↓
📝 Metadatos
   ↓
📊 Reporte
```

---

## 🧑‍⚖️ Investigación digital autorizada

El sistema puede utilizarse como apoyo para organizar información pública disponible y documentar resultados de búsquedas OSINT dentro de un laboratorio controlado.

La herramienta no debe interpretarse como sustituto de procedimientos judiciales, periciales o de validación institucional.

---

# 🔒 Privacidad y seguridad

ForenSys Lab trabaja con información que puede ser sensible.

Por ello:

- No subas credenciales reales al repositorio.
- No versiona la base de datos local.
- No versiona imágenes mediante la configuración actual del `.gitignore`.
- No incluyas evidencia real de investigaciones en un repositorio público.
- Utiliza información de laboratorio o datos anonimizados.
- Protege las credenciales de acceso.
- Cambia cualquier credencial de desarrollo antes de desplegar.

El `.gitignore` actual excluye bases de datos, imágenes, modelos, variables de entorno, secretos y claves. 

---

# ⚠️ Limitaciones actuales

La interfaz presenta varios componentes de una suite mayor que se encuentran en distintos estados.

En el dashboard aparecen módulos:

- ✅ Activos.
- 🛠️ En desarrollo.
- 🕐 Próximamente.

Por ejemplo, la propia interfaz identifica como futuros módulos componentes de Mobile, Disk, Memory, Malware, Network, Documents y otros.

Esto significa que **ForenSys Lab es una plataforma en evolución**, no una suite forense comercial terminada.

---

# 🔭 Roadmap

```text
✅ ForenSys Lab Core
    │
    ├── ✅ FastAPI
    ├── ✅ SQLite / SQLAlchemy
    ├── ✅ Authentication
    ├── ✅ Suspects
    ├── ✅ Evidence management
    ├── ✅ MetaInspect
    └── ✅ OSINT
           │
           ▼
🛠️ ForenSys Vision
🛠️ ForenSys Mobile
🛠️ ForenSys Video
🛠️ ForenSys Documents
🕐 ForenSys Disk
🕐 ForenSys Memory
🕐 ForenSys Network
🕐 ForenSys Malware
```

---

# 🧩 Filosofía del proyecto

ForenSys nace con una idea sencilla:

```text
                 ANALYZE
                    ↓
              IDENTIFY
                    ↓
                CORRELATE
                    ↓
                DOCUMENT
                    ↓
                 SOLVE
```

La plataforma busca integrar en un mismo entorno distintas etapas de una investigación digital:

**recolección → análisis → correlación → documentación.**

---

# 👨‍💻 Autor

## Andres Gonzalez Dev

**Robinson Andrés González Quintero**

💻 Desarrollo de Software · Sistemas · Ciberseguridad

🌐 **Web:**  
https://andresgonzalezdev.me

🐙 **GitHub:**  
https://github.com/AndresGonzalezDev444

---

<p align="center">
  <strong>🔬 FORENSYSLAB</strong><br>
  <em>ANALYZE · IDENTIFY · SOLVE</em>
</p>

---

## ⚖️ Disclaimer

ForenSys Lab es un proyecto de carácter **educativo, académico y experimental**.

Las funciones de análisis de información pública, biometría y evidencia digital deben utilizarse únicamente en escenarios autorizados y respetando la legislación, la privacidad de las personas y las políticas de las fuentes consultadas.

El autor no se responsabiliza por usos indebidos del software.

---

<p align="center">
  ⭐ Si el proyecto te resulta interesante, puedes apoyar el repositorio con una estrella.
</p>
