const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, Caretaker, Animal, Requirements, Markers } = require('./database/setup');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// JWT Authentication Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.' 
        });
    }
    
    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // load full caretaker from DB and attach to request for role/ownership checks
        Caretaker.findByPk(decoded.id).then(caretaker => {
            if (!caretaker) return res.status(401).json({ error: 'Invalid token user' });
            req.caretaker = caretaker;
            next();
        }).catch(err => next(err));
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired. Please log in again.' 
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token. Please log in again.' 
            });
        } else {
            return res.status(401).json({ 
                error: 'Token verification failed.' 
            });
        }
    }
}

// Authorization helper middleware: pass allowed roles (e.g. 'admin','vet','assistant')
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.caretaker) return res.status(401).json({ error: 'Not authenticated' });
        if (allowedRoles.includes(req.caretaker.role)) return next();
        return res.status(403).json({ error: 'Invalid role' });
    };
}

// Test database connection
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Animal Shelter API',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/register',
            login: 'POST /api/login',
            animals: 'GET /api/animals (requires auth)',
            animal: 'GET /api/animals/:id (requires auth)',
            requirements: 'GET /api/animal/:id/requirements (requires auth)',
            markers: 'GET /api/animal/:id/markers (requires auth)',
            createAnimal: 'POST /api/animals (requires auth)',
            createRequirement: 'POST /api/animal/:id/requirement (requires auth)',
            createMarker: 'POST /api/animal/:id/marker (requires auth)',
            updateAnimal: 'PUT /api/animals/:id (requires auth)',
            updateRequirement: 'PUT /api/animal/:id/requirement (requires auth)',
            updateMarker: 'PUT /api/animal/:id/marker (requires auth)',
            deleteAnimal: 'DELETE /api/animals/:id (requires auth)'
        }
    });
});


// AUTHENTICATION ROUTES

// POST /api/register - Register new caretaker
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                error: 'Name, email, password, and role are required' 
            });
        }
        
        // Check if caretaker exists
        const existingCaretaker = await Caretaker.findOne({ where: { email } });
        if (existingCaretaker) {
            return res.status(400).json({ 
                error: 'Caretaker with this email already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create caretaker
        const newCaretaker = await Caretaker.create({
            name,
            email,
            password: hashedPassword,
            role
        });
        
        res.status(201).json({
            message: 'Caretaker registered successfully',
            caretaker: {
                id: newCaretaker.id,
                name: newCaretaker.name,
                email: newCaretaker.email,
                role: newCaretaker.role
            }
        });
        
    } catch (error) {
        console.error('Error registering caretaker:', error);
        res.status(500).json({ error: 'Failed to register caretaker' });
    }
});

// POST /api/login - Caretaker login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }
        
        // Find caretaker
        const caretaker = await Caretaker.findOne({ where: { email } });
        if (!caretaker) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, caretaker.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }
        
        // Generate JWT token (include role for RBAC)
        const token = jwt.sign(
            { 
                id: caretaker.id, 
                name: caretaker.name, 
                email: caretaker.email,
                role: caretaker.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.json({
            message: 'Login successful',
            token: token,
            caretaker: {
                id: caretaker.id,
                name: caretaker.name,
                email: caretaker.email
            }
        });
        
    } catch (error) {
        console.error('Error logging in caretaker:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// ANIMAL ROUTES

// GET /api/animals - Get all animals for authenticated caretaker
app.get('/api/animals', requireAuth, async (req, res) => {
    try {
        let animals;
        // assistants only see their own animals
        if (req.caretaker.role === 'assistant') {
            animals = await Animal.findAll({ where: { caretakerId: req.caretaker.id }, order: [['id', 'ASC']] });
        } else {
            // vets and admins see all
            animals = await Animal.findAll({ order: [['id', 'ASC']] });
        }

        res.json({
            message: 'Animals retrieved successfully',
            animals: animals,
            total: animals.length
        });

    } catch (error) {
        console.error('Error fetching animals:', error);
        res.status(500).json({ error: 'Failed to fetch animals' });
    }
});

// GET /api/animals/:id - Get single animal
app.get('/api/animals/:id', requireAuth, async (req, res) => {
    try {
        let animal;
        if (req.caretaker.role === 'assistant') {
            animal = await Animal.findOne({ where: { id: req.params.id, caretakerId: req.caretaker.id } });
        } else {
            animal = await Animal.findByPk(req.params.id);
        }

        if (!animal) return res.status(404).json({ error: 'Animal not found' });
        res.json(animal);

    } catch (error) {
        console.error('Error fetching animal:', error);
        res.status(500).json({ error: 'Failed to fetch animal' });
    }
});

//GET /api/animals/:id/requirements - Get health requirements for animal
app.get('/api/animals/:id/requirements', requireAuth, authorize('admin','vet','assistant'), async (req, res) => {
    try {
        let animal;
        if (req.caretaker.role === 'assistant') {
            animal = await Animal.findOne({ where: { id: req.params.id, caretakerId: req.caretaker.id } });
        } else {
            animal = await Animal.findByPk(req.params.id);
        }

        if (!animal) return res.status(404).json({ error: 'Animal not found' });

        const requirement = await Requirements.findOne({ where: { animalId: animal.id } });
        res.json(requirement);

    } catch (error) {
        console.error('Error fetching health requirements:', error);
        res.status(500).json({ error: 'Failed to fetch health requirements' });
    }
});

//GET /api/animal/:id/markers - Get health markers for animal
app.get('/api/animals/:id/markers', requireAuth, authorize('admin','vet','assistant'), async (req, res) => {
    try {
        let animal;
        if (req.caretaker.role === 'assistant') {
            animal = await Animal.findOne({ where: { id: req.params.id, caretakerId: req.caretaker.id } });
        } else {
            animal = await Animal.findByPk(req.params.id);
        }

        if (!animal) return res.status(404).json({ error: 'Animal not found' });

        const marker = await Markers.findOne({ where: { animalId: animal.id } });
        res.json(marker);

    } catch (error) {
        console.error('Error fetching health markers:', error);
        res.status(500).json({ error: 'Failed to fetch health markers' });
    }
});

// POST /api/animals - Create new animal
app.post('/api/animals', requireAuth, authorize('admin','vet','assistant'), async (req, res) => {
    try {
        const { name, species, breed, description } = req.body;
        
        // Validate input
        if (!name || !species) {
            return res.status(400).json({ 
                error: 'Name and species are required' 
            });
        }
        
        // Create animal
        const newAnimal = await Animal.create({
            name,
            species,
            breed,
            description,
            caretakerId: req.caretaker.id
        });
        
        res.status(201).json({
            message: 'Animal created successfully',
            id: newAnimal.id,
            animal: newAnimal
        });
        
    } catch (error) {
        console.error('Error creating animal:', error);
        res.status(500).json({ error: 'Failed to create animal' });
    }
});

// POST /api/animals/:id/requirements - Create health requirements for an animal
app.post('/api/animals/:id/requirements', requireAuth, authorize('vet','admin'), async (req, res) => {
    try {
        const animal = await Animal.findByPk(req.params.id);

        if (!animal) return res.status(404).json({ error: 'Animal not found' });

        const { medications, careOutline, quarantine } = req.body;

        // Create health requirement
        const newRequirement = await Requirements.create({
            name: animal.name,
            medications,
            careOutline,
            quarantine,
            animalId: animal.id,
            caretakerId: req.caretaker.id
        });

        res.status(201).json({
            message: 'Health requirement created successfully',
            requirement: newRequirement
        });

    } catch (error) {
        console.error('Error creating health requirement:', error);
        res.status(500).json({ error: 'Failed to create health requirement' });
    }
});

// POST /api/animals/:id/markers - Create health markers for an animal
app.post('/api/animals/:id/markers', requireAuth, authorize('vet','admin'), async (req, res) => {
    try {
        const animal = await Animal.findByPk(req.params.id);

        if (!animal) return res.status(404).json({ error: 'Animal not found' });

        const { height, weight, diet, vaccines, status } = req.body;

        // Create health marker
        const newMarker = await Markers.create({
            name: animal.name,
            height,
            weight,
            diet,
            vaccines,
            status,
            animalId: animal.id,
            caretakerId: req.caretaker.id
        });

        res.status(201).json({
            message: 'Health marker created successfully',
            marker: newMarker
        });

    } catch (error) {
        console.error('Error creating health marker:', error);
        res.status(500).json({ error: 'Failed to create health marker' });
    }
});

// PUT /api/animals/:id - Update animal
app.put('/api/animals/:id', requireAuth, authorize('admin','vet','assistant'), async (req, res) => {
    try {
        const { species, breed, description } = req.body;
        
        // Find animal
        let animal;
        if (req.caretaker.role === 'assistant') {
            animal = await Animal.findOne({ where: { id: req.params.id, caretakerId: req.caretaker.id } });
        } else {
            animal = await Animal.findByPk(req.params.id);
        }
        
        if (!animal) {
            return res.status(404).json({ error: 'Animal not found' });
        }
        
        // Update animal
        await animal.update({
            species: species || animal.species,
            breed: breed || animal.breed,
            description: description !== undefined ? description : animal.description
        });
        
        res.json({
            message: 'Animal updated successfully',
            animal: animal
        });
        
    } catch (error) {
        console.error('Error updating animal:', error);
        res.status(500).json({ error: 'Failed to update animal' });
    }
});

// PUT /api/animals/:id/requirements - Update health requirements for an animal
app.put('/api/animals/:id/requirements', requireAuth, authorize('vet','admin'), async (req, res) => {
    try {
        const animal = await Animal.findByPk(req.params.id);
        if (!animal) return res.status(404).json({ error: 'Animal not found' });

        const requirement = await Requirements.findOne({ where: { animalId: animal.id } });
        if (!requirement) return res.status(404).json({ error: 'Health requirement not found' });

        const { medications, careOutline, quarantine } = req.body;

        await requirement.update({
            medications: medications || requirement.medications,
            careOutline: careOutline || requirement.careOutline,
            quarantine: quarantine || requirement.quarantine
        });

        res.json({
            message: 'Health requirement updated successfully',
            requirement: requirement
        });

    } catch (error) {
        console.error('Error updating health requirement:', error);
        res.status(500).json({ error: 'Failed to update health requirement' });
    }
});

// PUT /api/animals/:id/markers - Update health markers for an animal
app.put('/api/animals/:id/markers', requireAuth, authorize('vet','admin'), async (req, res) => {
    try {
        const animal = await Animal.findByPk(req.params.id);
        if (!animal) return res.status(404).json({ error: 'Animal not found' });

        const marker = await Markers.findOne({ where: { animalId: animal.id } });
        if (!marker) return res.status(404).json({ error: 'Health marker not found' });

        const { height, weight, diet, vaccines, status } = req.body;

        await marker.update({
            height: height || marker.height,
            weight: weight || marker.weight,
            diet: diet || marker.diet,
            vaccines: vaccines || marker.vaccines,
            status: status || marker.status
        });

        res.json({
            message: 'Health marker updated successfully',
            marker: marker
        });

    } catch (error) {
        console.error('Error updating health marker:', error);
        res.status(500).json({ error: 'Failed to update health marker' });
    }
});

// DELETE /api/animals/:id - Delete animal
app.delete('/api/animals/:id', requireAuth, authorize('admin'), async (req, res) => {
    try {
        // Find animal by id (admin only reaches here due to authorize middleware)
        const animal = await Animal.findByPk(req.params.id);
        if (!animal) return res.status(404).json({ error: 'Animal not found' });
        // delete related requirements and markers in a transaction
        const t = await db.transaction();
        try {
            await Requirements.destroy({ where: { animalId: animal.id }, transaction: t });
            await Markers.destroy({ where: { animalId: animal.id }, transaction: t });
            await animal.destroy({ transaction: t });
            await t.commit();

            return res.json({
                message: 'Animal and related data deleted successfully',
                name: animal.name,
                id: animal.id
            });
        } catch (err) {
            await t.rollback();
            throw err;
        }
        
    } catch (error) {
        console.error('Error deleting animal:', error);
        res.status(500).json({ error: 'Failed to delete animal' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        message: `${req.method} ${req.path} is not a valid endpoint`
    });
});

// Start server only when invoked directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Health check: http://localhost:${PORT}/`);
    });
}

module.exports = app;