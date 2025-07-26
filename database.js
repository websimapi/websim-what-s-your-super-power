import { WebsimSocket } from '@websim/use-query';

export class DatabaseManager {
    constructor() {
        this.room = new WebsimSocket();
    }

    async getCurrentUser() {
        return await window.websim.getCurrentUser();
    }

    async createUser(identity) {
        const currentUser = await this.getCurrentUser();
        
        // Generate AI image for user's identity
        const imageResult = await window.websim.imageGen({
            prompt: `A powerful, mystical avatar representing: ${identity}. Glowing energy, ethereal, fantasy art style, portrait view`,
            aspect_ratio: "1:1"
        });

        const user = await this.room.collection('users').upsert({
            id: currentUser.id,
            identity: identity,
            base_image_url: imageResult.url,
            evolution_level: 1,
            last_evolution: new Date().toISOString()
        });

        return user;
    }

    async getUser(userId) {
        const users = await this.room.collection('users').filter({ id: userId }).getList();
        return users[0] || null;
    }

    async generateNewDatapoint() {
        // Use AI to generate creative datapoint concepts
        const datapointTypes = [
            { type: 'number', prompt: 'a mystical number with special meaning' },
            { type: 'string', prompt: 'an ancient word or phrase with power' },
            { type: 'date', prompt: 'a significant date in cosmic history' },
            { type: 'concept', prompt: 'an abstract concept made tangible' }
        ];

        const randomType = datapointTypes[Math.floor(Math.random() * datapointTypes.length)];
        
        const aiResponse = await window.websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Generate a unique datapoint for a mystical evolution game. Create ${randomType.prompt}.
                    Respond with JSON in this format:
                    {
                        "name": "descriptive name",
                        "value": "the actual value",
                        "data_type": "${randomType.type}",
                        "rarity": 0.1 to 1.0,
                        "description": "mystical description of its power"
                    }`
                },
                {
                    role: "user",
                    content: "Generate a new mystical datapoint"
                }
            ],
            json: true
        });

        const datapointData = JSON.parse(aiResponse.content);
        
        // Generate visual properties based on the datapoint
        const visualProperties = this.generateVisualProperties(datapointData);
        
        const datapoint = await this.room.collection('datapoints').create({
            name: datapointData.name,
            data_type: datapointData.data_type,
            value: datapointData.value.toString(),
            rarity: datapointData.rarity,
            visual_properties: visualProperties
        });

        return datapoint;
    }

    generateVisualProperties(datapointData) {
        const { value, data_type, rarity } = datapointData;
        
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
        const hue = (numericValue * 137.508) % 360;
        const saturation = 50 + (rarity * 50);
        const lightness = 40 + (rarity * 30);
        
        const effectTypes = ['glow', 'pulse', 'rainbow', 'shake', 'particles'];
        const effectType = effectTypes[Math.floor((numericValue + data_type.length) % effectTypes.length)];

        return {
            color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            intensity: rarity,
            frequency: (numericValue % 100) / 100,
            type: effectType
        };
    }

    stringToNumber(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    async assignDatapointToUser(userId, datapointId) {
        const datapoint = await this.room.collection('datapoints').filter({ id: datapointId }).getList();
        if (!datapoint[0]) return null;

        const assignment = await this.room.collection('user_datapoints').upsert({
            id: `${userId}-${datapointId}`,
            user_id: userId,
            datapoint_id: datapointId,
            acquired_at: new Date().toISOString(),
            visual_intensity: Math.random() * 0.5 + 0.3 // Random intensity between 0.3-0.8
        });

        return assignment;
    }

    async getUserDatapoints(userId) {
        const query = `
            SELECT 
                d.id,
                d.name,
                d.data_type,
                d.value,
                d.rarity,
                d.visual_properties,
                ud.visual_intensity,
                ud.acquired_at
            FROM public.user_datapoints ud
            JOIN public.datapoints d ON ud.datapoint_id = d.id
            WHERE ud.user_id = $1
            ORDER BY ud.acquired_at DESC
        `;
        
        const datapoints = await this.room.query(query, [userId]);
        return datapoints;
    }

    async getAllDatapoints() {
        return await this.room.collection('datapoints').getList();
    }

    async evolveUser(userId) {
        const user = await this.getUser(userId);
        if (!user) return null;

        const lastEvolution = new Date(user.last_evolution);
        const now = new Date();
        const timeSinceLastEvolution = now - lastEvolution;
        const minutesSinceLastEvolution = timeSinceLastEvolution / (1000 * 60);

        // Allow evolution every 5 minutes (for demo purposes)
        if (minutesSinceLastEvolution < 5) {
            return { canEvolve: false, timeRemaining: 5 - minutesSinceLastEvolution };
        }

        // Get a random existing datapoint or create a new one
        let datapoints = await this.getAllDatapoints();
        let selectedDatapoint;

        if (datapoints.length === 0 || Math.random() < 0.3) {
            // 30% chance to create new datapoint or if none exist
            selectedDatapoint = await this.generateNewDatapoint();
        } else {
            // 70% chance to use existing datapoint
            selectedDatapoint = datapoints[Math.floor(Math.random() * datapoints.length)];
        }

        // Assign datapoint to user
        await this.assignDatapointToUser(userId, selectedDatapoint.id);

        // Update user's evolution level and timestamp
        const updatedUser = await this.room.collection('users').upsert({
            id: userId,
            evolution_level: user.evolution_level + 1,
            last_evolution: now.toISOString()
        });

        return { 
            canEvolve: true, 
            user: updatedUser, 
            newDatapoint: selectedDatapoint 
        };
    }
}

export default new DatabaseManager();

