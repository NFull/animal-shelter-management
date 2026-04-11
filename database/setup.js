const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize database connection
const db = new Sequelize({
    dialect: 'sqlite',
    storage: `database/${process.env.DB_NAME}` || 'animals.db',
    logging: false
});

// Caretaker Model
const Caretaker = db.define('Caretaker', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'assistant',
        validate: {
            isIn: [['assistant', 'vet', 'admin']]
        }
    }
});

// Animal Model
const Animal = db.define('Animal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    species: {
        type: DataTypes.STRING,
        allowNull: false
    },
    breed: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// Health Requirements Model
const Requirements = db.define('Requirements', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    medications: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    careOutline: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quarantine: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// Health Markers Model
const Markers = db.define('Markers', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    height: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    diet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vaccines: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'not started',
        validate: {
            isIn: [['not started', 'in progress', 'ready']]
        }
    }
});

// Define Relationships
Caretaker.hasMany(Animal, { foreignKey: 'caretakerId' });
Animal.belongsTo(Caretaker, { foreignKey: 'caretakerId' });
Caretaker.hasMany(Requirements, { foreignKey: 'caretakerId' });
Requirements.belongsTo(Caretaker, { foreignKey: 'caretakerId' });
Animal.hasOne(Requirements, { foreignKey: 'animalId' });
Requirements.belongsTo(Animal, { foreignKey: 'animalId' });
Caretaker.hasMany(Markers, { foreignKey: 'caretakerId' });
Markers.belongsTo(Caretaker, { foreignKey: 'caretakerId' });
Animal.hasOne(Markers, { foreignKey: 'animalId' });
Markers.belongsTo(Animal, { foreignKey: 'animalId' });

// Initialize database
async function initializeDatabase() {
    try {
        await db.authenticate();
        console.log('Database connection established successfully.');
        
        await db.sync({ force: false });
        console.log('Database synchronized successfully.');
        
    } catch (error) {
        console.error('Unable to connect to database:', error);
    }
}

initializeDatabase();

module.exports = {
    db,
    Caretaker,
    Animal,
    Requirements,
    Markers
};