# Disclaimer JSON Format

The disclaimer JSON file describes a simple rich-text document made up of a list of block-level elements, each of which may contain nested inline text elements. This text can be configured and shown as a disclaimer in the timeSeriesChart GFI Theme.

## Top-level structure

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Unique identifier of the disclaimer document. |
| `blocks` | array | Ordered list of block-level content elements rendered in the disclaimer from top to bottom. |

```json
{
  "id": "timeserieschart-disclaimer",
  "blocks": []
}
```

## Block elements (`blocks[]`)

Each entry in `blocks` represents one rendered block (e.g. a heading or paragraph).

| Parameter | Type | Description |
|---|---|---|
| `type` | string | Block type. Allowed values: `"h2"` (level-2 heading), `"p"` (paragraph). |
| `content` | array | Ordered list of inline content elements (see below) rendered inside the block. |

```json
{
  "type": "h2",
  "content": [
    { "type": "text", "text": "Haftungsausschluss" }
  ]
}
```

```json
{
  "type": "p",
  "content": [
    { "type": "text", "text": "Auf Webseiten der Freien und Hansestadt Hamburg werden tagesaktuelle Grundwasserstandsdaten bereitgestellt." }
  ]
}
```

## Inline content elements (`blocks[].content[]`)

Elements nested inside a block's `content` array represent inline text spans, which can be mixed within the same paragraph to apply different formatting.

| Parameter | Type | Description |
|---|---|---|
| `type` | string | Inline element type. Allowed values: `"text"` (plain text run), `"strong"` (bold/emphasized text run). |
| `text` | string | The actual text content of this inline element. |

```json
{ "type": "text", "text": "Es handelt sich teilweise um " }
```

```json
{ "type": "strong", "text": "nicht geprüfte Rohdaten" }
```

Multiple inline elements can be combined within one paragraph to mix plain and emphasized text:

```json
{
  "type": "p",
  "content": [
    { "type": "text", "text": "Es ist zu beachten, dass es sich bei den dargestellten Daten teilweise um " },
    { "type": "strong", "text": "nicht geprüfte Rohdaten" },
    { "type": "text", "text": " handelt." }
  ]
}
```

## Full example

```json
{
  "id": "timeserieschart-disclaimer",
  "blocks": [
    {
      "type": "h2",
      "content": [
        { "type": "text", "text": "Haftungsausschluss" }
      ]
    },
    {
      "type": "p",
      "content": [
        { "type": "text", "text": "Auf Webseiten der Freien und Hansestadt Hamburg werden tagesaktuelle Grundwasserstandsdaten sowie Datenauswertungen von Grundwassermessstellen bereitgestellt, die von der Behörde für Umwelt, Klima, Energie und Agrarwirtschaft (BUKEA) betrieben und ausgewertet werden." }
      ]
    },
    {
      "type": "p",
      "content": [
        { "type": "text", "text": "Sämtliche diesbezüglichen Inhalte der Webseiten sind freibleibend und unverbindlich. Es ist zu beachten, dass es sich bei den dargestellten Daten teilweise um " },
        { "type": "strong", "text": "nicht geprüfte Rohdaten" },
        { "type": "text", "text": " handelt, die vollautomatisch an den Grundwassermessstellen erfasst und per Datenfernübertragung an die Webanwendung übermittelt werden." },
        { "type": "text", "text": " Die BUKEA übernimmt keine Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität der bereitgestellten Daten, Informationen, Karten und Messwerte auf der Webseite." }
      ]
    },
    {
      "type": "p",
      "content": [
        { "type": "text", "text": "Die BUKEA behält es sich ausdrücklich vor, Teile der Webseiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen." }
      ]
    }
  ]
}
```
