# animal-shelter-management

A REST API for managing animals that are being held in an animal shelter. Built with Node.js, Express, and SQLite.

## Features

- User registration and authentication
- JWT-based authentication
- CRUD operations for tasks
- User-specific animal shelter management
- SQLite database with Sequelize ORM

## API Endpoints

### Authentication
- `POST /api/register` - Registers a new caretaker
- `POST /api/login` - Login an existing caretaker

### Animals (protected)
- `GET /api/animals` - Returns all assigned animals for authenticated caretaker
- `GET /api/animals/:id` - Returns specified assigned animal
- `POST /api/animals` - Adds a new animal to the animal shelter database
- `PUT /api/animals/:id` - Updates specified animal
- `DELETE /api/animals/:id` - Removes specified animal and its related health requirements/health markers from the animal shelter database

### Requirements (protected)
- `GET /api/animal/:id/requirements` - Returns the health requirements of the specified animal for authenticated caretaker
- `POST /api/animal/:id/requirement` - Adds new health requirements for specified animal
- `PUT /api/animal/:id/requirement` - Updates health requirments for specified animal

### Markers (protected)
- `GET /api/animal/:id/markers` - Returns the health markers of the specified animal for authenticated caretaker
- `POST /api/animal/:id/marker` - Adds new health markers for specified animal
- `PUT /api/animal/:id/marker` - Updates health markers for specified animal

## Local Development

1. Clone respository

2. Install Dependencies:
```bash
npm install
```

3. Set up environment variables in
```bash
.env
```

4. Setup the database:
```bash
npm run setup
```

5. Seed the database:
```bash
npm run seed
```

6. Start the server:
```bash
npm start
```

7. The API will be available at `http://localhost:3000`

### Sample Caretakers
If you run the seed script, you'll have these test caretakers available:
- **john@example.com** / password123 (3 animals)
- **jane@example.com** / password123 (3 animals)
- **mike@example.com** / password123 (vet)
- **emily@example.com** / password123 (admin)

You can use these accounts to test the API without having to register new users.

### Role Permissions
- **Assistant:** View assigned animals, their health requirements, and their health markers. Can add new animals and update assigned animals information
- **Vet:** Can view all animals, their health requirements, and their health markers. Can add new animals, health requirements, and health markers, and can update all animals/health requirements/health markers
- **Admin:** Can view all animals, their health requirements, and their health markers. Can add new animals, health requirements, and health markers, and can update all animals/health requirements/health markers. Is allowed to remove any animal, as well as their corresponding health requirements/health markers, from the database

### Postman Documentation
Postman Documentation for this REST API can be found through this link: **[Postman Documenation](https://documenter.getpostman.com/view/52397591/2sBXitD7UE)**

### Render Deployment
The Render Deployment for this REST API can be found through this link: **[Render Deployment](https://animal-shelter-management.onrender.com/)**

### Testing
Use the following sample requests to test the API:

**Register a user:**
```bash
POST /api/register
Content-Type: application/json

{
    "name": "Mary Sue",
    "email": "mary@example.com",
    "password": "password123",
    "role": "vet"
}
```

**Login:**
```bash
POST /api/login
Content-Type: application/json

{
    "email": "mary@example.com",
    "password": "password123"
}
```

**Add a new animal (requires authentication):**
```bash
POST /api/animals
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
    "name": "sample name",
    "species": "sample species",
    "breed": "sample breed",
    "description": "sample description"
}
```

**Add health requirements to new animal (requires authentication):**
```bash
POST /api/animals/:id/requirements
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
    "medications": "sample medications",
    "careOutline": "sample outline",
    "quarantine": "false"
}
```

**Add health markers to a new animal (requires authentication):**
```bash
POST /api/animals/:id/markers
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
    "height": 1.0,
    "weight": 1.0,
    "diet": "sample diet",
    "vaccines": "false",
    "status": "not started"
}
```

### Database
This API uses SQLite for simplicity. The database file (animals.db) will be created automatically when you start the server.

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time
- `DB_NAME` - Database file name

### Deployment
This API is ready to deploy to cloud platforms like Render. Make sure to:
1. Set appropriate environment variables
2. Use a secure JWT secret in production
3. Consider database limitations with SQLite

