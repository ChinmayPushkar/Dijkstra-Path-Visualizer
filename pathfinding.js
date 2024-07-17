const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const ROWS = 20;
const COLS = 20;
const CELL_SIZE = canvas.width / COLS;
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

let startNode = null;
let endNode = null;
let path = [];
let openSet = [];
let closedSet = [];

// Draw the grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            ctx.fillStyle = 'white';
            if (grid[row][col] === 1) ctx.fillStyle = 'black';
            if (startNode && startNode.row === row && startNode.col === col) ctx.fillStyle = 'green';
            if (endNode && endNode.row === row && endNode.col === col) ctx.fillStyle = 'red';
            if (openSet.some(node => node.row === row && node.col === col)) ctx.fillStyle = 'lightblue';
            if (closedSet.some(node => node.row === row && node.col === col)) ctx.fillStyle = 'lightgrey';
            if (path.some(node => node.row === row && node.col === col)) ctx.fillStyle = 'blue';
            ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

// Add event listeners
canvas.addEventListener('click', (e) => {
    const col = Math.floor(e.offsetX / CELL_SIZE);
    const row = Math.floor(e.offsetY / CELL_SIZE);
    if (!startNode) {
        startNode = { row, col };
        console.log('Start node set:', startNode);
    } else if (!endNode) {
        endNode = { row, col };
        console.log('End node set:', endNode);
    } else {
        grid[row][col] = 1;
        console.log(`Obstacle added at: (${row}, ${col})`);
    }
    drawGrid();
});

function resetGrid() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    startNode = null;
    endNode = null;
    path = [];
    openSet = [];
    closedSet = [];
    drawGrid();
    console.log('Grid reset');
}

function startAlgorithm(algo) {
    console.log(`Starting algorithm: ${algo}`);
    if (!startNode || !endNode) {
        alert("Please set start and end points");
        return;
    }
    if (algo === 'dijkstra') {
        dijkstra();
	}
}

async function dijkstra() {
    const priorityQueue = new MinHeap();
    const distances = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
    const previous = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    distances[startNode.row][startNode.col] = 0;
    priorityQueue.insert({ row: startNode.row, col: startNode.col, distance: 0 });
    openSet.push({ row: startNode.row, col: startNode.col });
    console.log('Starting Dijkstra algorithm');

    while (!priorityQueue.isEmpty()) {
        const { row, col, distance } = priorityQueue.extractMin();
        closedSet.push({ row, col });
        drawGrid();
        await sleep(10); // Delay for visualization

        if (row === endNode.row && col === endNode.col) break; // Found the end node

        getNeighbors(row, col).forEach(({ neighborRow, neighborCol }) => {
            const newDist = distance + 1; // Assuming all edges have weight 1
            if (newDist < distances[neighborRow][neighborCol]) {
                distances[neighborRow][neighborCol] = newDist;
                previous[neighborRow][neighborCol] = { row, col };
                priorityQueue.insert({ row: neighborRow, col: neighborCol, distance: newDist });
                openSet.push({ row: neighborRow, col: neighborCol });
                console.log(`Updated distance for node (${neighborRow}, ${neighborCol}) to ${newDist}`);
            }
        });
    }

    path = reconstructPath(previous);
    drawGrid();
}

function getNeighbors(row, col) {
    const neighbors = [];
    if (row > 0) neighbors.push({ neighborRow: row - 1, neighborCol: col });
    if (row < ROWS - 1) neighbors.push({ neighborRow: row + 1, neighborCol: col });
    if (col > 0) neighbors.push({ neighborRow: row, neighborCol: col - 1 });
    if (col < COLS - 1) neighbors.push({ neighborRow: row, neighborCol: col + 1 });
    return neighbors.filter(({ neighborRow, neighborCol }) => grid[neighborRow][neighborCol] === 0);
}

function reconstructPath(previous) {
    let curr = endNode;
    const path = [];
    while (curr) {
        path.push(curr);
        curr = previous[curr.row][curr.col];
    }
    return path.reverse();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(node) {
        this.heap.push(node);
        this.heapifyUp();
    }

    extractMin() {
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.heapifyDown();
        }
        return min;
    }

    heapifyUp() {
        let index = this.heap.length - 1;
        while (this.hasParent(index) && this.parent(index).distance > this.heap[index].distance) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }

    heapifyDown() {
        let index = 0;
        while (this.hasLeftChild(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);
            if (this.hasRightChild(index) && this.rightChild(index).distance < this.leftChild(index).distance) {
                smallerChildIndex = this.getRightChildIndex(index);
            }
            if (this.heap[index].distance < this.heap[smallerChildIndex].distance) {
                break;
            }
            this.swap(index, smallerChildIndex);
            index = smallerChildIndex;
        }
    }

    hasParent(index) { return this.getParentIndex(index) >= 0; }
    getParentIndex(index) { return Math.floor((index - 1) / 2); }
    parent(index) { return this.heap[this.getParentIndex(index)]; }

    hasLeftChild(index) { return this.getLeftChildIndex(index) < this.heap.length; }
    getLeftChildIndex(index) { return 2 * index + 1; }
    leftChild(index) { return this.heap[this.getLeftChildIndex(index)]; }

    hasRightChild(index) { return this.getRightChildIndex(index) < this.heap.length; }
    getRightChildIndex(index) { return 2 * index + 2; }
    rightChild(index) { return this.heap[this.getRightChildIndex(index)]; }

    swap(indexOne, indexTwo) {
        [this.heap[indexOne], this.heap[indexTwo]] = [this.heap[indexTwo], this.heap[indexOne]];
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

drawGrid();
