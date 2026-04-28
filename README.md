# GridSlicer — Image Grid Slicer Application

A production-grade, enterprise-ready image slicing tool. Upload an image, divide it into grid-based or custom rectangular regions, preview all slices, and export as ZIP, individual files, or a combined sprite sheet.

![GridSlicer Preview](https://via.placeholder.com/800x400/18181c/c6f135?text=GridSlicer)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repo
git clone https://github.com/your-org/image-grid-slicer
cd image-grid-slicer

# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production bundle locally
```

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS (custom design system) |
| State | Zustand (with devtools) |
| Canvas | HTML5 Canvas API + OffscreenCanvas |
| Compression | JSZip + FileSaver.js |
| Testing | Jest + React Testing Library |
| Linting | ESLint + Prettier |

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/                  # Atomic UI components
│   │   ├── Button.tsx
│   │   ├── Slider.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   └── ErrorBoundary.tsx
│   ├── ImageUploader/       # Drag & drop upload zone
│   ├── GridControls/        # Rows/cols/padding sliders
│   ├── CanvasEditor/        # Grid overlay renderer
│   ├── CustomCrop/          # Interactive region drawing
│   ├── PreviewPanel/        # Slice thumbnail grid
│   └── ExportPanel/         # Export format + download
├── hooks/
│   ├── useImageLoader.ts    # File validation + loading
│   ├── useGridCalculator.ts # Pixel-precise cell math
│   └── useSlicer.ts         # Orchestrates processing
├── services/
│   ├── imageProcessor.ts    # Canvas slicing engine
│   └── exportService.ts     # ZIP / individual / spritesheet
├── store/
│   └── slicerStore.ts       # Zustand global store
├── types/
│   └── index.ts             # All TypeScript types
├── utils/
│   └── index.ts             # Formatting + math helpers
└── tests/
    ├── gridCalculator.test.ts
    ├── slicerStore.test.ts
    └── utils.test.ts
```

### Data Flow

```
File Drop/Pick
    │
    ▼
useImageLoader (validate → ObjectURL → dimensions)
    │
    ▼
Zustand Store ──────────────────────┐
    │                               │
    ▼                               ▼
CanvasEditor               CustomCropEditor
(grid overlay)          (interactive regions)
    │                               │
    └──────────┬────────────────────┘
               │
               ▼
         useSlicer.processSlices()
               │
               ▼
      imageProcessor.ts
   (createImageBitmap → OffscreenCanvas → Blob)
               │
               ▼
         Slice[] → PreviewPanel
               │
               ▼
         exportService.ts
         (JSZip / FileSaver)
```

---

## 🧩 Core Features

### Grid Mode
- Rows (1–20) × Columns (1–20)
- Live grid overlay on canvas
- Pixel-precise cell computation (no bleeding)
- Adjustable padding between cells

### Custom Region Mode
- Draw rectangular regions by clicking and dragging
- Move regions after drawing
- Resize from corner handles
- Label each region for named exports

### Processing Engine
- Uses `createImageBitmap` for efficient memory usage
- `OffscreenCanvas` for thread-safe rendering
- Floating-point precision handled safely (safeFloor/safeCeil)
- Last row/column absorbs rounding remainder

### Export
| Type | Output |
|------|--------|
| ZIP | `slices/slice_r01_c01.png` inside a `.zip` |
| Individual | Sequential browser downloads |
| Sprite Sheet | Horizontal strip of all slices |

Supported formats: PNG, JPEG, WebP (with quality control)

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm test -- --coverage  # Coverage report
```

### Test Coverage

| Module | Tests |
|--------|-------|
| `gridCalculator` | Cell count, dimensions, no-bleed, edge cases |
| `slicerStore` | CRUD operations, reset, error state |
| `utils` | formatBytes, formatDimensions, clamp |

---

## ⚡ Performance

- **OffscreenCanvas**: Avoids blocking the main thread
- **createImageBitmap**: Efficient GPU-decoded source
- **Lazy image loading**: Slice thumbnails load on demand
- **Object URL cleanup**: Revoked on reset to prevent leaks
- **Zustand**: Minimal re-renders via selector isolation

---

## 🐳 Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

```bash
docker build -t grid-slicer .
docker run -p 8080:80 grid-slicer
```

---

## 🔐 Security

- File type validated by MIME type (not extension)
- File size capped at 20MB
- File names sanitized (alphanumeric + `._-` only)
- No file execution — all processing in-browser
- Object URLs revoked on cleanup

---

## 🎨 Design System

The UI uses a custom dark industrial aesthetic:

| Token | Value |
|-------|-------|
| Background | `#18181c` (obsidian-950) |
| Surface | `#3a3b41` (obsidian-900) |
| Accent | `#c6f135` (acid green) |
| Danger | `#ff5c5c` (coral) |
| Font Display | Space Grotesk |
| Font Body | DM Sans |
| Font Mono | JetBrains Mono |

---

## 📜 License

MIT © 2024
