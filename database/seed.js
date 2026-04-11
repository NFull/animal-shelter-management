const bcrypt = require('bcryptjs');
const { db, Caretaker, Animal, Requirements, Markers } = require('./setup');

async function seedDatabase() {
    try {
        // Force sync to reset database
        await db.sync({ force: true });
        console.log('Database reset successfully.');

        // Create sample caretakers
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const caretaker = await Caretaker.bulkCreate([
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
                role: 'assistant'
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: hashedPassword,
                role: 'assistant'
            },
            {
                name: 'Mike Johnson',
                email: 'mike@example.com',
                password: hashedPassword,
                role: 'vet'
            },
            {
                name: 'Emily Davis',
                email: 'emily@example.com',
                password: hashedPassword,
                role: 'admin'
            }
        ]);

        // Create sample tasks
        const animal = await Animal.bulkCreate([
            // John's animals
            {
                name: 'Buddy',
                species: 'Dog',
                breed: 'Labrador Retriever',
                description: 'Short haired, tall, golden furcoat, energetic, loves to play fetch',
                caretakerId: caretaker[0].id
            },
            {
                name: 'Max',
                species: 'Dog',
                breed: 'Golden Retriever',
                description: 'Long haired, tall, golden furcoat, calm demeanor, enjoys long walks',
                caretakerId: caretaker[0].id
            },
            {
                name: 'Charlie',
                species: 'Dog',
                breed: 'Bulldog',
                description: 'Short haired, short, black furcoat, sturdy build, friendly disposition',
                caretakerId: caretaker[0].id
            },
            
            // Jane's animals
            {
                name: 'Ralph',
                species: 'Cat',
                breed: 'Calico',
                description: 'Short haired, orange and white furcoat, playful personality',
                caretakerId: caretaker[1].id
            },
            {
                name: 'Daisy',
                species: 'Cat',
                breed: 'Maine Coon',
                description: 'Long haired, gray furcoat, gentle demeanor',
                caretakerId: caretaker[1].id
            },
            {
                name: 'Mr. Whiskers',
                species: 'Cat',
                breed: 'Persian',
                description: 'Short haired, white furcoat, docile personality',
                caretakerId: caretaker[1].id
            }
        ]);

        await Requirements.bulkCreate([
            // John's animals health requirements
            {
                name: 'Buddy',
                medications: '',
                careOutline: 'Slightly overweight, needs regular exercise',
                quarantine: false,
                animalId: animal[0].id,
                caretakerId: caretaker[0].id
            },
            {
                name: 'Max',
                medications: 'Doxycycline',
                careOutline: 'Pneumonia, requires constant monitoring, medicate every 12 hours',
                quarantine: true,
                animalId: animal[1].id,
                caretakerId: caretaker[0].id
            },
            {
                name: 'Charlie',
                medications: '',
                careOutline: '',
                quarantine: false,
                animalId: animal[2].id,
                caretakerId: caretaker[0].id
            },
            
            // Jane's animals health requirements
            {
                name: 'Ralph',
                medications: 'Feline Leukemia Vaccine',
                careOutline: 'First dose administered, second dose due in 3 weeks',
                quarantine: false,
                animalId: animal[3].id,
                caretakerId: caretaker[1].id
            },
            {
                name: 'Daisy',
                medications: '',
                careOutline: 'Slightly underweight, use high-calorie food, monitor weight weekly',
                quarantine: false,
                animalId: animal[4].id,
                caretakerId: caretaker[1].id
            },
            {
                name: 'Mr. Whiskers',
                medications: 'Neutering',
                careOutline: 'Neutering complete, monitor for signs of infection, keep indoors and away from other animals for 2 weeks',
                quarantine: true,
                animalId: animal[5].id,
                caretakerId: caretaker[1].id
            }
        ]);

        await Markers.bulkCreate([
            // John's animals health markers
            {
                name: 'Buddy',
                height: 22.5,
                weight: 80.0,
                diet: 'high-protein, low-fat diet',
                vaccines: true,
                status: 'ready',
                caretakerId: caretaker[0].id,
                animalId: animal[0].id
            },
            {
                name: 'Max',
                height: 24.0,
                weight: 65.0,
                diet: 'antibiotic powder and warm wet food',
                vaccines: true,
                status: 'in progress',
                caretakerId: caretaker[0].id,
                animalId: animal[1].id
            },
            {
                name: 'Charlie',
                height: 14.5,
                weight: 48.5,
                diet: 'standard dog food',
                vaccines: false,
                status: 'not started',
                caretakerId: caretaker[0].id,
                animalId: animal[2].id
            },
            
            // Jane's animals health markers
            {
                name: 'Ralph',
                height: 18.0,
                weight: 12.0,
                diet: 'high-protein cat food',
                vaccines: true,
                status: 'in progress',
                caretakerId: caretaker[1].id,
                animalId: animal[3].id
            },
            {
                name: 'Daisy',
                height: 16.0,
                weight: 9.5,
                diet: 'high-calorie, wet kitten food and recovery formula',
                vaccines: false,
                status: 'not started',
                caretakerId: caretaker[1].id,
                animalId: animal[4].id
            },
            {
                name: 'Mr. Whiskers',
                height: 15.0,
                weight: 10.0,
                diet: 'high-protein cat food',
                vaccines: true,
                status: 'in progress',
                caretakerId: caretaker[1].id,
                animalId: animal[5].id
            },
        ]);


        console.log('Database seeded successfully!');
        console.log('Sample users created:');
        console.log('- john@example.com / password123');
        console.log('- jane@example.com / password123');
        console.log('- mike@example.com / password123');
        console.log('- emily@example.com / password123');
        console.log('Total animals created:', await Animal.count());
        console.log('Total health markers created:', await Markers.count());
        console.log('Total medical requirements created:', await Requirements.count());
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await db.close();
    }
}

seedDatabase();