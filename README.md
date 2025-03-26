# 📑 Sistema de Tickets con AWS (Ticket System)

Un sistema de gestión de tickets simplificado, desarrollado con Node.js, Express, DynamoDB y despliegue en AWS EC2.

---

## 📋 Tabla de Contenido

- Características
    
- Arquitectura
    
- Requisitos
    
- Instalación
    
- Configuración de AWS
    
- Despliegue en EC2
    
- API Reference
    
- Contribución
    
- Licencia
---

## 🚀 Características

- **Interfaz dual**:
    
    - 👥 Usuarios: Crear tickets y ver su estado.
        
    - 👑 Administradores: Gestionar todos los tickets.
        
- **Integración con AWS**:
    
    - 🗃️ Almacenamiento en DynamoDB.
        
    - ☁️ Despliegue en EC2.
        
- **Funcionalidades clave**:
    
    - ✅ Búsqueda en tiempo real.
        
    - 🔄 Actualización de estados (Pendiente/En Progreso/Resuelto).
        
    - 📲 Notificaciones toast interactivas.

---

## 🏗️ Arquitectura

ticket-system-aws/
├── public/            # Frontend (HTML/CSS/JS)
├── server.js          # Backend (Node.js/Express)
├── package.json       # Dependencias
├── .env.example       # Variables de entorno
└── README.md          # Documentación

---

## 🛠️ Requisitos

- Node.js v18+
    
- Cuenta AWS con:
    
    - DynamoDB (tablas `Users` y `Tickets`)
        
    - EC2 (Instancia Linux)
        
- CLI de Git

---

## 🔑 Configuración de AWS

1. **Crear tablas en DynamoDB**:
    
    - `Users`: Clave primaria `username` (String).
        
    - `Tickets`: Clave primaria `id` (Number).
        
2. **Configurar variables de entorno**:
    
    - Renombrar `.env.example` a `.env`.
        
    - Completar con tus credenciales:
---

## 🚀 Despliegue en EC2

1. **Crear instancia EC2**:
    
    - AMI: Amazon Linux 2
        
    - Rol IAM: Adjuntar rol con política `AmazonDynamoDBFullAccess`.
        
2. **Conectar y configurar**:
    
    ### Instalar Node.js
    sudo yum install -y nodejs git
    
    ### Clonar repositorio
    git clone https://github.com/cascovalente/ticket-system-aws
    cd ticket-system-aws
    
    ### Iniciar servidor (producción)
    npm start
    
3. **Abrir puertos**:
    
    - HTTP (5000) y SSH (22) en el grupo de seguridad.
---

## 📡 API Reference

| Endpoint         | Método | Descripción                  |
| ---------------- | ------ | ---------------------------- |
| `/login`         | POST   | Autenticar usuario           |
| `/tickets`       | POST   | Crear ticket                 |
| `/tickets/admin` | GET    | Obtener todos los tickets    |
| `/tickets/:id`   | PUT    | Actualizar estado del ticket |
