const { Engine, Render, Runner, World, Bodies, Body, Mouse, MouseConstraint, Events } = Matter
const engine = Engine.create()
engine.world.gravity.y = 0
const { world } = engine
const width = window.innerWidth
const height = window.innerHeight
const cellsVertical = 8
const cellsHorizontal = 10
const unitLengthX = width / cellsHorizontal
const unitLengthY = height / cellsVertical
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width,
        height,
    }
})
Render.run(render)
Runner.run(Runner.create(), engine)

World.add(world, MouseConstraint.create(engine, {
    mouse: Mouse.create(render.canvas)
}))

// Walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 40, {isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 40, {isStatic: true}),
    Bodies.rectangle(0, height / 2, 40,  height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, 40, height, {isStatic: true}),
]

World.add(world, walls)

// Maze Generation
const shuffle = (array) => {
    let counter = array.length

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter)

        counter--

        const temp = array[counter]
        array[counter] = array[index]
        array[index] = temp
    }

    return array
}

const grid = Array(cellsVertical)
    .fill(null)
    .map(element => Array(cellsHorizontal).fill(false))

const verticals = Array(cellsVertical)
    .fill(null)
    .map(element => Array(cellsHorizontal - 1).fill(false))

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(element => Array(cellsHorizontal).fill(false))

const startRow = Math.floor(Math.random() * cellsVertical)
const startColumn = Math.floor(Math.random() * cellsHorizontal)

const stepThroughCell = (row, column) => {
    if (grid[row][column]) return

    grid[row][column] = true

    const neighbors = shuffle([
        [row + 1, column, 'down'],
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row, column - 1, 'left'],
    ])

    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor

        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) continue

        if (grid[nextRow][nextColumn]) continue

        if (direction === 'left') verticals[row][column - 1] = true

        else if (direction === 'right') verticals[row][column] = true

        else if (direction === 'up') horizontals[row - 1][column] = true

        else if (direction === 'down') horizontals[row][column] = true

        stepThroughCell(nextRow, nextColumn)
    }
}

stepThroughCell(startColumn, startRow)

horizontals.forEach((row, rowIndex)=> {
    row.forEach((open, columnIndex) => {
        if (open) return

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5, 
            {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'red',
                },
            }
        )

        World.add(world, wall)
    })
})

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) return

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'red'
                },
            },
        )
        
        World.add(world, wall)
    })
})

const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
        isStatic: true,
        label: 'goal',
        render: {
            fillStyle: 'green'
        },
    }
)

World.add(world, goal)

// Ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: 'blue'
        },
    }
)

World.add(world, ball)

// Detecting Input

document.addEventListener('keydown', e => {
    const { x, y } = ball.velocity
    
    if (e.key === 'ArrowUp') {
        Body.setVelocity(ball, {x, y: y - 5})
    }
    if (e.key === 'ArrowDown') {
        Body.setVelocity(ball, {x, y: y + 5})
    }
    if (e.key === 'ArrowLeft') {
        Body.setVelocity(ball, {x: x - 5, y})
    }
    if (e.key === 'ArrowRight') {
        Body.setVelocity(ball, {x: x + 5, y})
    }
})

// Win Condition

Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(collision => {
        const labels = ['ball', 'goal']

        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            console.log('User won!')
            world.gravity.y = 1
            world.bodies.forEach(body => {
                if (body.label === 'wall') Body.setStatic(body, false)
            })
        }
    })
})