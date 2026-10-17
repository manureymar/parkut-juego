# Verificación 0.5.1

La revisión del video, cambios, pruebas y límites están en [revision-video-0.5.1.md](revision-video-0.5.1.md). Los informes de versiones anteriores se conservan a continuación.

---

# Verificación del primer nivel — 0.5.0

- Diez GLB originales archivados sin pérdida en GitHub, restaurados y comprobados por SHA-256. Los dos packs del humano son duplicados y contienen cuatro clips; no contienen Parkour Jump.
- Los ocho objetos nuevos están en el recorrido, con geometría de colisión y copias visuales simplificadas. Se reordenan y desplazan los siete edificios.
- Prueba del recorrido completo: ocho etapas y meta, usando movimiento, saltos y acciones contextuales sin teletransportes durante el recorrido. Incluye descenso, paseo junto a los peatones y regreso a las azoteas.
- Barras, dos tubos y red: entrada contextual, pausa al soltar el joystick, avance y salida sobre un suelo válido; separación final de 2,5 cm respecto al apoyo de la cápsula.
- Cuatro puntos de calle probados en reposo: apoyo estable y deriva vertical cero durante cinco segundos.
- Salto normal con el clip aprobado, mortal sin apoyar las manos, agarre y desplazamiento por cornisa, caída controlada desde el borde, carrera por pared y salida con mortal comprobados.
- Revisión final de 160 poses de agarre: error máximo de la mano respecto al objetivo de 0,008 m. Las manos alternan fases de apoyo y avance en barras y cornisas.
- Sin errores JavaScript durante las pruebas. Vistas de obstáculos, calle, barras, tubo, red, cornisa, pared y mortal inspeccionadas visualmente.

Resultados: [recorrido completo](parkour-route-verification.json), [acciones](parkour-v05-verification.json), [agarres finales](parkour-grip-verification.json), [inventario](parkour-assets-audit.json). Alcance, controles y limitaciones: [cambios 0.5.0](cambios-0.5.0.md).

Las pruebas de juego se hicieron en Chromium con renderizado de software. Falta comprobar esta versión en un teléfono Android físico. La [compilación 8](https://github.com/manureymar/parkut-juego/actions/runs/39015370290) terminó correctamente y publicó la [APK 0.5.0](https://github.com/manureymar/parkut-juego/releases/download/nivel-01-build-8/Jumping-in-the-City-v0.5.0.apk). Código compilado: `84af4f4babd6ee1b4f5f24eeb2228ad7beb49f02`.

Se descargó la APK publicada y se verificó de nuevo: 58.454.576 bytes, 89 recursos web idénticos al repositorio, firma válida, nombre e icono correctos. El certificado coincide con 0.4.0 y permite actualizarla sin desinstalar. Informe: [apk-0.5.0-verification.json](apk-0.5.0-verification.json).

SHA-256: `c85ef49938d0854cb72d4d3d7efb2a237326c72e522141a4a2f899349c4a9f0a`.

---

# Historial de verificación — 0.4.0

## Peatones y ciudad

- Siete modelos originales conservados sin pérdida y comprobados mediante SHA-256; sus 38 clips se conservan en las copias optimizadas.
- 28 peatones con esqueleto y mezclador independientes, fases iniciales, velocidades, pausas y actividades individuales aleatorias.
- Simulación de 15 minutos: 2.277 transiciones, los 38 clips ejercitados y separación mínima de seguimiento de 1,35 m. Semilla reproducible y avance independiente de la tasa de fotogramas.
- Revisión de 190 poses de los 38 clips: separación mínima respecto al suelo de 0,00478 m y máxima de 0,018 m en las poses muestreadas; sin penetración en esas muestras.
- Aceras continuas, suelo opaco, jardines, 60 árboles 2D, ocho bancos, tres estanques y 60 edificios ambientales. Se mantienen los 28 módulos de carretera y 72 vehículos.
- Chromium a 390 × 844: 28 comprobaciones de apoyo sobre la geometría real, actividades independientes, pausa, calidad alta/fluida, cámara libre y salto normal con recepción sin rodada.
- Sin errores JavaScript, de shaders ni de descarga; los recursos se sirven localmente. Las vistas de calles, peatones y jardines se inspeccionaron visualmente.

Resultados: [simulación](pedestrian-simulation-verification.json), [animaciones](pedestrian-animation-verification.json), [ciudad integrada](city-v04-verification.json) y [auditoría de recursos](pedestrian-assets-audit.json). El alcance y las funciones pendientes de otras etapas están en [cambios 0.4.0](cambios-0.4.0.md).

## Android y publicación

[GitHub Actions, compilación 7](https://github.com/manureymar/parkut-juego/actions/runs/39009962162) terminó correctamente. El código compilado es `2b501b732cf75b33e7f3644129d6aa8cb0a5d7dc`. Java 17, Gradle 8.9 y SDK 35; versión 0.4.0, código 4, Android 8.0 o posterior.

[Descargar Jumping in the City 0.4.0](https://github.com/manureymar/parkut-juego/releases/download/nivel-01-build-7/Jumping-in-the-City-v0.4.0.apk). Tamaño: 48.860.630 bytes. SHA-256:

`4b3bf2166da4026c9be8aca60095104e4fdb6f353a33ea6233dcca3a04a51d9b`

Se descargó la APK publicada y se volvió a verificar: los 68 archivos web empaquetados coinciden byte a byte con el repositorio, la firma es válida, el nombre visible es **Jumping in the City** y contiene los recursos Android del icono final aprobado. Los detalles están en [apk-0.4.0-verification.json](apk-0.4.0-verification.json) y también se adjuntan a la publicación.

El certificado coincide con el de 0.3.0 y se conserva `com.parkut.game`, por lo que esta APK puede actualizar la 0.3.0 sin desinstalarla. Es una compilación de prueba firmada; la conservación de la firma en futuras compilaciones depende de la caché de Actions.

No se ha probado esta actualización en un teléfono Android físico. Chromium utilizó renderizado de software; no permite asegurar FPS de una GPU móvil. El rendimiento y la respuesta táctil final deben comprobarse en el teléfono de destino.

---

# Historial de verificación — 0.3.0

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

`assembleDebug` completado localmente y en [GitHub Actions](https://github.com/manureymar/parkut-juego/actions/runs/38998506542), con Java 17, Gradle 8.9 y Android SDK 35. Versión 0.3.0, código 3.

La [compilación 6](https://github.com/manureymar/parkut-juego/releases/tag/nivel-01-build-6) contiene un APK de 37.464.387 bytes. Su SHA-256 coincide con la descarga publicada; los 49 archivos de recursos del APK coinciden byte a byte con el código y los modelos del repositorio. Firma APK v2 verificada. Los detalles están en `apk-0.3.0-verification.json`.

Se detectó que la ruta de la caché de firma anterior no contenía la clave usada por Gradle. La compilación 6 genera/restaura una clave en una ruta explícita y el registro confirma que se guardó correctamente en la caché. La firma cambia respecto a la compilación 4: es necesario desinstalar la APK anterior para instalar esta prueba, lo que borra sus datos locales. La reutilización posterior depende de la conservación de esa caché de GitHub.

No se ha probado esta actualización en un teléfono Android físico. El navegador usa renderizado de software: su tasa de imágenes no representa la de una GPU móvil. El rendimiento y la respuesta táctil final deben comprobarse en el teléfono de destino. **Calidad: fluida** reduce la resolución interna y desactiva sombras dinámicas.
