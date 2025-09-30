// TCG GAME ENGINE WITH BACKEND CONNECTION
class TCGGame {
    constructor() {
        this.backendUrl = "https://tt-tcg-backend.onrender.com";
        this.socket = null;
        this.gameId = "tiktok_live_room";
        this.playerType = "viewers";
        this.isConnected = false;
        
        this.initializeGame();
    }

    async initializeGame() {
        await this.connectToBackend();
        this.setupEventListeners();
        this.showMessage("🎴 Connecting to game server...");
    }

    // CONNECT TO BACKEND
    async connectToBackend() {
        try {
            // Connect to Socket.io server
            this.socket = io(this.backendUrl, {
                transports: ['websocket', 'polling']
            });

            // Socket event handlers
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.showMessage("✅ Connected to game server!");
                this.joinGame();
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.showMessage("❌ Disconnected from server");
            });

            this.socket.on('gameState', (gameState) => {
                this.handleGameState(gameState);
            });

            this.socket.on('cardPlayed', (data) => {
                this.showMessage(data.message);
                this.handleGameState(data.gameState);
            });

            this.socket.on('cardDrawn', (data) => {
                this.handleGameState(data.gameState);
                this.showMessage(`🃏 ${data.playerId} drew a card`);
            });

            this.socket.on('turnEnded', (data) => {
                this.handleGameState(data.gameState);
                this.showMessage(data.message);
            });

            this.socket.on('tiktokGiftEffect', (data) => {
                this.showMessage(`🎁 ${data.viewerName} sent gift: ${data.effect}`);
                this.handleGameState(data.gameState);
            });

            this.socket.on('error', (data) => {
                this.showMessage(`❌ Error: ${data.message}`);
            });

        } catch (error) {
            console.error('Connection error:', error);
            this.showMessage("❌ Failed to connect to server");
        }
    }

    // JOIN GAME ROOM
    joinGame() {
        if (this.socket && this.isConnected) {
            this.socket.emit('joinGame', {
                gameId: this.gameId,
                playerType: this.playerType
            });
        }
    }

    // HANDLE GAME STATE FROM BACKEND
    handleGameState(gameState) {
        if (!gameState) return;

        this.gameState = gameState;
        
        // Update UI dengan data dari backend
        this.updateHealthBars();
        this.updateManaDisplay();
        this.updateTurnIndicator();
        this.updateBoardDisplays();
        this.updateHandDisplay();
        this.updateDeckCount();
    }

    // PLAY CARD (Send to backend)
    playCard(cardId) {
        if (!this.isConnected) {
            this.showMessage("❌ Not connected to server");
            return;
        }

        if (this.gameState.currentPlayer === this.playerType) {
            this.socket.emit('playCard', {
                gameId: this.gameId,
                playerId: this.playerType,
                cardId: cardId
            });
        } else {
            this.showMessage("⏳ Wait for your turn!");
        }
    }

    // DRAW CARD (Send to backend)
    drawCard() {
        if (!this.isConnected) return;
        
        this.socket.emit('drawCard', {
            gameId: this.gameId,
            playerId: this.playerType
        });
    }

    // END TURN (Send to backend)
    endTurn() {
        if (!this.isConnected) return;
        
        this.socket.emit('endTurn', {
            gameId: this.gameId
        });
    }

    // TIKTOK GIFT SIMULATION (For testing)
    simulateTikTokGift(giftType, viewerName = "TestViewer") {
        if (!this.isConnected) return;
        
        this.socket.emit('tiktokGift', {
            gameId: this.gameId,
            giftType: giftType,
            viewerName: viewerName
        });
    }

    // UPDATE DISPLAY METHODS (Sama seperti sebelumnya)
    updateHealthBars() {
        if (!this.gameState) return;
        
        const streamerHealth = this.gameState.players.streamer.health;
        const viewersHealth = this.gameState.players.viewers.health;
        
        document.getElementById('opponent-health').style.width = (streamerHealth / 30 * 100) + '%';
        document.getElementById('player-health').style.width = (viewersHealth / 30 * 100) + '%';
        
        document.getElementById('opponent-health-text').textContent = `${streamerHealth}/30`;
        document.getElementById('player-health-text').textContent = `${viewersHealth}/30`;
    }

    updateManaDisplay() {
        if (!this.gameState) return;
        
        const player = this.gameState.currentPlayer;
        const mana = this.gameState.players[player].mana;
        const maxMana = this.gameState.players[player].maxMana;
        
        document.getElementById('current-mana').textContent = mana;
        document.getElementById('max-mana').textContent = maxMana;
    }

    updateTurnIndicator() {
        if (!this.gameState) return;
        
        document.getElementById('turn-indicator').textContent = 
            `Turn ${this.gameState.turn} - ${this.gameState.currentPlayer.toUpperCase()}`;
    }

    updateBoardDisplays() {
        if (!this.gameState) return;
        
        this.updateBoardDisplay('streamer', document.getElementById('opponent-board'));
        this.updateBoardDisplay('viewers', document.getElementById('player-board'));
    }

    updateBoardDisplay(player, container) {
        if (!this.gameState) return;
        
        container.innerHTML = '';
        this.gameState.board[player].forEach((card, index) => {
            const cardElement = this.createCardElement(card, true);
            container.appendChild(cardElement);
        });
    }

    updateHandDisplay() {
        if (!this.gameState) return;
        
        const handContainer = document.getElementById('player-hand');
        handContainer.innerHTML = '';
        
        this.gameState.hands.viewers.forEach(cardId => {
            const cardData = this.getCardData(cardId);
            const cardElement = this.createCardElement(cardData, false);
            handContainer.appendChild(cardElement);
        });
        
        document.getElementById('hand-count').textContent = this.gameState.hands.viewers.length;
    }

    updateDeckCount() {
        if (!this.gameState) return;
        
        document.getElementById('deck-count').textContent = this.gameState.decks.viewers.length;
    }

    // CARD DATABASE (Sama seperti sebelumnya)
    getCardData(cardId) {
        const cards = {
            'young_dragon': { id: 'young_dragon', name: 'Young Dragon', type: 'creature', cost: 3, attack: 2, health: 3, effect: 'Flying', emoji: '🐲' },
            'fire_imp': { id: 'fire_imp', name: 'Fire Imp', type: 'creature', cost: 2, attack: 3, health: 1, effect: 'Quick', emoji: '👺' },
            'forest_guardian': { id: 'forest_guardian', name: 'Forest Guardian', type: 'creature', cost: 4, attack: 1, health: 5, effect: 'Taunt', emoji: '🌳' },
            'fireball': { id: 'fireball', name: 'Fireball', type: 'spell', cost: 2, effect: 'Deal 3 damage', emoji: '🔥' },
            'healing_light': { id: 'healing_light', name: 'Healing Light', type: 'spell', cost: 1, effect: 'Restore 4 health', emoji: '✨' },
            'lightning_bolt': { id: 'lightning_bolt', name: 'Lightning Bolt', type: 'spell', cost: 1, effect: 'Deal 2 damage', emoji: '⚡' },
            'mana_crystal': { id: 'mana_crystal', name: 'Mana Crystal', type: 'support', cost: 0, effect: '+1 max mana', emoji: '💎' },
            'protective_ward': { id: 'protective_ward', name: 'Protective Ward', type: 'support', cost: 1, effect: 'Prevent 3 damage', emoji: '🛡️' }
        };
        return cards[cardId] || { id: cardId, name: 'Unknown Card', type: 'spell', cost: 0, effect: 'Unknown effect' };
    }

    // CARD ELEMENT CREATION (Sama seperti sebelumnya)
    createCardElement(cardData, onBoard = false) {
        const card = document.createElement('div');
        card.className = `card ${cardData.type} ${onBoard ? 'on-board' : 'in-hand'}`;
        card.setAttribute('data-card-id', cardData.id);
        
        let cardHTML = `
            <div class="card-cost">${cardData.cost}</div>
            <div class="card-name">${cardData.name}</div>
            <div class="card-effect">${cardData.effect}</div>
        `;
        
        if (cardData.type === 'creature') {
            const health = onBoard ? cardData.currentHealth : cardData.health;
            cardHTML += `
                <div class="card-stats">
                    <div class="card-attack">${cardData.attack}⚔️</div>
                    <div class="card-health">${health}❤️</div>
                </div>
            `;
        }
        
        card.innerHTML = cardHTML;
        
        if (!onBoard) {
            card.addEventListener('click', () => this.playCard(cardData.id));
        }
        
        card.addEventListener('mouseenter', (e) => this.showCardTooltip(e, cardData));
        card.addEventListener('mouseleave', () => this.hideCardTooltip());
        
        return card;
    }

    // EVENT LISTENERS (Updated)
    setupEventListeners() {
        document.getElementById('end-turn-btn').addEventListener('click', () => this.endTurn());
        document.getElementById('draw-card-btn').addEventListener('click', () => this.drawCard());
        
        // TikTok gift simulation (testing)
        document.addEventListener('keypress', (e) => {
            if (e.key === '1') this.simulateTikTokGift('rose');
            else if (e.key === '2') this.simulateTikTokGift('rocket');
            else if (e.key === '3') this.simulateTikTokGift('lion');
        });
    }

    showCardTooltip(event, cardData) {
        // Same as before
    }

    hideCardTooltip() {
        // Same as before
    }

    showMessage(message) {
        const status = document.getElementById('game-status');
        status.textContent = message;
        status.classList.add('pulse');
        
        setTimeout(() => {
            status.classList.remove('pulse');
        }, 3000);
    }
}

// INITIALIZE GAME
let tcgGame;

document.addEventListener('DOMContentLoaded', () => {
    tcgGame = new TCGGame();
    console.log('🎴 TikTok TCG Live - Real-time Version Ready!');
});
