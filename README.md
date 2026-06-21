# WebGPU Playground

A collection of interactive WebGPU experiments — shader art, ray marching, and concurrent simulations — rendered directly in the browser with zero dependencies on graphics libraries.

## What's Inside

| Demo | Description |
|------|-------------|
| **Shader Art** (Patterns 1–3) | Fragment-shader visuals using signed-distance functions and cosine palettes |
| **Ray Marching** | Distance-field ray marching with smooth illumination |
| **Conway's Game of Life** | A 64×64 cellular automaton driven entirely by a GPU compute shader, rendered to the screen in real time |

Each page is an independent entry point — open it in a WebGPU-compatible browser and watch the GPU do the work.

## Tech Stack

- **Framework:** [Astro](https://astro.build) (static site generation + page routing)
- **Compute / Render:** Native [WebGPU](https://gpuweb.github.io/gpuweb/) API via TypeScript
- **Shading Language:** [WGSL](https://www.w3.org/TR/WGSL/) (WebGPU Shading Language)
- **Math helpers:** [`wgpu-matrix`](https://github.com/piantist/wgpu-matrix)

## Requirements

A browser with WebGPU support enabled:

| Browser | Version / Status |
|---------|-----------------|
| Chrome / Edge | 113+ (stable) |
| Firefox Nightly | 128+ (behind a flag) |
| Safari | Technology Preview / 17.2+ (behind a flag) |

The homepage includes a live WebGPU capability checker — it will tell you instantly whether your browser can run these demos.

## Learning Resources

The demos are heavily inspired by community WebGPU examples — the best references used while building this project:

- [Game of Life using compute shader (Google Codelab)](https://codelabs.developers.google.com/your-first-webgpu-app#0)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/)
- [awesome-webgpu (curated list)](https://github.com/kishimisu/WebGPU-Fluid-Simulation)

---

Built with curiosity and a lot of `cos` palettes. Enjoy the demos!
