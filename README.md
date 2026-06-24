# Seguimiento de Checks SBVP

Pizarra movil para ver que checks de equipamiento fueron realizados en los ultimos 7 dias y cuales quedan pendientes.

## Encabezados esperados en REGISTROS

Segun el repo `SBVP_ EQUIPAMIENTO V2`, la hoja `REGISTROS` se crea con estos encabezados:

`Fecha carga`, `Fecha control`, `Actividad`, `Responsable/s`, `Observaciones`, `PDF`, `Total items`, `Total novedades`

No pude leer la hoja directamente por URL publica porque Google devuelve `401 No autorizado`. El Apps Script si puede leerla porque usa permisos del archivo.

## Uso

1. Si queres una Web App nueva, publicar Apps Script con el contenido de `Code.gs`.
2. Si queres usar la Web App actual de equipamiento, agregar lo indicado en `apps-script-existing-project-snippet.gs` al Apps Script existente y volver a implementar.
3. Abrir `index.html` desde el celular o publicarlo como sitio estatico.
4. Si se usa otra Web App, pegar la URL en el panel de conexion.

El front llama a:

`?action=checksSummary&days=7`
