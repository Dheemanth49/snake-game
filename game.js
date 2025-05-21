class Snake {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.body = [
            { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
            { x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2) },
            { x: Math.floor(gridSize / 2) - 2, y: Math.floor(gridSize / 2) }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.prevPositions = this.body.map(pos => ({ ...pos }));
    }

    move(food) {
        const head = { ...this.body[0] };

        // Wrap around edges
        switch (this.direction) {
            case 'up': 
                head.y = (head.y - 1 + this.gridSize) % this.gridSize;
                break;
            case 'down': 
                head.y = (head.y + 1) % this.gridSize;
                break;
            case 'left': 
                head.x = (head.x - 1 + this.gridSize) % this.gridSize;
                break;
            case 'right': 
                head.x = (head.x + 1) % this.gridSize;
                break;
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

    checkCollision() {
        const head = this.body[0];
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
        
        // Ensure canvas size matches grid size
        this.canvas.width = this.gridSize * this.tileSize;
        this.canvas.height = this.gridSize * this.tileSize;
        
        this.snake = new Snake(this.gridSize);
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeStep = 150; // Base time step in milliseconds
        this.isGameOver = false;
        this.smoothness = 0.2; // Smoothing factor for movement
        this.snakeSpeed = 10; // Base speed multiplier
        this.foodGlow = true; // Food glow effect toggle
        this.foodGlowRadius = 0; // Current glow radius
        this.foodGlowMax = 10; // Maximum glow radius
        this.foodGlowSpeed = 0.5; // Glow speed

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
            'W': 'up',
            'S': 'down',
            'A': 'left',
            'D': 'right'
        };

        // Convert WASD keys to uppercase
        const key = event.key.toUpperCase();
        const newDirection = keyActions[key];
        if (newDirection) {
            event.preventDefault();
            this.snake.changeDirection(newDirection);
        }
    }

    draw() {
        // Clear canvas with slight transparency for trail effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate interpolation factor
        const alpha = this.gameLoop ? Math.min(1, this.deltaTime / this.timeStep) : 1;
        const smoothAlpha = Math.pow(alpha, this.smoothness); // Smoother interpolation

        // Draw snake with smooth interpolation
        this.snake.body.forEach((segment, index) => {
            const prevPos = this.snake.prevPositions[index] || segment;
            const x = prevPos.x + (segment.x - prevPos.x) * smoothAlpha;
            const y = prevPos.y + (segment.y - prevPos.y) * smoothAlpha;
            
            // Calculate segment size based on position
            const size = this.tileSize * (1 - (index / this.snake.body.length) * 0.1);
            
            // Create gradient for snake segments
            const gradient = this.ctx.createLinearGradient(
                x * this.tileSize, 
                y * this.tileSize, 
                (x + 1) * this.tileSize, 
                (y + 1) * this.tileSize
            );
            
            // Head color
            if (index === 0) {
                gradient.addColorStop(0, '#2ecc71');
                gradient.addColorStop(1, '#27ae60');
            } 
            // Tail color
            else {
                gradient.addColorStop(0, '#27ae60');
                gradient.addColorStop(1, '#2ecc71');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                x * this.tileSize,
                y * this.tileSize,
                size - 1,
                size - 1
            );
        });

        // Draw food with glow effect
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.food.x * this.tileSize,
            this.food.y * this.tileSize,
            this.tileSize - 1,
            this.tileSize - 1
        );

        // Add food glow effect
        if (this.foodGlow) {
            this.ctx.beginPath();
            this.ctx.arc(
                (this.food.x + 0.5) * this.tileSize,
                (this.food.y + 0.5) * this.tileSize,
                this.foodGlowRadius,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = `rgba(231, 76, 60, 0.2)`;
            this.ctx.fill();
            
            // Update glow radius
            this.foodGlowRadius += this.foodGlowSpeed;
            if (this.foodGlowRadius > this.foodGlowMax) {
                this.foodGlowRadius = 0;
            }
        }
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
        // Stop any existing game loop
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        // Reset game state
        this.snake = new Snake(this.gridSize);
        this.food = this.generateFood();
        this.score = 0;
        this.isGameOver = false;
        document.getElementById('score').textContent = '0';
        this.timeStep = 150;
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.foodGlowRadius = 0;

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();

        // Start the game loop
        const gameLoop = (timestamp) => {
            if (this.isGameOver) return;

            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            this.deltaTime += deltaTime;

            // Fixed time step game loop
            while (this.deltaTime >= this.timeStep) {
                this.update();
                this.deltaTime -= this.timeStep;
            }

            this.draw();
            this.gameLoop = requestAnimationFrame(gameLoop);
        };

        this.gameLoop = requestAnimationFrame(gameLoop);
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
    const game = new Game();
    // Start the game automatically
    game.startGame();
    
    // Focus the canvas for keyboard input
    game.canvas.focus();
    
    // Make sure the canvas can receive keyboard events
    game.canvas.setAttribute('tabindex', '0');
    
    // Add event listener to the canvas for better keyboard focus
    game.canvas.addEventListener('keydown', (e) => game.handleKeyPress(e));
};