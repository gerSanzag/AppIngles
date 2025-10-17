# 🎓 AppIngles - English Learning App

Una aplicación web para aprender inglés de forma interactiva con persistencia de datos local.

## ✨ Características

- **🎮 Juego de Aprendizaje**: Sistema de preguntas y respuestas con puntuación
- **📚 Gestión de Palabras**: Añadir, editar y eliminar palabras español-inglés
- **🗄️ Múltiples Bases de Datos**: Organizar palabras por categorías (hasta 20 bases)
- **💾 Persistencia Local**: Los datos se guardan en el disco duro del proyecto
- **📱 Diseño Responsive**: Funciona en móviles y desktop
- **🔄 Guardado Automático**: Los datos se guardan automáticamente en cada cambio

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm (viene con Node.js)

### Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar el servidor**:
   ```bash
   npm start
   ```

3. **Abrir la aplicación**:
   - Ve a: `http://localhost:3000`
   - La aplicación se abrirá automáticamente en tu navegador

### Uso

1. **Crear una base de datos**:
   - Ve a "ADD WORDS"
   - Haz clic en "CREATE NEW DATABASE"
   - Ingresa un nombre para tu base de datos

2. **Añadir palabras**:
   - Selecciona una base de datos
   - Ingresa palabras en español e inglés manualmente
   - O importa desde archivo (.txt, .csv, .md, .rtf)

3. **Jugar y aprender**:
   - Ve a "PLAY GAME"
   - Selecciona una base de datos
   - Responde las preguntas en inglés
   - Las palabras con 15+ puntos se marcan como "aprendidas"

4. **Ver progreso**:
   - "VIEW WORDS": Ver todas las palabras guardadas
   - "LEARNED WORDS": Ver palabras dominadas

## 📁 Estructura del Proyecto

```
AppIngles/
├── data/                 # 📁 Datos guardados (se crea automáticamente)
│   ├── words.json       # Palabras guardadas
│   ├── learnedWords.json # Palabras aprendidas
│   ├── databases.json   # Bases de datos
│   ├── gameStats.json  # Estadísticas del juego
│   └── currentDatabase.json # Base de datos actual
├── js/                  # 📁 Código JavaScript
│   ├── app.js          # Lógica principal
│   ├── modules.js      # Módulos del juego
│   └── navigation.js   # Sistema de navegación
├── styles/             # 📁 Estilos CSS
│   ├── main.css        # Estilos principales
│   ├── components.css  # Componentes UI
│   └── modules.css     # Estilos por módulo
├── server.js           # 🖥️ Servidor local
├── package.json        # 📦 Configuración del proyecto
└── index.html          # 🏠 Página principal
```

## 🔧 Configuración

### Puerto del Servidor
Por defecto, el servidor corre en el puerto 3000. Para cambiarlo:

1. Edita `server.js`
2. Cambia la variable `PORT`
3. Reinicia el servidor

### Datos
- Los datos se guardan automáticamente en la carpeta `data/`
- Cada tipo de dato tiene su propio archivo JSON
- Los datos se cargan automáticamente al iniciar la aplicación

## 🎯 Funcionalidades Principales

### 1. Gestión de Bases de Datos
- Crear hasta 20 bases de datos diferentes
- Cambiar entre bases de datos
- Eliminar bases de datos (y sus palabras)

### 2. Gestión de Palabras
- **Entrada Manual**: Añadir pares español-inglés
- **Importación Masiva**: Desde archivos de texto
- **Búsqueda**: Filtrar palabras por contenido
- **Eliminación**: Individual o masiva

### 3. Sistema de Juego
- **Preguntas Aleatorias**: Basadas en las palabras guardadas
- **Sistema de Puntuación**: +10 por acierto, -5 por error
- **Rachas**: Contador de respuestas consecutivas correctas
- **Palabras Aprendidas**: Se marcan automáticamente con 15+ puntos

### 4. Persistencia de Datos
- **Guardado Automático**: En cada cambio relevante
- **Carga Automática**: Al iniciar la aplicación
- **Respaldo Local**: Los datos se guardan en el disco duro

## 🛠️ Desarrollo

### Estructura del Código
- **`app.js`**: Lógica principal y gestión de datos
- **`modules.js`**: Módulos del juego y base de datos
- **`navigation.js`**: Sistema de navegación entre módulos

### API Local
- **GET `/api/data`**: Obtener todos los datos
- **POST `/api/data`**: Guardar todos los datos
- **POST `/api/data/:type`**: Guardar tipo específico de datos

## 🐛 Solución de Problemas

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Verifica que las dependencias estén instaladas: `npm install`
- Verifica que el puerto 3000 esté libre

### Los datos no se guardan
- Verifica que la carpeta `data/` tenga permisos de escritura
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador para errores

### La aplicación no carga
- Verifica que estés accediendo a `http://localhost:3000`
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador para errores

## 📝 Notas Importantes

- **Sin API Externa**: Ya no requiere Google Translate API
- **Datos Locales**: Todos los datos se guardan localmente
- **Sin Internet**: La aplicación funciona completamente offline
- **Respaldo**: Los datos se guardan en archivos JSON en la carpeta `data/`

## 🎉 ¡Disfruta aprendiendo inglés!

La aplicación está lista para usar. Solo necesitas:
1. Ejecutar `npm start`
2. Abrir `http://localhost:3000`
3. ¡Comenzar a aprender!
