# jExperience Event Schemas

This document describes the JSON schema structure for events captured by the jExperience tracking library. All schemas are located under `src/main/resources/META-INF/jexperience/schemas/events`.

## Schema Overview

Each event type has its own schema definition that validates the structure of tracking events before they are processed and stored.

### Common Event Structure

All jExperience events share these base properties:

```json
{
  "type": "object",
  "properties": {
    "eventType": {
      "type": "string",
      "description": "Identifier for the type of event"
    },
    "timestamp": {
      "type": "number",
      "description": "Unix timestamp when the event occurred"
    },
    "source": {
      "type": "object",
      "properties": {
        "url": { "type": "string" },
        "title": { "type": "string" },
        "path": { "type": "string" }
      }
    },
    "target": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "type": { "type": "string" }
      }
    },
    "sessionId": { "type": "string" },
    "visitorId": { "type": "string" }
  },
  "required": ["eventType", "timestamp", "source"]
}
```

## Event Type Schemas

### ContentVisibility Event

```json
{
  "eventType": "contentVisible",
  "properties": {
    "target": {
      "properties": {
        "id": { "type": "string" },
        "type": { "type": "string" },
        "elementType": { "type": "string" }
      },
      "required": ["id", "type"]
    },
    "visibilityRatio": {
      "type": "number",
      "description": "Percentage of element visible in viewport"
    }
  }
}
```

### ScrollDepth Event

```json
{
  "eventType": "scrollDepth",
  "properties": {
    "depth": {
      "type": "number",
      "description": "Percentage of page scrolled"
    },
    "milestone": {
      "type": "string",
      "enum": ["25%", "50%", "75%", "90%", "100%"]
    },
    "pageHeight": {
      "type": "number"
    }
  },
  "required": ["depth", "milestone"]
}
```

### ReadDepth Event

```json
{
  "eventType": "readDepth",
  "properties": {
    "contentId": {
      "type": "string"
    },
    "percentage": {
      "type": "number"
    },
    "milestone": {
      "type": "string",
      "enum": ["20%", "40%", "60%", "80%", "100%"]
    },
    "timeSpent": {
      "type": "number",
      "description": "Time in seconds spent reading"
    }
  },
  "required": ["contentId", "percentage", "milestone"]
}
```

### MediaInteraction Event

```json
{
  "eventType": "mediaInteraction",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["play", "pause", "progress", "complete"]
    },
    "mediaType": {
      "type": "string",
      "enum": ["video", "audio"]
    },
    "mediaId": {
      "type": "string"
    },
    "progress": {
      "type": "number",
      "description": "Percentage of media played"
    },
    "duration": {
      "type": "number",
      "description": "Total duration in seconds"
    },
    "currentTime": {
      "type": "number"
    }
  },
  "required": ["action", "mediaType", "mediaId"]
}
```

### Download Event

```json
{
  "eventType": "download",
  "properties": {
    "fileName": {
      "type": "string"
    },
    "fileType": {
      "type": "string"
    },
    "fileSize": {
      "type": "number",
      "description": "Size in bytes if available"
    },
    "linkContext": {
      "type": "string",
      "description": "Parent element context of download link"
    }
  },
  "required": ["fileName", "fileType"]
}
```

### CopyAction Event

```json
{
  "eventType": "copy",
  "properties": {
    "sourceType": {
      "type": "string",
      "enum": ["article", "code", "table", "text"]
    },
    "textPreview": {
      "type": "string",
      "description": "First 100 characters of copied content"
    },
    "charCount": {
      "type": "number"
    },
    "sourceElement": {
      "type": "string",
      "description": "Selector of element containing copied text"
    }
  },
  "required": ["sourceType", "textPreview", "charCount"]
}
```

### TimeOnPage Event

```json
{
  "eventType": "timeOnPage",
  "properties": {
    "durationMs": {
      "type": "number",
      "description": "Time spent on page in milliseconds"
    },
    "durationSec": {
      "type": "number",
      "description": "Time spent on page in seconds"
    },
    "entryTimestamp": {
      "type": "number"
    },
    "exitTimestamp": {
      "type": "number"
    }
  },
  "required": ["durationMs", "durationSec"]
}
```

## Schema Validation

Events are validated against these schemas before being processed. Invalid events are logged for debugging purposes but not stored in the analytics database.
