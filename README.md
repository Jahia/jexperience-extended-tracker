# jExperience Tracking Library

This README documents the jExperience extended tracking library (`wem.js`), which provides comprehensive user behavior tracking capabilities for websites.

## Overview

The jExperience extended tracker enhances websites with advanced analytics tracking capabilities, monitoring user interactions without requiring manual implementation for each tracked element.

## Features

### Core Functionality
- **Event Batching**: Events are collected in batches (default size: 10) before sending to the server
- **Auto-initialization**: Waits for base wem object to load before extending

### Tracking Capabilities

#### Content Visibility Tracking
Automatically tracks when content elements become visible in the viewport:
- Tracks elements matching `.track-visibility`, `article`, `.product`, `.hero`, `.cta`
- Uses IntersectionObserver with 50% visibility threshold
- Dynamically tracks newly added elements

#### Scroll Depth Tracking
Tracks how far users scroll down the page:
- Records 25%, 50%, 75%, and 90% scroll depth milestones
- Prevents duplicate events for the same threshold

#### Read Depth Tracking
Measures how much of an article or content a user has read:
- Tracks at 20%, 40%, 60%, 80%, and 100% of content
- Identifies main content via `article`, `.content`, or `main` selectors

#### Media Interaction Tracking
Monitors video and audio element interactions:
- Play/pause events
- Progress markers (25%, 50%, 75%)
- Completion events
- Includes metadata like duration and timestamp

#### Download Tracking
Automatically tracks file downloads:
- Detects links with `download` attribute
- Identifies common file types: pdf, doc, xls, ppt, zip, etc.
- Captures filename, file type, and link context

#### Copy Action Tracking
Tracks when users copy content:
- Detects text selection and copy events
- Identifies the source context (article, code, table, text)
- Includes preview of copied content

#### Time on Page Tracking
Measures how long users spend on the page:
- Starts timer on page load
- Records duration in milliseconds and seconds on page exit

## Usage

The tracker initializes automatically when the base wem object is available. No manual initialization is required.

```javascript
// The library automatically waits for window.wem to be available
// Custom events can be triggered manually:
window.wem.trackEvent('customEvent', {
  customProperty: 'value'
}, optionalTargetElement);
```

## Configuration

The following properties can be customized:

```javascript
// Customize selectors for content visibility tracking
window.wem.contentVisibilitySelectors = ['.my-custom-selector', '.another-selector'];

// Change the batch size for event processing
window.wem.batchSize = 20; // Default is 10
```

## Requirements

The library requires the base `window.wem` object with an `init` function to be present or eventually loaded on the page.

## Schema Events
[Schemas](./docs/schemas.md) define the structure of events tracked by the library. Here are some examples:
### Content Visibility Event

```json
{
  "eventType": "contentVisibility",
  "properties": {
    "elementId": {
      "type": "string",
      "description": "ID of the visible element"
    },
    "elementType": {
      "type": "string",
      "enum": ["article", "product", "hero", "cta"]
    },
    "visibilityPercentage": {
      "type": "number",
      "description": "Percentage of element visible in viewport"
    }
  },
  "required": ["elementId", "elementType", "visibilityPercentage"]
}
```
