import { initGPU } from "@lib/utils";
import vfShader from "./shader.wgsl?raw"

const GRID_SIZE = 64;
const UPDATE_INTERVAL = 200;
const WORKGROUP_SIZE = 8;

const { canvas, context, device, adapter, canvasFormat } = await initGPU();

canvas.width = Math.min(window.innerWidth, window.innerHeight);
canvas.height = Math.min(window.innerWidth, window.innerHeight);

const vertices = new Float32Array([
    //   X,    Y,
    -0.8,
    -0.8, // Triangle 1 (Blue)
    0.8,
    -0.8,
    0.8,
    0.8,

    -0.8,
    -0.8, // Triangle 2 (Red)
    0.8,
    0.8,
    -0.8,
    0.8,
]);

const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices);

// Create a uniform buffer that describes the grid.
const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
    label: "Grid Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 8,
    attributes: [
        {
            format: "float32x2",
            offset: 0,
            shaderLocation: 0, // Position, see vertex shader
        },
    ],
};

// Create an array representing the active state of each cell.
const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);

// Create a storage buffer to hold the cell state.
const cellStateStorage = [
    device.createBuffer({
        label: "Cell State A",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
        label: "Cell State B",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
];

for (let i = 0; i < cellStateArray.length; ++i) {
    cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
}

device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);
device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);

const cellShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: vfShader,
});

// Create the compute shader that will process the simulation.
const simulationShaderModule = device.createShaderModule({
    label: "Game of Life simulation shader",
    code: `
@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

fn cellActive(x: u32, y: u32) -> u32 {
return cellStateIn[cellIndex(vec2(x, y))];
}

fn cellIndex(cell: vec2u) -> u32 {
return (cell.y % u32(grid.y)) * u32(grid.y) + (cell.x % u32(grid.x));  //to handle edge overflow cases
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE}) // New line
fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
  cellActive(cell.x+1, cell.y) +
  cellActive(cell.x+1, cell.y-1) +
  cellActive(cell.x, cell.y-1) +
  cellActive(cell.x-1, cell.y-1) +
  cellActive(cell.x-1, cell.y) +
  cellActive(cell.x-1, cell.y+1) +
  cellActive(cell.x, cell.y+1);

let i = cellIndex(cell.xy);

// Conway's game of life rules:
switch activeNeighbors {
  case 2u: { // Active cells with 2 neighbors stay active.
    cellStateOut[i] = cellStateIn[i];
  }
  case 3u: { // Cells with 3 neighbors become or stay active.
    cellStateOut[i] = 1u;
  }
  default: { // Cells with < 2 or > 3 neighbors become inactive.
    cellStateOut[i] = 0u;
  }
}
}`,
});

// Create the bind group layout and pipeline layout.
const bindGroupLayout = device.createBindGroupLayout({
    label: "Cell Bind Group Layout",
    entries: [
        {
            binding: 0,
            visibility:
                GPUShaderStage.VERTEX |
                GPUShaderStage.COMPUTE |
                GPUShaderStage.FRAGMENT,
            buffer: {}, // Grid uniform buffer ;//3 default uniform
        },
        {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" }, // Cell state input buffer
        },
        {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }, // Cell state output buffer
        },
    ],
});

const pipelineLayout = device.createPipelineLayout({
    label: "Cell Pipeline Layout",
    bindGroupLayouts: [bindGroupLayout],
});

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: pipelineLayout, // Updated!
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [
            {
                format: canvasFormat,
            },
        ],
    },
});

// Create a bind group to pass the grid uniforms into the pipeline
const bindGroups = [
    device.createBindGroup({
        label: "Cell renderer bind group A",
        layout: bindGroupLayout, // Updated Line
        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer },
            },
            {
                binding: 1,
                resource: { buffer: cellStateStorage[0] },
            },
            {
                binding: 2, // New Entry
                resource: { buffer: cellStateStorage[1] },
            },
        ],
    }),
    device.createBindGroup({
        label: "Cell renderer bind group B",
        layout: bindGroupLayout, // Updated Line

        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer },
            },
            {
                binding: 1,
                resource: { buffer: cellStateStorage[1] },
            },
            {
                binding: 2, // New Entry
                resource: { buffer: cellStateStorage[0] },
            },
        ],
    }),
];

// Create a compute pipeline that updates the game state.
const simulationPipeline = device.createComputePipeline({
    label: "Simulation pipeline",
    layout: pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    },
});

let step = 0; // Track how many simulation steps have been run

// Move all of our rendering code into a function
function updateGrid() {
    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);

    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

    computePass.end();

    step++; // Increment the step count

    // Start a render pass
    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
                storeOp: "store",
            },
        ],
    });

    // Draw the grid.
    pass.setPipeline(cellPipeline);
    pass.setBindGroup(0, bindGroups[step % 2]); // Updated!
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

    // End the render pass and submit the command buffer
    pass.end();
    device.queue.submit([encoder.finish()]);
}

// Schedule updateGrid() to run repeatedly
setInterval(updateGrid, UPDATE_INTERVAL);
