export class VisualEffectsEngine {
    constructor() {
        this.canvas = document.getElementById('effects-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.effects = new Map();
        this.animationFrame = null;
        
        this.setupCanvas();
        this.startRenderLoop();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
    }

    // Generate visual properties based on datapoint value and type
    generateVisualProperties(datapoint) {
        const { value, data_type, rarity } = datapoint;
        const properties = {};

        // Convert value to numeric for calculations
        let numericValue = 0;
        if (data_type === 'number') {
            numericValue = parseFloat(value) || 0;
        } else if (data_type === 'string') {
            numericValue = this.stringToNumber(value);
        } else if (data_type === 'date') {
            numericValue = new Date(value).getTime() % 1000000;
        }

        // Generate color based on value
        const hue = (numericValue * 137.508) % 360; // Golden angle
        const saturation = 50 + (rarity * 50);
        const lightness = 40 + (rarity * 30);
        
        properties.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        properties.intensity = rarity;
        properties.frequency = (numericValue % 100) / 100;
        properties.type = this.getEffectType(data_type, numericValue);

        return properties;
    }

    getEffectType(dataType, numericValue) {
        const types = ['glow', 'pulse', 'rainbow', 'shake', 'particles'];
        const index = Math.floor((numericValue + dataType.length) % types.length);
        return types[index];
    }

    stringToNumber(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Apply visual effect to an image element
    applyEffectToImage(imageElement, datapoints) {
        if (!imageElement) return;

        let filters = [];
        let animations = [];
        let borderEffects = [];

        datapoints.forEach(datapoint => {
            const props = datapoint.visual_properties;
            const intensity = datapoint.visual_intensity || 0.5;

            switch (props.type) {
                case 'glow':
                    filters.push(`drop-shadow(0 0 ${10 * intensity}px ${props.color})`);
                    break;
                case 'pulse':
                    animations.push('pulse');
                    break;
                case 'rainbow':
                    borderEffects.push('effect-rainbow');
                    break;
                case 'shake':
                    if (intensity > 0.7) animations.push('shake');
                    break;
                case 'particles':
                    this.createParticleEffect(imageElement, props, intensity);
                    break;
            }

            // Color adjustments based on datapoint
            const colorShift = props.frequency * 360;
            filters.push(`hue-rotate(${colorShift}deg)`);
            filters.push(`saturate(${1 + intensity})`);
            filters.push(`brightness(${0.8 + intensity * 0.4})`);
        });

        // Apply filters
        imageElement.style.filter = filters.join(' ');
        
        // Apply CSS classes for animations
        imageElement.className = imageElement.className.replace(/effect-\w+/g, '');
        borderEffects.forEach(effect => imageElement.classList.add(effect));
        
        if (animations.length > 0) {
            imageElement.classList.add('evolved');
        }
    }

    createParticleEffect(element, properties, intensity) {
        const rect = element.getBoundingClientRect();
        const particleCount = Math.floor(intensity * 10);

        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.background = properties.color;
                particle.style.left = `${rect.left + Math.random() * rect.width}px`;
                particle.style.top = `${rect.top + rect.height}px`;
                
                document.body.appendChild(particle);

                setTimeout(() => {
                    particle.remove();
                }, 3000);
            }, i * 200);
        }
    }

    // Create background ambient effects
    createAmbientEffect(datapoints) {
        if (!this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        datapoints.forEach((datapoint, index) => {
            const props = datapoint.visual_properties;
            const intensity = datapoint.visual_intensity || 0.1;
            
            // Create floating orbs based on datapoints
            const x = (index * 150) % this.canvas.width + Math.sin(Date.now() * 0.001 + index) * 50;
            const y = this.canvas.height * 0.3 + Math.cos(Date.now() * 0.002 + index) * 100;
            const radius = 20 + intensity * 30;
            
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, props.color + '40');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    startRenderLoop() {
        const render = () => {
            // Render ambient effects here if needed
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export default new VisualEffectsEngine();

