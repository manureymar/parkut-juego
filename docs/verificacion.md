# Verificación del primer nivel — 0.2.0

## Regresión del video del usuario

- Reposo: 20 segundos de simulación con desplazamiento exactamente cero; posición de la cámara sin cambios.
- 49 poses de los siete clips, contrastadas contra los 25.952 vértices deformados del personaje: separación mínima de 0,018 m respecto a su apoyo, sin penetración.
- Las cinco escaleras inclinadas se recorren con el joystick.
- Escalera del tanque: entrada automática, ascenso, detención y salida sobre el depósito.
- Borde alcanzable: subida automática al avanzar hacia él.
- Salto automático de conexión entre azoteas y rodada tras caída fuerte.
- Prueba integrada: las siete animaciones se activan por sus estados de juego, sin invocar un botón de acción.
- Resultados: `traversal-test-results.json`, `animation-test-results.json` y `context-test-results.json`.
- Capturas del juego: `vista-nivel-01.png`, `escalera-tanque.png` y `rodada.png`.

## Comprobado

- Ocho modelos GLB cargados: siete edificios y un personaje.
- Personaje con 65 huesos y siete clips de animación originales.
- Los siete edificios se mantienen en el recorrido; el séptimo tramo termina ante la puerta del refugio.
- Geometría visual de los edificios reducida a aproximadamente 1,1 millones de triángulos en total. Los originales conservan todos sus datos.
- Colisiones independientes: 38.987 triángulos en el recorrido completo.
- Movimiento sobre las rejillas de la azotea inicial, salto y aterrizaje: pruebas de simulación a 120 pasos por segundo.
- Seis conexiones entre edificios comprobadas por simulación: todas permiten despegar y aterrizar en la siguiente azotea.
- Hueco central y cornisa conservados: diferencia de altura superior a 12 metros.
- Interfaz probada con Chromium a 390 × 844: carga, inicio, avanzar con teclado, salto, pausa sin avance de tiempo, recuperación tras caída y llegada a la meta.
- Sin errores JavaScript en la prueba de interfaz.
- Joystick táctil y salto simultáneos comprobados con eventos multitáctiles del navegador.
- Compilación Android `assembleDebug` completada; firma APK v2 verificada con `apksigner`.
- Compilación reproducida con éxito en GitHub Actions y APK publicado en [nivel-01-build-4](https://github.com/manureymar/parkut-juego/releases/tag/nivel-01-build-4).

Los resultados numéricos de las pruebas están en `physics-test-results.json`. Las capturas del juego real están en `vista-nivel-01.png` y `pantalla-inicio.png`.

## Pendiente de comprobar en dispositivo

Esta actualización no se ha probado en un teléfono Android físico; la regresión parte del video de la versión anterior enviado por el usuario. El rendimiento, el área útil de la pantalla y la respuesta táctil deben comprobarse en el modelo de teléfono de destino. La opción **Calidad: fluida** reduce la resolución interna y desactiva las sombras dinámicas para dispositivos con menor capacidad.

La prueba usa renderizado de software en un navegador de escritorio; su tasa de imágenes no representa el rendimiento de una GPU móvil. No se afirma una tasa de FPS garantizada.
