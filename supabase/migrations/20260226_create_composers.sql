-- Migration: Create composers table
-- Description: Stores composer metadata with representative works for AI analysis
-- Date: 2026-02-26

-- =============================================================================
-- 1. Create the composers table
-- =============================================================================
CREATE TABLE IF NOT EXISTS composers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  short_name text        NOT NULL,
  full_name  text        NOT NULL,
  works      text[]      NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT composers_short_name_unique UNIQUE (short_name)
);

-- =============================================================================
-- 2. Enable Row Level Security
-- =============================================================================
ALTER TABLE composers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on composers"
  ON composers
  FOR SELECT
  USING (true);

-- =============================================================================
-- 3. Insert all 27 composers
-- =============================================================================
INSERT INTO composers (short_name, full_name, works) VALUES

-- 1. Chopin
(
  'F. Chopin',
  'Frédéric Chopin',
  ARRAY[
    'Ballade No.1 Op.23',
    'Ballade No.2 Op.38',
    'Ballade No.3 Op.47',
    'Ballade No.4 Op.52',
    'Nocturne Op.9 No.2',
    'Nocturne Op.27 No.2',
    'Polonaise Op.53 ''Heroic''',
    'Scherzo No.2 Op.31',
    'Etude Op.10 No.3 ''Tristesse''',
    'Etude Op.10 No.12 ''Revolutionary''',
    'Etude Op.25 No.11 ''Winter Wind''',
    'Waltz Op.64 No.2',
    'Piano Sonata No.2 Op.35',
    'Piano Sonata No.3 Op.58',
    'Fantaisie-Impromptu Op.66',
    'Piano Concerto No.1 Op.11',
    'Piano Concerto No.2 Op.21'
  ]
),

-- 2. Beethoven
(
  'L. v. Beethoven',
  'Ludwig van Beethoven',
  ARRAY[
    'Piano Sonata No.8 Op.13 ''Pathétique''',
    'Piano Sonata No.14 Op.27/2 ''Moonlight''',
    'Piano Sonata No.21 Op.53 ''Waldstein''',
    'Piano Sonata No.23 Op.57 ''Appassionata''',
    'Piano Sonata No.26 Op.81a ''Les Adieux''',
    'Piano Sonata No.29 Op.106 ''Hammerklavier''',
    'Piano Sonata No.32 Op.111',
    'Bagatelle WoO 59 ''Für Elise''',
    'Piano Concerto No.5 Op.73 ''Emperor''',
    '32 Variations in C minor WoO 80'
  ]
),

-- 3. Debussy
(
  'C. Debussy',
  'Claude Debussy',
  ARRAY[
    'Suite Bergamasque No.3 ''Clair de Lune''',
    'Arabesque No.1',
    'Arabesque No.2',
    'Rêverie',
    'La fille aux cheveux de lin',
    'Deux Arabesques',
    'Children''s Corner',
    'Estampes',
    'Images Book 1',
    'Images Book 2',
    'Préludes Book 1',
    'Préludes Book 2'
  ]
),

-- 4. Bach
(
  'J.S. Bach',
  'Johann Sebastian Bach',
  ARRAY[
    'Well-Tempered Clavier Book 1',
    'Well-Tempered Clavier Book 2',
    'Goldberg Variations BWV 988',
    'French Suite No.5 BWV 816',
    'English Suite No.2 BWV 807',
    'Partita No.2 BWV 826',
    'Italian Concerto BWV 971',
    'Toccata and Fugue in D minor BWV 565',
    'Prelude in C major BWV 846'
  ]
),

-- 5. Mozart
(
  'W.A. Mozart',
  'Wolfgang Amadeus Mozart',
  ARRAY[
    'Piano Sonata No.11 K.331 ''Alla Turca''',
    'Piano Sonata No.16 K.545',
    'Piano Sonata No.8 K.310',
    'Piano Concerto No.21 K.467',
    'Piano Concerto No.23 K.488',
    'Fantasia in D minor K.397',
    'Rondo in D major K.485',
    '12 Variations K.265 ''Ah vous dirai-je, Maman'''
  ]
),

-- 6. Liszt
(
  'F. Liszt',
  'Franz Liszt',
  ARRAY[
    'Liebestraum No.3',
    'La Campanella',
    'Hungarian Rhapsody No.2',
    'Hungarian Rhapsody No.6',
    'Consolation No.3',
    'Un Sospiro',
    'Mephisto Waltz No.1',
    'Transcendental Etude No.4 ''Mazeppa''',
    'Piano Sonata in B minor'
  ]
),

-- 7. Rachmaninoff
(
  'S. Rachmaninoff',
  'Sergei Rachmaninoff',
  ARRAY[
    'Piano Concerto No.2 Op.18',
    'Piano Concerto No.3 Op.30',
    'Prelude in C# minor Op.3 No.2',
    'Prelude in G minor Op.23 No.5',
    'Etude-Tableau Op.39 No.6',
    'Rhapsody on a Theme of Paganini',
    'Moment Musical Op.16 No.4',
    'Vocalise Op.34 No.14'
  ]
),

-- 8. Schumann
(
  'R. Schumann',
  'Robert Schumann',
  ARRAY[
    'Kinderszenen Op.15',
    'Träumerei Op.15 No.7',
    'Arabeske Op.18',
    'Carnaval Op.9',
    'Kreisleriana Op.16',
    'Piano Concerto in A minor Op.54',
    'Papillons Op.2',
    'Fantasiestücke Op.12'
  ]
),

-- 9. Brahms
(
  'J. Brahms',
  'Johannes Brahms',
  ARRAY[
    'Piano Concerto No.1 Op.15',
    'Piano Concerto No.2 Op.83',
    'Intermezzo Op.117 No.1',
    'Intermezzo Op.118 No.2',
    'Rhapsody Op.79 No.2',
    '6 Piano Pieces Op.118',
    'Ballade Op.10 No.1',
    'Variations on a Theme by Paganini Op.35'
  ]
),

-- 10. Tchaikovsky
(
  'P.I. Tchaikovsky',
  'Pyotr Ilyich Tchaikovsky',
  ARRAY[
    'Piano Concerto No.1 Op.23',
    'The Seasons Op.37a',
    'Album for the Young Op.39',
    'Dumka Op.59',
    'Nocturne Op.19 No.4'
  ]
),

-- 11. Ravel
(
  'M. Ravel',
  'Maurice Ravel',
  ARRAY[
    'Jeux d''eau',
    'Pavane pour une infante défunte',
    'Miroirs',
    'Gaspard de la nuit',
    'Piano Concerto in G major',
    'Sonatine',
    'Le Tombeau de Couperin'
  ]
),

-- 12. Schubert
(
  'F. Schubert',
  'Franz Schubert',
  ARRAY[
    'Piano Sonata No.21 D.960',
    'Impromptu Op.90 No.2',
    'Impromptu Op.90 No.3',
    'Impromptu Op.90 No.4',
    'Moment Musical No.3 D.780',
    'Wanderer Fantasy D.760'
  ]
),

-- 13. Grieg
(
  'E. Grieg',
  'Edvard Grieg',
  ARRAY[
    'Piano Concerto in A minor Op.16',
    'Lyric Pieces Op.43',
    'Wedding Day at Troldhaugen Op.65 No.6',
    'Notturno Op.54 No.4',
    'March of the Dwarfs Op.54 No.3'
  ]
),

-- 14. Scriabin
(
  'A. Scriabin',
  'Alexander Scriabin',
  ARRAY[
    'Piano Sonata No.2 Op.19 ''Sonata-Fantasy''',
    'Piano Sonata No.3 Op.23',
    'Piano Sonata No.4 Op.30',
    'Piano Sonata No.5 Op.53',
    'Piano Sonata No.9 Op.68 ''Black Mass''',
    'Piano Sonata No.10 Op.70',
    'Etude Op.8 No.12 in D# minor',
    'Etude Op.42 No.5',
    '12 Etudes Op.8',
    '24 Preludes Op.11',
    'Prelude Op.11 No.2',
    'Vers la flamme Op.72',
    'Fantaisie Op.28'
  ]
),

-- 15. Prokofiev
(
  'S. Prokofiev',
  'Sergei Prokofiev',
  ARRAY[
    'Piano Sonata No.2 Op.14',
    'Piano Sonata No.3 Op.28',
    'Piano Sonata No.6 Op.82',
    'Piano Sonata No.7 Op.83 ''Stalingrad''',
    'Piano Sonata No.8 Op.84',
    'Piano Concerto No.2 Op.16',
    'Piano Concerto No.3 Op.26',
    'Toccata Op.11',
    'Suggestion Diabolique Op.4 No.4',
    'Visions Fugitives Op.22',
    'Romeo and Juliet (10 Pieces) Op.75',
    'Sarcasms Op.17'
  ]
),

-- 16. Shostakovich
(
  'D. Shostakovich',
  'Dmitri Shostakovich',
  ARRAY[
    '24 Preludes and Fugues Op.87',
    '24 Preludes Op.34',
    'Piano Concerto No.1 Op.35',
    'Piano Concerto No.2 Op.102',
    'Piano Sonata No.2 Op.61',
    '3 Fantastic Dances Op.5',
    'Prelude and Fugue No.1 in C major Op.87',
    'Prelude and Fugue No.24 in D minor Op.87'
  ]
),

-- 17. Mendelssohn
(
  'F. Mendelssohn',
  'Felix Mendelssohn',
  ARRAY[
    'Songs Without Words Op.19',
    'Songs Without Words Op.30',
    'Songs Without Words Op.38',
    'Songs Without Words Op.53',
    'Songs Without Words Op.62',
    'Songs Without Words Op.67',
    'Songs Without Words Op.85',
    'Rondo Capriccioso Op.14',
    'Variations Sérieuses Op.54',
    'Piano Concerto No.1 Op.25',
    'Piano Concerto No.2 Op.40',
    'Scherzo in E minor Op.16 No.2'
  ]
),

-- 18. Haydn
(
  'J. Haydn',
  'Joseph Haydn',
  ARRAY[
    'Piano Sonata No.50 Hob.XVI:37 in D major',
    'Piano Sonata No.52 Hob.XVI:39 in G major',
    'Piano Sonata No.58 Hob.XVI:48 in C major',
    'Piano Sonata No.59 Hob.XVI:49 in E-flat major',
    'Piano Sonata No.60 Hob.XVI:50 in C major',
    'Piano Sonata No.62 Hob.XVI:52 in E-flat major',
    'Andante con Variazioni Hob.XVII:6',
    'Piano Concerto in D major Hob.XVIII:11'
  ]
),

-- 19. Scarlatti
(
  'D. Scarlatti',
  'Domenico Scarlatti',
  ARRAY[
    'Sonata in D minor K.141',
    'Sonata in D minor K.9 ''Pastorale''',
    'Sonata in E major K.380',
    'Sonata in G major K.14',
    'Sonata in B minor K.27',
    'Sonata in D major K.96',
    'Sonata in F minor K.466',
    'Sonata in A major K.208',
    'Sonata in C major K.159'
  ]
),

-- 20. Bartok
(
  'B. Bartók',
  'Béla Bartók',
  ARRAY[
    'Mikrokosmos (6 volumes)',
    'Piano Sonata Sz.80',
    'Allegro Barbaro Sz.49',
    'Romanian Folk Dances Sz.56',
    'Piano Concerto No.1 Sz.83',
    'Piano Concerto No.2 Sz.95',
    'Piano Concerto No.3 Sz.119',
    'Suite Op.14 Sz.62',
    'Out of Doors Sz.81'
  ]
),

-- 21. Satie
(
  'E. Satie',
  'Erik Satie',
  ARRAY[
    'Gymnopédie No.1',
    'Gymnopédie No.2',
    'Gymnopédie No.3',
    'Gnossienne No.1',
    'Gnossienne No.2',
    'Gnossienne No.3',
    'Je te veux',
    'Ogives',
    'Sarabandes'
  ]
),

-- 22. Mussorgsky
(
  'M. Mussorgsky',
  'Modest Mussorgsky',
  ARRAY[
    'Pictures at an Exhibition',
    'Night on Bald Mountain (piano transcription)',
    'Gopak'
  ]
),

-- 23. Gershwin
(
  'G. Gershwin',
  'George Gershwin',
  ARRAY[
    'Rhapsody in Blue',
    'Piano Concerto in F',
    '3 Preludes',
    'I Got Rhythm (Variations)',
    'An American in Paris (piano transcription)',
    'Songbook (18 songs)'
  ]
),

-- 24. Saint-Saens
(
  'C. Saint-Saëns',
  'Camille Saint-Saëns',
  ARRAY[
    'Piano Concerto No.2 Op.22',
    'Piano Concerto No.5 Op.103 ''Egyptian''',
    'Allegro Appassionato Op.70',
    '6 Etudes Op.111',
    'The Carnival of the Animals (2 pianos)'
  ]
),

-- 25. Czerny
(
  'C. Czerny',
  'Carl Czerny',
  ARRAY[
    'The School of Velocity Op.299',
    'The Art of Finger Dexterity Op.740',
    '100 Progressive Studies Op.139',
    'Practical Exercises Op.849',
    '160 Eight-Measure Exercises Op.821',
    'The School of Legato and Staccato Op.335'
  ]
);

INSERT INTO composers (short_name, full_name, works) VALUES

-- 26. Burgmuller
(
  'F. Burgmüller',
  'Friedrich Burgmüller',
  ARRAY[
    '25 Progressive Pieces Op.100',
    '18 Characteristic Studies Op.109',
    '12 Brilliant and Melodious Studies Op.105'
  ]
),

-- 27. Kapustin
(
  'N. Kapustin',
  'Nikolai Kapustin',
  ARRAY[
    '8 Concert Etudes Op.40',
    'Concert Etude Op.40 No.1 ''Prelude'' – Allegro assai',
    'Concert Etude Op.40 No.2 ''Reverie'' – Moderato',
    'Concert Etude Op.40 No.3 ''Toccatina'' – Allegro',
    'Concert Etude Op.40 No.4 ''Remembrance'' – Larghetto',
    'Concert Etude Op.40 No.5 ''Raillery'' – Vivace',
    'Concert Etude Op.40 No.6 ''Pastorale'' – Allegro moderato',
    'Concert Etude Op.40 No.7 ''Intermezzo'' – Allegretto',
    'Concert Etude Op.40 No.8 ''Finale'' – Prestissimo',
    'Piano Sonata No.1 Op.39 ''Sonata-Fantasy''',
    'Piano Sonata No.2 Op.54',
    'Piano Sonata No.3 Op.55',
    'Variations Op.41',
    'Toccatina Op.36',
    'Sonatina Op.100',
    '24 Preludes in Jazz Style Op.53',
    'Piano Concerto No.2 Op.14',
    'Piano Concerto No.4 Op.56'
  ]
);

-- =============================================================================
-- 4. Create index for faster lookups
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_composers_short_name ON composers (short_name);
