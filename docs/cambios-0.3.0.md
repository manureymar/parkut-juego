# Parkut 0.3.0

## Ciudad y tráfico

- Se integran las dos carreteras y los cuatro vehículos entregados: compacto, taxi, pickup y furgoneta.
- 28 módulos de carretera, dos avenidas con cruces en T y ramales laterales.
- Se corrige por código el estrechamiento que tenía la carretera reconstruida, para conectar los tramos con un ancho uniforme.
- 72 vehículos en carriles de ambos sentidos. Distribución de modelos sin repeticiones consecutivas en un mismo carril; variaciones de pintura en compactos y pickups.
- Velocidades distintas, distancia de seguridad, frenado, espera en rojo y arranque progresivo. La circulación de esta versión sigue las avenidas principales.
- 54 edificios de fondo derivados de los modelos originales, con geometría y texturas reducidas; panorama alrededor de la cámara, bruma, partículas de luz y resplandor solar.

## Personaje y controles

- El clip de reposo entregado sustituye la pose congelada. El salto entregado sustituye el salto normal anterior; conserva impulso, vuelo y recepción adaptados a la física.
- La rodada se reserva para desniveles/impactos fuertes. Saltar y volver a la misma azotea deja de dispararla innecesariamente.
- Cámara orbital táctil, independiente de la orientación del personaje. Arrastrar sobre el escenario permite mirar alrededor; el botón de cámara o la tecla C vuelve a centrarla. El joystick sigue funcionando como control independiente.
- La cámara acorta su distancia ante paredes para evitar atravesarlas y mantiene el ángulo de visión al acercarse.
- Escalera del tanque: orientación según el plano real de los peldaños, separación del torso ajustada e IK en brazos y piernas. La cápsula mantiene un acceso estable desde la plataforma.
- Conexiones entre azoteas de 2,5 m, dos edificios desplazados para alinear los accesos, marcas de aterrizaje y recorrido alrededor del tanque.

## Conservación y compilación

Todos los GLB nuevos se archivan sin pérdida en `assets-originales/ciudad-modelos/`. El reposo original permanece en `assets-originales/pendientes/` y ya está integrado. La aplicación incluye sus recursos y funciona sin descargar modelos durante la partida.

Versión Android 0.3.0, código 3. El APK de prueba se publica desde GitHub Actions con la clave de pruebas conservada desde la compilación 4.
