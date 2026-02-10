# CRMota - CRM + POS + Catálogo con Supabase y PHP

Sistema completo para gestión empresarial con Punto de Venta (POS), CRM de Clientes, Inventario, Gestión Financiera e integración con WhatsApp Cloud API.

## Tecnologías Utilizadas

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend**: PHP 8.2 (API REST), Dompdf (Reportes).
- **Base de Datos**: Supabase (PostgreSQL), Supabase Auth, Row Level Security (RLS).
- **Integración**: WhatsApp Cloud API.
- **Despliegue**: Docker & Docker Compose.

## Estructura del Proyecto

```text
/
├── backend/            # API REST en PHP 8.2
│   ├── api/            # Endpoints
│   ├── config/         # Configuración y .env
│   ├── controllers/    # Lógica de negocio
│   ├── middleware/     # Auth JWT
│   └── services/       # WhatsApp & PDF Services
├── frontend/           # Aplicación React 18
│   ├── src/
│   │   ├── components/ # UI Reutilizable
│   │   ├── context/    # Auth Context
│   │   ├── pages/      # Dashboard, POS, CRM, etc.
│   │   └── lib/        # Supabase Client
└── database.sql        # Esquema para Supabase
```

## Instalación

### 1. Requisitos
- PHP 8.2+ o Docker
- Node.js 18+
- Cuenta en Supabase

### 2. Configuración de Base de Datos
1. Crea un nuevo proyecto en [Supabase](https://supabase.com).
2. Ejecuta el contenido de `database.sql` en el SQL Editor de Supabase.
3. Habilita Supabase Auth (Email/Password).

### 3. Configuración del Backend (PHP)
1. Copia `backend/.env.example` a `backend/.env`.
2. Completa tus credenciales de Supabase y WhatsApp.
3. Ejecuta `composer install` en la carpeta `backend`.

### 4. Configuración del Frontend (React)
1. Ve a la carpeta `frontend`.
2. Crea un archivo `.env` con:
   ```env
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```
3. Ejecuta `npm install` y `npm run dev`.

### 5. Uso con Docker
Ejecuta en la raíz:
```bash
docker-compose up --build
```

## Características de Producción
- **Seguridad**: RLS habilitado en todas las tablas.
- **Moderno**: Diseño Dark Mode por defecto con Tailwind CSS.
- **Escalable**: Arquitectura desacoplada.
