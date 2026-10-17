# Jumping in the City · Distrito del río

Primer nivel de un juego de parkour en tercera persona, diseñado en vertical para Android. Usa el personaje con esqueleto, los siete edificios, las dos carreteras, los cuatro vehículos y los siete modelos de peatones entregados por el propietario del proyecto.

**[Descargar el APK 0.3.0 de prueba](https://github.com/manureymar/parkut-juego/releases/download/nivel-01-build-6/Parkut-Nivel01.apk)** · **[Releases](https://github.com/manureymar/parkut-juego/releases)** · **[Ver compilaciones](https://github.com/manureymar/parkut-juego/actions/workflows/android.yml)**

## Jugar

Instala `Parkut-Nivel01.apk` en Android 8.0 o posterior, con WebView actualizado y soporte de OpenGL ES 3.0 / WebGL 2. El APK incluye los modelos, el código, las texturas y el panorama; no descarga recursos al jugar y no requiere cuenta.

- Joystick: caminar o correr según cuánto lo desplaces, siguiendo la orientación de la cámara.
- Arrastra sobre el escenario para girar la cámara y mirar alrededor. El botón de cámara vuelve a centrarla en el recorrido.
- **Saltar**: control manual opcional para saltar cuando tú lo decidas.
- **Parkour automático**: al dirigirte al obstáculo subes las escaleras, trepas bordes alcanzables y usas la escalera vertical del tanque. Suelta el joystick para detenerte en la escalera; muévelo hacia atrás para bajar.
- Los seis saltos entre azoteas se activan al avanzar hacia el borde. Tras una caída fuerte, el personaje usa automáticamente la zambullida y rodada para amortiguar. El hueco largo sigue siendo un peligro: usa su cornisa.
- **Correr**: activar o desactivar el avance continuo; dirige con el joystick.
- Pausa: continuar, reiniciar, cambiar entre calidad alta y fluida, y activar sonido.
- En ordenador: WASD o flechas, Espacio para saltar, R para carrera continua, C para centrar la cámara, Esc para pausa. Arrastra con el ratón para mirar.

Sigue las marcas amarillas. Cada azotea alcanzada guarda un punto de control durante la partida. En el edificio del hueco central, el recorrido pasa por la cornisa izquierda. La puerta iluminada del último edificio es el final.

## Contenido del repositorio

| Carpeta | Contenido |
|---|---|
| `assets-originales/` | Modelos originales y animaciones comprimidos sin pérdida (GZIP dividido en partes), la referencia y el panorama. |
| `nivel-01/web/` | Juego WebGL 2, interfaz, controles y recursos optimizados para el APK. |
| `nivel-01/android/` | Aplicación Android con WebView y recursos locales; configuración Gradle. |
| `nivel-01/scripts/` | Preparación reproducible de geometría, texturas, colisiones y verificación. |
| `docs/` | Inventario de recursos, decisiones de integración y resultados de verificación. |
| `.github/workflows/android.yml` | Compilación automática y publicación del APK de prueba en GitHub Releases. |

Los originales se conservan completos en archivos GZIP sin pérdida; los mayores se dividen en partes. `npm run restore` recupera cada GLB y verifica su SHA-256 contra `assets-originales/manifest.json`. El APK usa copias con geometría simplificada y texturas WebP de hasta 2048 px. Las colisiones se calculan sobre otra versión ligera de los mismos edificios, con cinco corredores de escalera medidos sobre sus peldaños y una ruta vertical para el tanque: el cielo y la ciudad lejana forman un panorama; las calles, el tráfico y los edificios cercanos son geometría 3D ambiental fuera del recorrido. Los originales nuevos se restauran con `python3 nivel-01/scripts/restore-city-originals.py` y su propio manifiesto de hashes.

## Construcción

El código del juego y las dependencias Three.js que ejecuta están incluidos en el repositorio. No hay dependencias de CDN en tiempo de ejecución. La app es una aplicación Android que contiene un juego WebGL 2; no es un proyecto Unity ni Godot.

Para reconstruir el APK sin instalar herramientas en tu ordenador, abre **Actions → Compilar Jumping in the City → Run workflow**. Cada compilación correcta crea un APK firmado de prueba y su suma SHA-256 en Releases. No se utiliza una clave de publicación de Google Play. Se corrige la conservación de la clave de pruebas con una ruta de firma explícita. Esta versión necesita desinstalar la APK anterior si Android indica conflicto de firma; se reinicia la partida local. La clave se guarda en la caché de Actions para reutilizarla mientras esa caché siga disponible.

Entorno reproducible: Java 17, Gradle 8.9, Android Gradle Plugin 8.7.3, SDK 35, Build Tools 35.0.0. Desde `nivel-01/android`, ejecuta `gradle assembleDebug`. El resultado queda en `app/build/outputs/apk/debug/app-debug.apk`. El APK compilado se conserva en GitHub Releases.

Para desarrollo web: Node 22 o posterior, `npm ci`, `npm run dev` y abrir `http://127.0.0.1:8080`. `npm run assets` regenera las copias optimizadas a partir de los originales. `npm run vendor` actualiza las dependencias incluidas desde la versión fijada en `package-lock.json`. Para pruebas: `npx playwright install chromium`, `npm test` y `npm run test:v03`.

## Versión 0.4.0

Integra 28 peatones con los siete modelos y sus 38 clips, rutinas individuales, aceras continuas, jardines, árboles 2D, bancos y estanques. El nombre visible y el icono Android usan **Jumping in the City** y el arte definitivo aprobado.

Los personajes originales completos están en `assets-originales/peatones/`. Se restauran con `python3 nivel-01/scripts/restore-pedestrians.py`. `npm run assets:pedestrians` prepara las versiones para Android. Pruebas: `npm run test:pedestrians`, `npm run test:v04` y `node nivel-01/scripts/review-pedestrians.mjs`.

Consulta [los cambios y su alcance](docs/cambios-0.4.0.md). La nueva APK se publicará automáticamente en Releases al completar los controles de compilación y verificación; el enlace de descarga de la cabecera se actualiza después de comprobar la publicación.

## Versión 0.3.0 (historial)

Integra el reposo y el salto nuevos, nueve clips de animación, cámara libre, alineación de manos y pies con los peldaños del tanque, seis conexiones ajustadas y marcas de aterrizaje. La rodada se activa tras caídas fuertes; el salto normal tiene su propia recepción.

La ciudad usa 28 módulos de carretera, 54 edificios de fondo y 72 vehículos en ambos sentidos. Los cuatro modelos se distribuyen sin repeticiones consecutivas en un carril, con variaciones de pintura. Los coches mantienen distancia, frenan ante semáforos y vuelven a arrancar. En esta versión circulan por las avenidas principales; los ramales completan la ambientación. Los vehículos no tienen ruedas articuladas independientes.

Incluye iluminación cálida, sombras, bruma, partículas ambientales, puntos de control, caída y reinicio, pausa, cronómetro y final. Los originales se conservan completos; el APK usa copias simplificadas. Consulta [los cambios](docs/cambios-0.3.0.md) y [la verificación](docs/verificacion.md).

La reconstrucción 3D conserva las irregularidades de los modelos entregados. No se implementan todavía carreras por paredes ni balanceo colgando. El rendimiento final debe comprobarse en el teléfono de destino; la opción de calidad fluida reduce resolución y sombras.

## Recursos y licencias

Los modelos y la referencia fueron aportados por el propietario del proyecto. El panorama fue generado para este nivel. No se concede una licencia de redistribución adicional de esos recursos. Three.js conserva su licencia MIT en `nivel-01/web/vendor/LICENSE`. Las dependencias de desarrollo mantienen sus licencias originales.
