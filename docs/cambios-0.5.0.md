# Jumping in the City 0.5.0

## Recorrido

Los siete edificios cambian de orden, posición lateral, separación y altura. El recorrido tiene ocho etapas: siete azoteas y el paseo a nivel de calle. Se necesita visitar las etapas en orden para completar el nivel. Los puntos de control permiten reintentar desde la última etapa alcanzada mediante la opción del menú de pausa.

Se incorporan los ocho objetos entregados: módulo de hormigón en L, barras horizontales, plataformas de precisión, red de cuerda, pasarela de equilibrio, tubo de descenso, barandilla de tubos y rampa. Hay accesos y apoyos adicionales construidos con geometría sencilla para unirlos a los edificios. Las colisiones son independientes de las copias visuales simplificadas.

- Primer cruce colgado de barras: avance alternando manos, pausa al soltar el joystick y salida sobre la siguiente azotea.
- Dos tubos conectan las plataformas superiores con la acera. Se desciende avanzando hacia el tubo; al soltar el joystick se detiene el descenso. El tubo no asciende reproduciendo el clip de bajada; el regreso se hace por la red.
- La red junto al paseo permite volver a subir. Está construida con módulos cortos y apoyos para las manos y los pies.
- Las cornisas alcanzables se agarran durante un salto. El joystick permite desplazarse lateralmente; Saltar sube al borde si existe una superficie suficiente detrás; alejarse del muro permite soltarse.
- Carrera por una pared vertical al saltar y avanzar junto a ella, durante un máximo de 0,85 segundos; salida con mortal cuando se mantiene el avance.
- Botón **Mortal**, o tecla F, para una voltereta hacia atrás desde el suelo. El salto conserva su trayectoria física.
- Las calles y aceras tienen colisión. Caer a la calle ya no provoca el reinicio automático anterior: se puede caminar junto a los peatones y volver por la red.

La cámara sigue siendo libre mediante arrastre. Se mantiene el nombre, el icono final aprobado, los 28 peatones, sus actividades independientes, los 72 vehículos y la ambientación de 0.4.0. Los peatones y el tráfico siguen siendo ambientación, no misiones ni personajes con diálogo.

## Qué contienen realmente los archivos del personaje

Los dos GLB recibidos del humano son idénticos, comprobados mediante SHA-256. Cada uno contiene los mismos cuatro clips, cuyos nombres son prompts truncados. Se integran con los alias `pole_slide`, `ledge_shimmy`, `monkey_bar` y `ledge_grab`.

La inspección visual mostró que `ledge_grab` es un gesto de equilibrio y no una suspensión estable; se usa al acercarse a un filo. Los otros clips requieren adaptación al objeto: la posición del torso, manos y pies se ajusta por código para establecer los contactos. Las barras mantienen una mano de apoyo mientras la otra avanza.

**No hay un clip llamado Parkour Jump en los archivos recibidos.** Se conserva el salto `jump` de la versión anterior, aprobado previamente por el usuario. `jump_down` y `dive` dejan de seleccionarse durante el juego. La recepción utiliza el salto aprobado. La carrera por pared y la mortal se construyen por código sobre el esqueleto; no se atribuyen a animaciones importadas inexistentes.

## Originales y reconstrucción

Los diez archivos se guardan completos y sin pérdida en `assets-originales/parkour/`, con manifiesto y hashes. Los dos duplicados del humano comparten las mismas partes comprimidas y se restauran con sus nombres respectivos.

```sh
python3 nivel-01/scripts/restore-parkour.py
node nivel-01/scripts/prepare-parkour.mjs
```

Las copias para el juego y sus colisiones están en `nivel-01/web/assets/parkour/`. Los ocho obstáculos originales contienen aproximadamente 1,5–2 millones de triángulos cada uno; las versiones visuales tienen alrededor de 18.000 y texturas de 1024 px. La geometría estática repetida se agrupa por material para reducir llamadas de dibujo.

## Verificación

`test-parkour-v05.mjs` comprueba el agarre, pausa, avance y salida de barras, tubos y red; apoyo estable sobre la calle; salto normal, mortal, cornisa y carrera por pared. `test-route-v05.mjs` recorre el nivel desde el inicio hasta la meta mediante movimiento, saltos y acciones contextuales, pasando las ocho etapas sin teletransportes durante el recorrido. `inspect-v05.mjs` permite revisar las poses y el entorno visualmente. `test-grips-v05.mjs` comprueba 160 poses adicionales de contacto contra los objetivos de manos.

Los resultados están en `parkour-v05-verification.json`, `parkour-route-verification.json`, `parkour-assets-audit.json` y `parkour-visual-audit.json`. Se verifica también la restauración de originales, las actividades de peatones y la correspondencia entre los recursos del repositorio y la APK publicada. Las pruebas de juego se realizan en Chromium; falta comprobar rendimiento y respuesta táctil en un Android físico.
