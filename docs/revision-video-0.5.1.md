# Revisión del video y correcciones — 0.5.1

Video recibido: `video_2026-10-17_12-28-33.mp4`, 235,826 segundos, 590 × 1280. Se revisó toda su duración con secuencias cada 0,5 segundos y ampliaciones a 15 fps de los agarres y la entrada a la red. Después se contrastaron los síntomas con el código y se probaron las correcciones.

| Momento aproximado | Problema observado | Cambio |
|---|---|---|
| 00:02–00:18 | Bloqueo y contacto incorrecto junto a escaleras y equipos | Cápsula de 1,86 m, colisiones de edificios más precisas y comprobación del espacio sobre la cabeza. Las escaleras ya no desactivan las colisiones laterales. |
| 00:20–00:32; 01:04–01:16 | Tubos y barreras bajas no activan un salto con apoyo | Detección de altura, grosor, trayectoria libre y llegada; acercamiento, apoyo de una mano, impulso y aterrizaje. Recolocación de objetos que coincidían con desniveles o vacíos. |
| 00:36–00:51 | Agarre inestable en las barras | Un solo juego de peldaños, posiciones de manos ligadas a cada barra y solución de brazos con un plano estable para los codos. Piernas flexionadas sin caminar en el aire. |
| 00:48–01:01 | Superficies y plataformas superpuestas | Separación vertical de plataformas y pasarelas; eliminación de marcos duplicados en los cruces de barras. |
| 01:40–01:49 | Fachada delante de la cámara al caer | Límite al retraso de la cámara, búsqueda de espacio junto a una esquina y comprobación final de visibilidad desde el personaje. |
| 01:52–02:04; 02:27–02:40 | Calles elevadas y pies bajo el asfalto | Colisión derivada de las carreteras visibles; base del modelo comprimida para reducir bordillos; pavimento continuo con huecos reservados al trazado de las vías. |
| 02:05–02:23 | Ventanas sin agarre utilizable | Siete rutas de ventanas con marcos y bordes visibles, agarre lateral, saltos entre ventanas y salida a un balcón conectado con cada azotea. |
| 02:30–02:39; 02:53–03:16 | Vehículos y peatones atraviesan al jugador | Cesión de paso, separación física con el jugador y reanudación de marcha cuando se libera el camino. Se conservan las actividades independientes de los peatones. |
| 03:18–03:27 | Tubo inaccesible desde la calle | Entrada desde ambos extremos. Botones DESLIZARSE / ESCALAR TUBO y DETENER / CONTINUAR. Joystick arriba para subir y abajo para bajar. Saltar permite soltarse. |
| 03:31–03:56 | Ascenso robótico y soportes atravesando la red | Red continua, soportes laterales, velocidad de escalada de 1 m/s y transición suave de manos y pies entre apoyos. |

La carrera por pared conserva un límite de tiempo y exige mantener una pared real al costado. Los saltos usan el clip aprobado que ya estaba en el proyecto; no se reactivan los clips `dive` ni `jump_down` para las caídas normales. El nombre y el icono aprobados se conservan.

## Verificación

- Recorrido completo: ocho puntos de control y meta, con desplazamiento y acciones contextuales; sin teletransportes durante la ruta.
- Dos tubos comprobados en los dos sentidos, con salida sobre suelo válido.
- Siete rutas de ventanas comprobadas desde la calle hasta su balcón superior.
- Dos tubos horizontales comprobados con salto automático y llegada apoyada.
- Doce muestras de carretera: apoyo de los pies entre 2,0 y 2,8 cm sobre la superficie renderizada, incluido el margen de separación de la cápsula.
- Cinco puntos de pavimento en reposo: deriva vertical cero.
- 1.440 poses consecutivas de barras, red, cornisa y tubo; sin saltos bruscos de codos ni pies. Pruebas adicionales de agarre quieto.
- Pruebas de colisión de pared, techo bajo, vehículos y peatones; 100 rayos contrastados con la geometría visual y 180 pasos de cámara durante caída y giro.
- Tráfico y peatones: frenan ante el jugador y reanudan su marcha cuando se aparta.
- Carrera por pared: 0,70 segundos y aproximadamente 4,15 metros en el caso de regresión.
- Se conservan los siete modelos de peatones y sus 38 clips, con cobertura verificada de todas sus actividades.

Resultados: [regresiones del video](video-v051-verification.json), [continuidad de animaciones](motion-v051-verification.json), [recorrido completo](route-v051-verification.json).

Para repetir: `npm ci`, `npx playwright install chromium`, `npm run test:v051`.

Las pruebas de juego se ejecutaron en Chromium con renderizado de software. La validación visual no sustituye una prueba de esta nueva APK en un teléfono físico. Los modelos generados a partir de imágenes mantienen parte de sus formas y texturas irregulares; esta actualización corrige las colisiones, las conexiones del nivel y los comportamientos descritos, sin convertir esos modelos en arte reconstruido manualmente. Las ventanas escalables son los bordes físicos añadidos, no todas las ventanas pintadas de los edificios lejanos. La interacción con coches y personas es cinemática: se detienen y bloquean el paso, no se simulan choques, daños ni ragdolls.
