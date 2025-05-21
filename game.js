class Snake {
    constructor() {
        this.body = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.prevPositions = this.body.map(pos => ({ ...pos }));
    }

    move(food) {
        const head = { ...this.body[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.body.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            return true;
        }

        this.body.pop();
        return false;
    }

    changeDirection(newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[this.direction] !== newDirection && opposites[this.nextDirection] !== newDirection) {
            this.nextDirection = newDirection;
        }
    }

    update() {
        this.direction = this.nextDirection;
    }

    checkCollision(gridSize) {
        const head = this.body[0];
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return true;
        }

        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileSize = this.canvas.width / this.gridSize;
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeStep = 150; // Base time step in milliseconds
        this.isGameOver = false;

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Initial render
        this.draw();
    }

    generateFood() {
        const food = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };

        // Ensure food doesn't spawn on snake
        const isOnSnake = this.snake.body.some(segment => 
            segment.x === food.x && segment.y === food.y
        );

        if (isOnSnake) return this.generateFood();
        return food;
    }

    handleKeyPress(event) {
        const keyActions = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };

        const newDirection = keyActions[event.key];
        if (newDirection) {
            event.preventDefault();
            this.snake.changeDirection(newDirection);
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate interpolation factor
        const alpha = this.gameLoop ? Math.min(1, this.deltaTime / this.timeStep) : 1;

        // Draw snake with interpolation
        this.snake.body.forEach((segment, index) => {
            const prevPos = this.snake.prevPositions[index] || segment;
            const x = prevPos.x + (segment.x - prevPos.x) * alpha;
            const y = prevPos.y + (segment.y - prevPos.y) * alpha;

            this.ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
            this.ctx.fillRect(
                x * this.tileSize,
                y * this.tileSize,
                this.tileSize - 1,
                this.tileSize - 1
            );
        });

        // Draw food
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.food.x * this.tileSize,
            this.food.y * this.tileSize,
            this.tileSize - 1,
            this.tileSize - 1
        );
    }

    update() {
        if (this.isGameOver) return;

        // Store previous positions before update
        this.snake.prevPositions = this.snake.body.map(pos => ({ ...pos }));
        this.snake.update();
        
        if (this.snake.checkCollision(this.gridSize)) {
            this.endGame();
            return;
        }

        if (this.snake.move(this.food)) {
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            this.food = this.generateFood();
            this.timeStep = Math.max(50, this.timeStep - 2);
        }
    }

    startGame() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.isGameOver = false;
        document.getElementById('score').textContent = '0';
        this.timeStep = 150;
        this.lastTime = performance.now();
        this.deltaTime = 0;

        const gameStep = (currentTime) => {
            if (!this.gameLoop) return;

            this.deltaTime += currentTime - this.lastTime;
            this.lastTime = currentTime;

            while (this.deltaTime >= this.timeStep) {
                this.update();
                this.deltaTime -= this.timeStep;
            }

            this.draw();
            this.gameLoop = requestAnimationFrame(gameStep);
        };

        this.gameLoop = requestAnimationFrame(gameStep);
        document.getElementById('startBtn').textContent = 'Restart Game';
    }

    endGame() {
        this.isGameOver = true;
        cancelAnimationFrame(this.gameLoop);
        this.gameLoop = null;
        
        // Draw final state
        this.draw();
        
        // Add game over overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        document.getElementById('startBtn').textContent = 'Start Game';
    }
    }


// Initialize game when window loads
window.onload = () => {
    new Game();
};