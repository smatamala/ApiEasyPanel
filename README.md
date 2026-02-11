# 🤖 Multi-AI Chat API

[![GitHub](https://img.shields.io/badge/GitHub-smatamala%2FApiEasyPanel-blue?logo=github)](https://github.com/smatamala/ApiEasyPanel)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20%2B-brightgreen?logo=node.js)](https://nodejs.org)

API de chat que rota automáticamente entre múltiples proveedores de IA gratuitos (Cerebras, Groq, OpenRouter) para maximizar el uso sin costos. Perfecta para desplegar en EasyPanel.

## ✨ Características

- 🔄 **Rotación automática** entre proveedores según disponibilidad
- 📊 **Tracking de uso** y rate limiting por proveedor
- 🚀 **3 proveedores integrados**: Cerebras, Groq, OpenRouter
- 🐳 **Docker ready** para despliegue en EasyPanel
- 🛡️ **Rate limiting** global para protección de la API
- 📈 **Monitoreo de estado** de todos los proveedores

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- API keys de al menos uno de los proveedores

### Instalación Local

```bash
# Clonar el repositorio
git clone <tu-repo>
cd ApiEasyPanel

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# Ejecutar en desarrollo
npm run dev
```

### Configuración de API Keys

Obtén tus API keys gratuitas:

- **Cerebras**: https://cloud.cerebras.ai/ (1M tokens/día)
- **Groq**: https://console.groq.com/ (14.4k requests/día)
- **OpenRouter**: https://openrouter.ai/ (200k tokens/día)

Edita el archivo `.env`:

```env
CEREBRAS_API_KEY=tu_clave_aqui
GROQ_API_KEY=tu_clave_aqui
OPENROUTER_API_KEY=tu_clave_aqui
```

## 📡 Endpoints

### POST `/api/chat`

Envía un mensaje simple y recibe respuesta de IA.

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, ¿cómo estás?",
    "model": "default"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "provider": "Cerebras",
  "model": "llama3.1-8b",
  "response": "¡Hola! Estoy muy bien, gracias por preguntar...",
  "tokensUsed": 156
}
```

### POST `/api/chat/conversation`

Envía una conversación completa con múltiples mensajes.

```bash
curl -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Cuál es la capital de Francia?"},
      {"role": "assistant", "content": "La capital de Francia es París."},
      {"role": "user", "content": "¿Y cuántos habitantes tiene?"}
    ],
    "model": "smart"
  }'
```

### GET `/api/providers/status`

Obtiene el estado de todos los proveedores.

```bash
curl http://localhost:3000/api/providers/status
```

**Respuesta:**
```json
{
  "success": true,
  "providers": [
    {
      "provider": "Cerebras",
      "tokensUsed": 45230,
      "tokensLimit": 1000000,
      "requestsToday": 128,
      "requestsLimit": 14400,
      "available": true
    },
    {
      "provider": "Groq",
      "tokensUsed": 12450,
      "tokensLimit": 14400,
      "requestsToday": 45,
      "requestsLimit": 14400,
      "available": true
    }
  ]
}
```

## 🎯 Modelos Disponibles

Puedes especificar el tipo de modelo en el parámetro `model`:

- `default` - Balance entre velocidad y calidad
- `fast` - Respuestas más rápidas
- `smart` - Mejor calidad de respuestas

## 🐳 Despliegue en EasyPanel

### 1. Preparar el proyecto

```bash
# Asegúrate de tener el código en un repositorio Git
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Crear aplicación en EasyPanel

1. Accede a tu panel de EasyPanel
2. Crea una nueva aplicación
3. Selecciona "Deploy from GitHub"
4. Conecta tu repositorio

### 3. Configurar variables de entorno

En EasyPanel, agrega estas variables:

```
NODE_ENV=production
PORT=3000
CEREBRAS_API_KEY=tu_clave
GROQ_API_KEY=tu_clave
OPENROUTER_API_KEY=tu_clave
ENABLED_PROVIDERS=cerebras,groq,openrouter
```

### 4. Configurar el servicio

- **Puerto**: 3000
- **Health Check**: `/health`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 5. Desplegar

EasyPanel detectará automáticamente el `Dockerfile` y construirá la imagen.

## 🔧 Configuración Avanzada

### Habilitar/Deshabilitar Proveedores

Edita la variable `ENABLED_PROVIDERS` en `.env`:

```env
# Solo usar Cerebras y Groq
ENABLED_PROVIDERS=cerebras,groq

# Usar todos
ENABLED_PROVIDERS=cerebras,groq,openrouter
```

### Ajustar Rate Limiting

```env
# Ventana de tiempo en ms (default: 60000 = 1 minuto)
RATE_LIMIT_WINDOW_MS=60000

# Máximo de requests por ventana (default: 100)
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Arquitectura

```
src/
├── config/
│   └── providers.js          # Configuración de proveedores
├── services/
│   ├── ProviderManager.js    # Lógica de rotación
│   └── AIProviders/
│       ├── BaseProvider.js   # Clase base
│       ├── CerebrasProvider.js
│       ├── GroqProvider.js
│       └── OpenRouterProvider.js
├── routes/
│   └── chat.js               # Endpoints de la API
├── middleware/
│   └── rateLimiter.js        # Rate limiting
└── index.js                  # Servidor principal
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para agregar un nuevo proveedor:

1. Crea una nueva clase en `src/services/AIProviders/`
2. Extiende `BaseProvider`
3. Implementa el método `chat()`
4. Agrega la configuración en `src/config/providers.js`
5. Registra el proveedor en `ProviderManager.js`

## 📝 Licencia

MIT
