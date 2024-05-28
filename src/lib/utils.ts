export function deg2Rad(theta: number) : number {
    return theta * Math.PI / 180;
}

export async function initGPU(){
    const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;

    if (!canvas) {
        throw new Error("Canvas not found");
    } 

    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    } else {
        console.log("webgpu available");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No appropriate GPUAdapter found.");
    } else {
        console.log("gpu adapter found");
    }

    const device = await adapter.requestDevice();

    const context = canvas.getContext("webgpu");

    if (!context) {
        throw new Error("could not get webgpu context");
    } 

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
    });

    return {
        canvas,
        context,
        adapter,
        device,
        canvasFormat
    }
}