# Parkut 0.2.0 — movimiento y atmósfera

Correcciones basadas en el video de la partida enviado por el propietario.

- El controlador conserva un apoyo fijo al dejar el joystick. La gravedad ya no desplaza el cuerpo lateralmente sobre los triángulos de las rejillas. Las paredes y el apoyo del suelo se resuelven por separado.
- La cámara sigue un ancla suavizada con margen de estabilidad vertical. El foco de las sombras se ajusta a la resolución del mapa, para reducir oscilaciones.
- Se eliminó el movimiento exportado de la cadera y se calcula el apoyo del cuerpo deformado por el esqueleto. El reposo procede de la postura de pie al final de `jump_down`.
- Cinco superficies continuas siguen los peldaños visibles: azotea técnica, plataforma del tanque, edificio en obras y los dos tramos de las terrazas. Los huecos y bordes siguen abiertos.
- La escalera vertical del tanque se activa al acercarse y avanzar hacia ella. El joystick controla subir, detenerse o bajar. Una transición permite salir al techo del tanque.
- Los obstáculos con borde alcanzable activan `climb` al avanzar hacia ellos. Se comprueba que haya espacio para quedar de pie.
- El salto automático solo se permite en las seis conexiones conocidas entre edificios, con una superficie de aterrizaje comprobada. No se deduce un salto a partir de un fallo de raycast sobre una rejilla.
- Las caídas fuertes activan la sección de zambullida y rodada de `dive`. El desplazamiento durante la rodada comprueba el apoyo delante del personaje.
- Los puntos de control se guardan dentro de la azotea, evitando el ciclo de caer y reaparecer en el borde.
- Luz cálida directa, relleno de cielo exterior, sombras más marcadas, niebla de distancia y movimiento ambiental discreto. Se conserva el panorama artístico original.
- Se retiró el botón de trepar. El salto manual sigue disponible como opción. La pausa detiene también el renderizado continuo.

## Selección de las siete animaciones

| Clip original | Situación |
|---|---|
| `walk` | Joystick suave, desplazamiento lento |
| `run` | Desplazamiento rápido |
| `subir escalera` | Escalera inclinada |
| `subir escalera recta hacia arriba` | Escalera vertical del tanque |
| `climb` | Borde alcanzable, subida y salida de la escalera |
| `jump_down` | Ascenso y descenso durante el salto o caída |
| `dive` | Amortiguar un aterrizaje fuerte con rodada |

No se han sustituido los modelos del usuario. Las manos y los pies usan las animaciones aportadas, sin cinemática inversa individual por peldaño. Las superficies de juego y las rutas de interacción se describen en `nivel-01/web/traversal.js`.
