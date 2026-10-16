# PARKUT · Distrito del río

Primer nivel de un juego de parkour en tercera persona, diseñado en vertical para Android. Usa el personaje con esqueleto y los siete edificios entregados por el propietario del proyecto.

**[Descargar el APK de prueba](https://github.com/manureymar/parkut-juego/releases/download/nivel-01-build-2/Parkut-Nivel01.apk)** · **[Releases](https://github.com/manureymar/parkut-juego/releases) · **[Ver compilaciones](https://github.com/manureymar/parkut-juego/actions/workflows/android.yml)**

## Jugar

Instala `Parkut-Nivel01.apk` en Android 8.0 o posterior, con WebView actualizado y soporte de OpenGL ES 3.0 / WebGL 2. El APK incluye los modelos, el código, las texturas y el panorama; no descarga recursos al jugar y no requiere cuenta.

- Joystick: caminar o correr según cuánto lo desplaces.
- **Saltar**: superar obstáculos y cambiar de azotea.
- **Trepar**: subir a un obstáculo cercano cuyo borde sea alcanzable.
- **Correr**: activar o desactivar el avance continuo; dirige con el joystick.
- Pausa: continuar, reiniciar, cambiar entre calidad alta y fluida, y activar sonido.
- En ordenador: WASD o flechas, Espacio para saltar, E para trepar, R para carrera continua, Esc para pausa.

Sigue las marcas amarillas. Cada azotea alcanzada guarda un punto de control durante la partida. En el edificio del hueco central, el recorrido pasa por la cornisa izquierda. La puerta iluminada del último edificio es el final.

## Contenido del repositorio

| Carpeta | Contenido |
|---|---|
| `assets-originales/` | Los ocho GLB originales comprimidos sin pérdida (GZIP dividido en partes), la referencia y el panorama. |
| `nivel-01/web/` | Juego WebGL 2, interfaz, controles y recursos optimizados para el APK. |
| `nivel-01/android/` | Aplicación Android con WebView y recursos locales; configuración Gradle. |
| `nivel-01/scripts/` | Preparación reproducible de geometría, texturas, colisiones y verificación. |
| `docs/` | Inventario de recursos, decisiones de integración y resultados de verificación. |
| `.github/workflows/android.yml` | Compilación automática y publicación del APK de prueba en GitHub Releases. |

Los originales se conservan completos en archivos GZIP sin pérdida; los mayores se dividen en partes. `npm run restore` recupera cada GLB y verifica su SHA-256 contra `assets-originales/manifest.json`. El APK usa copias con geometría simplificada y texturas WebP de hasta 2048 px. Las colisiones se calculan sobre otra versión ligera de los mismos edificios: el cielo y la ciudad lejana son una imagen de fondo y no forman parte del recorrido.

## Construcción

El código del juego y las dependencias Three.js que ejecuta están incluidos en el repositorio. No hay dependencias de CDN en tiempo de ejecución. La app es una aplicación Android que contiene un juego WebGL 2; no es un proyecto Unity ni Godot.

Para reconstruir el APK sin instalar herramientas en tu ordenador, abre **Actions → Compilar APK de Parkut → Run workflow**. Cada compilación correcta crea un APK firmado de prueba y su suma SHA-256 en Releases. No se utiliza una clave de publicación de Google Play. Al cambiar la clave de depuración entre entornos, Android puede requerir desinstalar una prueba anterior antes de instalar la siguiente.

Entorno reproducible: Java 17, Gradle 8.9, Android Gradle Plugin 8.7.3, SDK 35, Build Tools 35.0.0. Desde `nivel-01/android`, ejecuta `gradle assembleDebug`. El resultado queda en `app/build/outputs/apk/debug/app-debug.apk`. El APK compilado se conserva en GitHub Releases.

Para desarrollo web: Node 22 o posterior, `npm ci`, `npm run dev` y abrir `http://127.0.0.1:8080`. `npm run assets` regenera las copias optimizadas a partir de los originales. `npm run vendor` actualiza las dependencias incluidas desde la versión fijada en `package-lock.json`. Para pruebas: `npx playwright install chromium` y `npm test`.

## Alcance de esta primera versión

Incluye cámara de seguimiento, iluminación cálida, sombras dinámicas, fondo de ciudad, personaje animado, movimiento, salto, escalones, trepar a bordes alcanzables, puntos de control, caída y reinicio, pausa, cronómetro y final del recorrido. Las siete animaciones originales permanecen en los recursos. Las animaciones de desplazamiento se adaptan al controlador para evitar que el movimiento del esqueleto se sume dos veces.

La reconstrucción 3D tiene pequeñas diferencias respecto a la ilustración, incluidas barandas, huecos y proporciones; la imagen de referencia se conserva para las siguientes iteraciones. Esta versión no implementa todavía carreras por paredes, balanceo colgando ni simulación de manos/pies con cinemática inversa. El rendimiento final debe comprobarse en el teléfono de destino.

## Recursos y licencias

Los modelos y la referencia fueron aportados por el propietario del proyecto. El panorama fue generado para este nivel. No se concede una licencia de redistribución adicional de esos recursos. Three.js conserva su licencia MIT en `nivel-01/web/vendor/LICENSE`. Las dependencias de desarrollo mantienen sus licencias originales.
