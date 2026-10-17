# Cinco peatones para la ciudad de Parkut

Referencias 2D individuales para convertir en modelos 3D. PNG de 1024 × 1536 con canal alfa, cuerpo completo, vista frontal y pose A. Generadas con imagegen; los prompts completos están en `prompts.json` y los hashes en `manifest.json`.

| Archivo | Personaje |
|---|---|
| `01-joven-camiseta-azul.png` | Hombre joven, camiseta azul petróleo y jeans. |
| `02-mujer-sudadera-granate.png` | Mujer joven, sudadera granate y pantalón beige. |
| `03-hombre-camisa-azul.png` | Hombre adulto, camisa azul y pantalón caqui. |
| `04-mujer-chaqueta-verde.png` | Mujer adulta, chaqueta verde y jeans oscuros. |
| `05-hombre-mayor-polo-ocre.png` | Hombre mayor, polo ocre y pantalón gris. |

## Modelado y animación

Usar cada imagen por separado. Entregar cada personaje en GLB con malla, materiales, texturas, esqueleto humanoide y clips de caminar y reposo. Estas imágenes aún no son modelos ni incluyen animación.

Prompt reutilizable para la caminata:

> Caminata cotidiana relajada de un adulto, ciclo continuo y suave de aproximadamente 1,2 segundos a 30 fps. Animación en el sitio, sin desplazamiento ni rotación global del hueso raíz. Pasos alternos naturales, apoyo talón-planta-punta, rodillas orientadas hacia delante y pies sin cruzarse ni deslizar durante el apoyo. Brazos relajados con balanceo leve opuesto a las piernas; manos abiertas sin acercarlas a los pies. Torso estable con oscilación pequeña. Primer y último fotograma compatibles para repetir el ciclo. Sin salto, carrera, giro ni gestos adicionales; sin deformar proporciones ni atravesar el cuerpo.

## Ajustes siguientes registrados

- Revisar la animación que deforma brazos/piernas al saltar o caer. El usuario aprueba el salto nuevo: conservarlo. Identificar primero si el problema restante aparece en la caída o la rodada, sin dar por confirmado un clip concreto.
- Completar los espacios vacíos entre aceras mediante suelo y decoración, incluyendo elementos 2D donde sean adecuados.
- Integrar peatones y rutas de caminata cuando estén disponibles sus modelos con esqueleto y animaciones.

Esta entrega contiene las cinco referencias solicitadas primero. La APK 0.3.0 todavía no incluye peatones ni los ajustes siguientes.
