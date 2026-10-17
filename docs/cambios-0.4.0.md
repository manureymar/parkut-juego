# Jumping in the City 0.4.0

Esta versión incorpora los siete personajes nuevos a la ciudad, completa sus espacios de suelo y aplica el icono final aprobado.

## Peatones

- 28 ciudadanos distribuidos en ocho recorridos sobre aceras, utilizando los siete modelos entregados, cuatro instancias de cada uno.
- Se conservan sus 38 animaciones. Cada instancia tiene esqueleto, mezclador, fase, velocidad y secuencia de actividades independientes. La semilla cambia al abrir una partida; las pruebas utilizan una semilla reproducible.
- Caminata normal mediante `walk`; saludos, miradas, espera, descanso, calentamiento, llamada y otros gestos se seleccionan según los clips que realmente tiene cada modelo. No se asignan animaciones inexistentes.
- Los clips de caminar y detenerse, saludar caminando y caminar gesticulando conservan su curva de avance. Ese desplazamiento se aplica una sola vez a la ruta, evitando duplicarlo con el movimiento del esqueleto.
- La animación `joven fitnes caminando` contiene movimientos amplios de brazos: se reserva para una actividad ocasional y no se utiliza como caminata normal. `swagger` es una variante expresiva y `sob` un gesto emocional poco frecuente.
- Separación entre peatones, detención ante otra persona, giros redondeados y transiciones de 0,28 s. Las rutas evitan las avenidas, los ramales de los cruces y los estanques.
- Apoyo de los zapatos corregido con vértices del modelo deformado; sombras de contacto suaves y teléfono pequeño unido a la mano en la llamada.
- Modelos simplificados a aproximadamente 8.000–8.600 triángulos, texturas WebP de 768 px y actualización de esqueletos según distancia y calidad.

## Ciudad

- Base de suelo continua, aceras con textura de losas, jardineras, césped, 60 árboles mediante imágenes 2D, ocho bancos y tres estanques con movimiento sutil del agua.
- Textura nueva para las bases de los edificios y seis edificios ambientales adicionales para completar la continuidad de la ciudad. Se mantienen las dos carreteras y los 72 vehículos.
- Cuatro imágenes originales generadas para esta integración, con sus prompts, en `arte-ciudad/suelo-y-vegetacion/`. Sus versiones ligeras están en `nivel-01/web/assets/environment/`.

## Android y controles

- Nombre visible: **Jumping in the City**. Identificador Android conservado: `com.parkut.game`.
- Versión 0.4.0, código 4. Iconos raster y adaptativos, pantalla de carga e identificador del HUD derivados del archivo final aprobado, sin sustituirlo por una nueva propuesta.
- Se mantienen cámara libre, joystick, salto normal aprobado y recorrido por azoteas.
- La compilación verifica las rutas y comprueba firma, nombre, versión y todos los recursos del APK antes de publicarlo.

## Alcance y verificación

Los peatones son ambientación animada. El personaje jugable sigue recorriendo las azoteas: bajar libremente a la calle, los nuevos obstáculos de barras/red/tubo y las nuevas maniobras de agarre y mortal siguen pendientes de sus modelos/animaciones y de su integración específica. Esta versión tampoco cambia los clips de caída del protagonista.

Los siete GLB originales se reconstruyeron y comprobaron contra sus SHA-256. Se revisaron visualmente y midieron 190 poses de los 38 clips; la separación mínima de los pies en esas muestras está entre 4,8 y 18 mm. La simulación de 15 minutos ejercita los 38 clips y mantiene al menos 1,35 m de separación longitudinal. La prueba de navegador comprueba pausa, 28 apoyos reales sobre las aceras, rutas fuera del tráfico, cámara, salto normal y recursos offline sin errores JavaScript ni de shaders.

Resultados reproducibles: `pedestrian-assets-audit.json`, `pedestrian-animation-verification.json`, `pedestrian-simulation-verification.json` y `city-v04-verification.json`. La validación se realizó en Chromium; no sustituye la prueba en un teléfono Android físico.
