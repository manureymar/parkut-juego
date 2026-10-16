# Dirección visual · nivel 01

Referencia: `assets-originales/referencia-nivel.png`.

Luz cálida del sol desde la izquierda, cielo azul con nubes, ciudad de arquitectura contemporánea, río y horizonte de montañas. Las azoteas jugables están en 3D; el panorama lejano es una imagen. Cámara de tercera persona mirando hacia delante, interfaz vertical ligera y acentos amarillos coherentes con las barandas y los puntos de salto.

## Fondo generado

Archivo maestro: `assets-originales/city-panorama.png`.
Herramienta: generación de imágenes integrada, usando la referencia como guía de iluminación y arquitectura.

Prompt utilizado:

> Production background matte painting for a realistic 3D rooftop parkour Android game. Use the reference only for city architecture, warm late-afternoon sunlight from left, luminous pale blue atmosphere, atmospheric depth and color. Clean panoramic city background at tall-rooftop height: glass and concrete towers, hazy skyline, distant soft mountain range, river between dense urban blocks and roads far below. Top half open blue sky with sunlit white cumulus, lower half distant city. No nearby playable roof, character, people, UI, buttons or text. Warm golden sun off-frame upper left, shadows cast right, cool soft atmospheric shadows, refined realistic architectural detail.

El fondo se integra como plano panorámico lejano, con un pequeño desplazamiento relativo a la cámara. Las sombras del personaje y de los edificios se calculan en tiempo real sobre la geometría jugable. Las marcas amarillas son guías de recorrido hechas con geometría plana, colocadas sobre la superficie real.

## Orden del recorrido

1. Azotea técnica: `concrete office building 3d model.glb`.
2. Distrito industrial: `industrial rooftop 3d model.glb`.
3. Obras en altura: `brick building 3d model.glb`.
4. Terrazas: `office building 3d model.glb`.
5. Los contenedores: `industrial warehouse 3d model.glb`.
6. El paso estrecho: `concrete building 3d model.glb`.
7. El refugio: `modern office building 3d model.glb`.

Las escalas y posiciones se documentan en `nivel-01/web/level.js`. La colisión se simplifica por separado del modelo visible. Los originales no se alteran.
