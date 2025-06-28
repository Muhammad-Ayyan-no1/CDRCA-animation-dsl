# CDRCA Animation DSL

**Custom DSL Renderer for Cartoon Animation**

In 2025 the easiest way to do 2.5D scenes animations is manuall frame by frame drawing, this repo fixes it

A domain-specific language designed to make cartoon creation accessible through high-level scripting while maintaining professional-grade output capabilities.

## What is CDRCA?

CDRCA is a domain-specific language (DSL) that translates simple, time-based animation commands into 3D frames. It allows teams to create sophisticated animations using intuitive syntax that automatically handles complex 3D transformations and rendering.

### Key Features

- **Hand-drawn Style Rendering** - Renders 3D geometry as cartoon-style visuals via THREE.js or external renderers
- **Time-based Animation System** - Write animations using timing commands like "do that action after this seconds"
- **Modular PROP System** - Define reusable objects, behaviors, and actions
- **Advanced Simulations** - Planned physics, fluid dynamics, and particle systems with local hosting
- **Multi-platform** - Web-based for basic scenes, Node.js backend for full features
- **Export Flexibility** - Export to Blender or other 3D software as frame-by-frame object lists

## How It Works

CDRCA files (.cdrca) are parsed and translated to JavaScript, then rendered/tracked by the system at Renderer.js. The high-level code you write gets converted into 3D frames with proper morphing and interpolation between keyframes.

## DSL Syntax Overview

### Headers and Organization

```cdrca
!--- HEADER_TYPE :: Comment ---
Content goes here
!---END---

:: SUB HEADER :: Comment
Sub-content
:: END
```

### Core Statements

**Imports**

```cdrca
@IMPORT FilePath
@AddImport FilePath
```

**JavaScript Integration**

```cdrca
JS {
  // JavaScript code here
}
```

**PROP Definitions (Object Types)**

```cdrca
def PROP PROP_NAME [abstracts OTHER_PROP] {
  // JS code defining the prop
}

use PROP_NAME(params) as ALIAS
```

**Actions (What Objects Do)**

```cdrca
def ACTION ACTION_NAME PROP_NAME METHOD_NAME PARAMS [PROP_NAME METHOD_NAME PARAMS ...]
add new actionName STAY_TIME LERP_TIME
```

**Scene Defaults**

```cdrca
gradientMap :: value
BGcolor :: color
```

**Comments**

```cdrca
// Comment text
```

### Example Structure

```cdrca
!--- PROP ABC :: Define properties ---
def PROP MyProp {
  console.log("hi");
}

:: SUB HEADER :: Usage
use MyProp(params) as Alias
:: END
!---END---
```

## Team Workflow

### Non-Technical Team (Scene Creators)

- Write .cdrca scene files using simple timing and action commands
- Focus on storytelling, character movements, and scene composition
- Use pre-defined PROPs created by the technical team

### Technical Team (PROP Developers)

- Create the PROP system - define what each object is and what actions it can perform
- Implement complex behaviors and rendering logic
- Build reusable components for scene creators

This separation allows non-technical team members to create scenes while a small technical team handles the underlying system architecture.

## Rendering Options

### Web-Based (Basic)

- Completely web-based rendering
- Suitable for basic scenes
- Limited simulation capabilities

### Node.js Backend (Full-Featured)

- Full simulation support (physics, fluids, etc.)
- Audio integration and synchronization
- High-quality rendering pipeline
- Export capabilities to external formats

## Output Formats

- **THREE.js Integration** - Direct web rendering
- **Blender Import** - As frame-by-frame object lists over time
- **External Renderers** - Compatible with various 3D software
- **Frame Sequences** - Morphed 3D frames for animation

## Open Source

CDRCA is fully open-sourced under the IOSL license. See LICENSE.md for complete licensing details.

The project aims to make cartoon animation more accessible by providing a high-level abstraction over complex 3D animation workflows, while still maintaining the flexibility to export to professional 3D software when needed.
