# Obstáculos para Jumping in the City

Diez imágenes individuales con transparencia real para que el usuario las convierta a modelos 3D. Mantienen los materiales de las azoteas: metal y madera gastados, goma, concreto, cuerda y detalles amarillos. Generadas con image_gen.imagegen; los prompts exactos están en prompts.json y prompts-06-10.json.

| Archivo | Uso previsto | Medidas orientativas para modelar |
| --- | --- | --- |
| 01-tubo-horizontal.png | Saltar o franquear un tubo horizontal | Ancho 2,2 m; alto 0,85 m |
| 02-pasarela-tablones.png | Puente estrecho o recorrido de equilibrio | Largo 2,8 m; ancho 0,75 m |
| 03-pila-neumaticos.png | Obstáculo bajo y variación de altura | Diámetro 0,75 m; alto total 0,70 m |
| 04-rampa-parkour.png | Subir y preparar un salto | Largo 2,7 m; ancho 1,3 m; alto 0,85 m |
| 05-tubo-vertical-descenso.png | Descender deslizándose por una fachada | Módulo de 3,5 m; diámetro del tubo 0,08 m |

Las medidas son objetivos de modelado, no una garantía de escala inferida de la imagen. Se pueden ajustar al personaje y a las distancias del nivel.

## Segunda serie: más variedad de maniobras

| Archivo | Maniobra prevista para una futura integración | Medidas orientativas |
| --- | --- | --- |
| 06-barras-aereas.png | Agarre superior, balanceo y avance de mano en mano | Largo 3,2 m; ancho 1,4 m; alto 2,6 m |
| 07-muro-rebote.png | Carrera sobre pared, rebote en esquina y subida por el borde | Alto 2,2 m; paneles de 3 m y 1,8 m |
| 08-plataformas-precision.png | Encadenar saltos con aterrizajes pequeños a alturas distintas | Apoyos de 0,55 m; alturas de 0,45 a 1,15 m |
| 09-red-escalada.png | Trepar y desplazarse lateralmente por una red | Ancho 2,4 m; alto 2,7 m |
| 10-viga-equilibrio.png | Equilibrio, cambios de dirección y saltos hacia una viga estrecha | Recorrido de 4 m; ancho 0,18 m; alto 0,75 m |

Para el modelado, conservar la separación entre las plataformas, los huecos entre barras y las celdas abiertas de la red. La cara superior de la viga debe quedar plana y continua en sus giros. Se pueden exportar como objetos estáticos en GLB con sus texturas; no necesitan esqueleto. Estas referencias no implementan las maniobras del personaje: las animaciones y la interacción se integrarán después de recibir los modelos.

## Entrega de cada objeto

Exportar cada pieza por separado en GLB, con sus materiales y texturas incluidos, escala en metros y eje vertical coherente. Son objetos estáticos: no necesitan esqueleto ni animaciones. Dejar el origen en el centro de la base para facilitar su colocación. Mantener la cara transitable de la rampa continua; conservar los huecos de los neumáticos y el espacio libre bajo la barra. En el tubo vertical, mantener el tramo central liso y los soportes detrás. Si se generan módulos repetibles, evitar tapas o uniones sobresalientes en el recorrido de deslizamiento.

## Alcance actual

El usuario aclaró que en esta fase quiere únicamente las imágenes; él hará la conversión a 3D y entregará los modelos para colocarlos después. No se ha modificado el código del juego ni generado una APK con estos obstáculos.

Para la fase posterior quedan anotadas sus solicitudes: descenso por tubo, acceso a la calle, caminar por ella y trepar de nuevo por los edificios. Esas mecánicas requieren integración y comprobación de colisiones, trayectorias y animaciones cuando se reciban los modelos. Las imágenes por sí mismas no las implementan.

