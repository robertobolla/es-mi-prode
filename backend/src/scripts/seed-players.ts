import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedPlayer {
  firstName: string;
  lastName: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
}

const PREDEFINED_SQUADS: Record<string, SeedPlayer[]> = {
  'Argentina': [
    { firstName: 'Emiliano', lastName: 'Martínez', position: 'GK' },
    { firstName: 'Gerónimo', lastName: 'Rulli', position: 'GK' },
    { firstName: 'Cristian', lastName: 'Romero', position: 'DEF' },
    { firstName: 'Nicolás', lastName: 'Otamendi', position: 'DEF' },
    { firstName: 'Lisandro', lastName: 'Martínez', position: 'DEF' },
    { firstName: 'Nahuel', lastName: 'Molina', position: 'DEF' },
    { firstName: 'Rodrigo', lastName: 'De Paul', position: 'MID' },
    { firstName: 'Enzo', lastName: 'Fernández', position: 'MID' },
    { firstName: 'Alexis', lastName: 'Mac Allister', position: 'MID' },
    { firstName: 'Leandro', lastName: 'Paredes', position: 'MID' },
    { firstName: 'Lionel', lastName: 'Messi', position: 'FWD' },
    { firstName: 'Lautaro', lastName: 'Martínez', position: 'FWD' },
    { firstName: 'Julián', lastName: 'Álvarez', position: 'FWD' }
  ],
  'Brasil': [
    { firstName: 'Alisson', lastName: 'Becker', position: 'GK' },
    { firstName: 'Ederson', lastName: 'Moraes', position: 'GK' },
    { firstName: 'Marquinhos', lastName: 'Corrêa', position: 'DEF' },
    { firstName: 'Thiago', lastName: 'Silva', position: 'DEF' },
    { firstName: 'Éder', lastName: 'Militão', position: 'DEF' },
    { firstName: 'Gabriel', lastName: 'Magalhães', position: 'DEF' },
    { firstName: 'Bruno', lastName: 'Guimarães', position: 'MID' },
    { firstName: 'Lucas', lastName: 'Paquetá', position: 'MID' },
    { firstName: 'Casemiro', lastName: 'Venancio', position: 'MID' },
    { firstName: 'Andreas', lastName: 'Pereira', position: 'MID' },
    { firstName: 'Vinícius', lastName: 'Júnior', position: 'FWD' },
    { firstName: 'Rodrygo', lastName: 'Goes', position: 'FWD' },
    { firstName: 'Endrick', lastName: 'Felipe', position: 'FWD' }
  ],
  'Francia': [
    { firstName: 'Mike', lastName: 'Maignan', position: 'GK' },
    { firstName: 'Brice', lastName: 'Samba', position: 'GK' },
    { firstName: 'William', lastName: 'Saliba', position: 'DEF' },
    { firstName: 'Dayot', lastName: 'Upamecano', position: 'DEF' },
    { firstName: 'Ibrahima', lastName: 'Konaté', position: 'DEF' },
    { firstName: 'Jules', lastName: 'Koundé', position: 'DEF' },
    { firstName: 'Aurélien', lastName: 'Tchouaméni', position: 'MID' },
    { firstName: 'Eduardo', lastName: 'Camavinga', position: 'MID' },
    { firstName: 'Adrien', lastName: 'Rabiot', position: 'MID' },
    { firstName: 'Warren', lastName: 'Zaïre-Emery', position: 'MID' },
    { firstName: 'Kylian', lastName: 'Mbappé', position: 'FWD' },
    { firstName: 'Antoine', lastName: 'Griezmann', position: 'FWD' },
    { firstName: 'Ousmane', lastName: 'Dembélé', position: 'FWD' }
  ],
  'España': [
    { firstName: 'Unai', lastName: 'Simón', position: 'GK' },
    { firstName: 'David', lastName: 'Raya', position: 'GK' },
    { firstName: 'Robin', lastName: 'Le Normand', position: 'DEF' },
    { firstName: 'Aymeric', lastName: 'Laporte', position: 'DEF' },
    { firstName: 'Dani', lastName: 'Carvajal', position: 'DEF' },
    { firstName: 'Marc', lastName: 'Cucurella', position: 'DEF' },
    { firstName: 'Rodri', lastName: 'Hernández', position: 'MID' },
    { firstName: 'Pedri', lastName: 'González', position: 'MID' },
    { firstName: 'Gavi', lastName: 'Páez', position: 'MID' },
    { firstName: 'Fabián', lastName: 'Ruiz', position: 'MID' },
    { firstName: 'Álvaro', lastName: 'Morata', position: 'FWD' },
    { firstName: 'Lamine', lastName: 'Yamal', position: 'FWD' },
    { firstName: 'Nico', lastName: 'Williams', position: 'FWD' }
  ],
  'Inglaterra': [
    { firstName: 'Jordan', lastName: 'Pickford', position: 'GK' },
    { firstName: 'Aaron', lastName: 'Ramsdale', position: 'GK' },
    { firstName: 'John', lastName: 'Stones', position: 'DEF' },
    { firstName: 'Harry', lastName: 'Maguire', position: 'DEF' },
    { firstName: 'Kyle', lastName: 'Walker', position: 'DEF' },
    { firstName: 'Kieran', lastName: 'Trippier', position: 'DEF' },
    { firstName: 'Jude', lastName: 'Bellingham', position: 'MID' },
    { firstName: 'Declan', lastName: 'Rice', position: 'MID' },
    { firstName: 'Phil', lastName: 'Foden', position: 'MID' },
    { firstName: 'Cole', lastName: 'Palmer', position: 'MID' },
    { firstName: 'Harry', lastName: 'Kane', position: 'FWD' },
    { firstName: 'Bukayo', lastName: 'Saka', position: 'FWD' },
    { firstName: 'Ollie', lastName: 'Watkins', position: 'FWD' }
  ],
  'Alemania': [
    { firstName: 'Manuel', lastName: 'Neuer', position: 'GK' },
    { firstName: 'Marc-André', lastName: 'ter Stegen', position: 'GK' },
    { firstName: 'Antonio', lastName: 'Rüdiger', position: 'DEF' },
    { firstName: 'Mats', lastName: 'Hummels', position: 'DEF' },
    { firstName: 'Jonathan', lastName: 'Tah', position: 'DEF' },
    { firstName: 'Joshua', lastName: 'Kimmich', position: 'DEF' },
    { firstName: 'İlkay', lastName: 'Gündoğan', position: 'MID' },
    { firstName: 'Toni', lastName: 'Kroos', position: 'MID' },
    { firstName: 'Florian', lastName: 'Wirtz', position: 'MID' },
    { firstName: 'Jamal', lastName: 'Musiala', position: 'MID' },
    { firstName: 'Kai', lastName: 'Havertz', position: 'FWD' },
    { firstName: 'Niclas', lastName: 'Füllkrug', position: 'FWD' },
    { firstName: 'Leroy', lastName: 'Sané', position: 'FWD' }
  ],
  'Portugal': [
    { firstName: 'Diogo', lastName: 'Costa', position: 'GK' },
    { firstName: 'Rui', lastName: 'Patrício', position: 'GK' },
    { firstName: 'Rúben', lastName: 'Dias', position: 'DEF' },
    { firstName: 'João', lastName: 'Cancelo', position: 'DEF' },
    { firstName: 'Pepe', lastName: 'Ferreira', position: 'DEF' },
    { firstName: 'Nuno', lastName: 'Mendes', position: 'DEF' },
    { firstName: 'Bruno', lastName: 'Fernandes', position: 'MID' },
    { firstName: 'Bernardo', lastName: 'Silva', position: 'MID' },
    { firstName: 'Vitinha', lastName: 'Ferreira', position: 'MID' },
    { firstName: 'João', lastName: 'Neves', position: 'MID' },
    { firstName: 'Cristiano', lastName: 'Ronaldo', position: 'FWD' },
    { firstName: 'Rafael', lastName: 'Leão', position: 'FWD' },
    { firstName: 'João', lastName: 'Félix', position: 'FWD' }
  ],
  'Uruguay': [
    { firstName: 'Sergio', lastName: 'Rochet', position: 'GK' },
    { firstName: 'Santiago', lastName: 'Mele', position: 'GK' },
    { firstName: 'Ronald', lastName: 'Araújo', position: 'DEF' },
    { firstName: 'José María', lastName: 'Giménez', position: 'DEF' },
    { firstName: 'Mathías', lastName: 'Olivera', position: 'DEF' },
    { firstName: 'Sebastián', lastName: 'Cáceres', position: 'DEF' },
    { firstName: 'Federico', lastName: 'Valverde', position: 'MID' },
    { firstName: 'Rodrigo', lastName: 'Bentancur', position: 'MID' },
    { firstName: 'Manuel', lastName: 'Ugarte', position: 'MID' },
    { firstName: 'Nicolás', lastName: 'de la Cruz', position: 'MID' },
    { firstName: 'Darwin', lastName: 'Núñez', position: 'FWD' },
    { firstName: 'Luis', lastName: 'Suárez', position: 'FWD' },
    { firstName: 'Facundo', lastName: 'Pellistri', position: 'FWD' }
  ],
  'Colombia': [
    { firstName: 'Camilo', lastName: 'Vargas', position: 'GK' },
    { firstName: 'David', lastName: 'Ospina', position: 'GK' },
    { firstName: 'Davinson', lastName: 'Sánchez', position: 'DEF' },
    { firstName: 'Carlos', lastName: 'Cuesta', position: 'DEF' },
    { firstName: 'Daniel', lastName: 'Muñoz', position: 'DEF' },
    { firstName: 'Johan', lastName: 'Mojica', position: 'DEF' },
    { firstName: 'James', lastName: 'Rodríguez', position: 'MID' },
    { firstName: 'Jefferson', lastName: 'Lerma', position: 'MID' },
    { firstName: 'Richard', lastName: 'Ríos', position: 'MID' },
    { firstName: 'Jhon', lastName: 'Arias', position: 'MID' },
    { firstName: 'Luis', lastName: 'Díaz', position: 'FWD' },
    { firstName: 'Jhon', lastName: 'Durán', position: 'FWD' },
    { firstName: 'Rafael', lastName: 'Santos Borré', position: 'FWD' }
  ],
  'Estados Unidos': [
    { firstName: 'Matt', lastName: 'Turner', position: 'GK' },
    { firstName: 'Ethan', lastName: 'Horvath', position: 'GK' },
    { firstName: 'Antonee', lastName: 'Robinson', position: 'DEF' },
    { firstName: 'Miles', lastName: 'Robinson', position: 'DEF' },
    { firstName: 'Chris', lastName: 'Richards', position: 'DEF' },
    { firstName: 'Sergiño', lastName: 'Dest', position: 'DEF' },
    { firstName: 'Weston', lastName: 'McKennie', position: 'MID' },
    { firstName: 'Tyler', lastName: 'Adams', position: 'MID' },
    { firstName: 'Yunus', lastName: 'Musah', position: 'MID' },
    { firstName: 'Gio', lastName: 'Reyna', position: 'MID' },
    { firstName: 'Christian', lastName: 'Pulisic', position: 'FWD' },
    { firstName: 'Folarin', lastName: 'Balogun', position: 'FWD' },
    { firstName: 'Timothy', lastName: 'Weah', position: 'FWD' }
  ],
  'México': [
    { firstName: 'Luis', lastName: 'Malagón', position: 'GK' },
    { firstName: 'Julio', lastName: 'González', position: 'GK' },
    { firstName: 'César', lastName: 'Montes', position: 'DEF' },
    { firstName: 'Johan', lastName: 'Vásquez', position: 'DEF' },
    { firstName: 'Jorge', lastName: 'Sánchez', position: 'DEF' },
    { firstName: 'Gerardo', lastName: 'Arteaga', position: 'DEF' },
    { firstName: 'Edson', lastName: 'Álvarez', position: 'MID' },
    { firstName: 'Luis', lastName: 'Chávez', position: 'MID' },
    { firstName: 'Érick', lastName: 'Sánchez', position: 'MID' },
    { firstName: 'Orbelín', lastName: 'Pineda', position: 'MID' },
    { firstName: 'Santiago', lastName: 'Giménez', position: 'FWD' },
    { firstName: 'Julián', lastName: 'Quiñones', position: 'FWD' },
    { firstName: 'Uriel', lastName: 'Antuna', position: 'FWD' }
  ],
  'Italia': [
    { firstName: 'Gianluigi', lastName: 'Donnarumma', position: 'GK' },
    { firstName: 'Guglielmo', lastName: 'Vicario', position: 'GK' },
    { firstName: 'Alessandro', lastName: 'Bastoni', position: 'DEF' },
    { firstName: 'Riccardo', lastName: 'Calafiori', position: 'DEF' },
    { firstName: 'Giovanni', lastName: 'Di Lorenzo', position: 'DEF' },
    { firstName: 'Federico', lastName: 'Dimarco', position: 'DEF' },
    { firstName: 'Nicolò', lastName: 'Barella', position: 'MID' },
    { firstName: 'Jorginho', lastName: 'Frello', position: 'MID' },
    { firstName: 'Davide', lastName: 'Frattesi', position: 'MID' },
    { firstName: 'Lorenzo', lastName: 'Pellegrini', position: 'MID' },
    { firstName: 'Federico', lastName: 'Chiesa', position: 'FWD' },
    { firstName: 'Gianluca', lastName: 'Scamacca', position: 'FWD' },
    { firstName: 'Mateo', lastName: 'Retegui', position: 'FWD' }
  ]
};

const FIRST_NAMES = [
  'Juan', 'Pedro', 'Carlos', 'Luis', 'José', 'Miguel', 'David', 'John', 'Thomas', 'Pierre',
  'Jean', 'Marco', 'Giuseppe', 'Hans', 'Jürgen', 'Robert', 'Michael', 'William', 'Lucas', 'Mateo',
  'Santiago', 'Alexander', 'Daniel', 'Gabriel', 'Andrés', 'Javier', 'Diego', 'Nicolás', 'Hugo'
];

const LAST_NAMES = [
  'Gómez', 'Rodríguez', 'González', 'Fernández', 'López', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Miller', 'Davis', 'Garcia', 'Martinez', 'Martin', 'Bernard', 'Dubois', 'Rossi', 'Bianchi', 'Müller',
  'Schmidt', 'Weber', 'Silva', 'Santos', 'Pérez', 'Sánchez', 'Díaz', 'Torres', 'Ramírez', 'Cruz'
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockSquad(): SeedPlayer[] {
  const squad: SeedPlayer[] = [];
  
  // 2 GK
  squad.push({ firstName: getRandomItem(FIRST_NAMES), lastName: `${getRandomItem(LAST_NAMES)} (ARQ)`, position: 'GK' });
  squad.push({ firstName: getRandomItem(FIRST_NAMES), lastName: `${getRandomItem(LAST_NAMES)} (ARQ)`, position: 'GK' });

  // 4 DEF
  for (let i = 0; i < 4; i++) {
    squad.push({ firstName: getRandomItem(FIRST_NAMES), lastName: getRandomItem(LAST_NAMES), position: 'DEF' });
  }

  // 4 MID
  for (let i = 0; i < 4; i++) {
    squad.push({ firstName: getRandomItem(FIRST_NAMES), lastName: getRandomItem(LAST_NAMES), position: 'MID' });
  }

  // 3 FWD
  for (let i = 0; i < 3; i++) {
    squad.push({ firstName: getRandomItem(FIRST_NAMES), lastName: getRandomItem(LAST_NAMES), position: 'FWD' });
  }

  return squad;
}

async function main() {
  console.log('🌱 Starting players seed script...');
  
  const teams = await prisma.team.findMany();
  console.log(`Found ${teams.length} teams in database.`);

  let totalSeeded = 0;

  for (const team of teams) {
    // Check if team already has players
    const existingCount = await prisma.player.count({
      where: { teamId: team.id }
    });

    if (existingCount > 0) {
      console.log(`⚠️ Team "${team.name}" already has ${existingCount} players. Skipping.`);
      continue;
    }

    const squad = PREDEFINED_SQUADS[team.name] || generateMockSquad();
    
    console.log(`Creating roster for team: "${team.name}" (${squad.length} players)...`);
    
    for (const player of squad) {
      await prisma.player.create({
        data: {
          firstName: player.firstName,
          lastName: player.lastName,
          position: player.position,
          teamId: team.id
        }
      });
      totalSeeded++;
    }
  }

  console.log(`✅ Seeding complete. Seeded ${totalSeeded} players total.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
