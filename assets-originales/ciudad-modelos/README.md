# Carreteras, tráfico y salto originales

Se conservan íntegros los seis modelos de ciudad entregados por el propietario y la nueva animación de salto. Cada GLB está comprimido con GZIP sin pérdida y dividido en partes de hasta 8 MiB. `manifest.json` registra los nombres originales, tamaños y SHA-256 de originales y partes.

```bash
python3 nivel-01/scripts/restore-city-originals.py
npm run assets:city
```

El primer comando recupera los siete archivos en `restaurados/`, verifica su integridad y añade una copia del reposo archivado anteriormente. El segundo prepara los recursos móviles e incorpora los clips `idle` y `jump` al personaje existente; también prepara las versiones de los edificios para el fondo.

Los archivos recibidos no se modifican. La aplicación usa las copias optimizadas de `nivel-01/web/assets/`. Las dos carreteras se ensamblan por código, y los cuatro vehículos se reutilizan en 72 instancias de tráfico.
