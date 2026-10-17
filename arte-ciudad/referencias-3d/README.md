# Calles y vehículos: referencias para modelado 3D

Siete imágenes independientes generadas para la ambientación de PARKUT. Son referencias 2D; los modelos 3D y el tráfico animado se integrarán después.

| Archivo | Contenido | Vista |
| --- | --- | --- |
| [01-red-calles.png](01-red-calles.png) | Red urbana conectada con avenidas, aceras y pasos peatonales; sin edificios | Cenital, plana |
| [02-auto-compacto-rojo.png](02-auto-compacto-rojo.png) | Compacto de cinco puertas rojo | Tres cuartos frontal elevado |
| [03-auto-sedan-plata.png](03-auto-sedan-plata.png) | Sedán plateado | Tres cuartos frontal elevado |
| [04-auto-suv-verde.png](04-auto-suv-verde.png) | SUV verde | Tres cuartos frontal elevado |
| [05-auto-taxi-amarillo.png](05-auto-taxi-amarillo.png) | Taxi amarillo | Tres cuartos frontal elevado |
| [06-auto-furgoneta-blanca.png](06-auto-furgoneta-blanca.png) | Furgoneta de reparto blanca | Tres cuartos frontal elevado |
| [07-auto-pickup-azul.png](07-auto-pickup-azul.png) | Pickup azul de doble cabina con caja vacía | Tres cuartos frontal elevado |

Cada PNG contiene un solo recurso con canal alfa. Usar la transparencia al importarlo. Los espacios entre las calles quedan libres para colocar los edificios por separado. Cada vehículo se entrega completo, con puertas cerradas y ruedas rectas, sin conductor ni marcas.

`prompts.json` conserva las indicaciones de generación. `manifest.json` registra dimensiones, tamaños y sumas de comprobación de los PNG originales.

Estado: arte de referencia, pendiente de conversión a 3D e integración en el juego. Esta entrega no modifica la compilación Android.
