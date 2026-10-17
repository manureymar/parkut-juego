# Verificación del primer nivel — 0.3.0

## Personaje y recorrido

- Reposo estable durante 20 segundos de simulación: desplazamiento cero.
- 63 poses de nueve clips contrastadas contra los 25.952 vértices deformados del personaje: separación mínima de 0,018 m respecto al apoyo, sin penetración.
- El reposo nuevo se reproduce; el salto nuevo sube unos 2,4 m y aterriza sin activar la rodada en la misma azotea.
- Cinco escaleras inclinadas, escalera vertical del tanque con detención/salida, subida a borde alcanzable y rodada tras caída fuerte comprobadas por simulación.
- Manos de la escalera alineadas con los objetivos de los peldaños: errores de 0,0039 m y 0,0049 m en la pose de prueba. No es una medición de todas las poses posibles.
- Los seis saltos de conexión entre edificios pasan las pruebas; el hueco central y su cornisa siguen abiertos.
- La aproximación final por el lateral del tanque permite alcanzar la salida usando movimiento y subida automática de borde.

## Ciudad, cámara e interfaz

- Dos carreteras originales montadas en 28 módulos, cuatro modelos de coche y 54 edificios de fondo.
- 72 coches simulados durante 120 segundos: distancia mínima de 2,2 m, sin solapamientos ni cruces en rojo; frenado y arranque comprobados.
- Cámara girada mediante arrastre real del navegador sin mover al personaje; botón de centrado y controles separados para cámara y joystick.
- Interfaz en Chromium a 390 × 844: carga, inicio, movimiento, salto, pausa sin avance de tiempo, recuperación tras caída y meta.
- Joystick táctil y salto simultáneos comprobados con eventos multitáctiles del navegador.
- La prueba integrada de 0.3.0 termina sin errores JavaScript ni de compilación de shaders.
- Vistas del nivel, calles, salto y escalera inspeccionadas visualmente. Los originales nuevos se reconstruyen sin pérdida y coinciden con los SHA-256 del manifiesto.

Resultados: `physics-test-results.json`, `traversal-test-results.json`, `animation-test-results.json`, `traffic-test-results.json` y `v03-test-results.json`. Auditorías de recursos: `city-assets-audit.json` y `city-buildings-audit.json`.

## Android

`assembleDebug` completado con Java 17, Gradle 8.9 y Android SDK 35. Versión 0.3.0, código 3. La descarga publicada se compila en GitHub Actions; su enlace y verificación de firma se registran al finalizar la publicación.

No se ha probado esta actualización en un teléfono Android físico. El navegador usa renderizado de software: su tasa de imágenes no representa la de una GPU móvil. El rendimiento y la respuesta táctil final deben comprobarse en el teléfono de destino. **Calidad: fluida** reduce la resolución interna y desactiva sombras dinámicas.
