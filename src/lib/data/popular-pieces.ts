/**
 * 클래식 인기곡 100선 — 사전 분석 대상
 * 입시/콩쿠르/레슨에서 가장 많이 연주되는 곡 위주
 */

export interface PopularPiece {
  composer: string;
  title: string;
  category: "입시" | "콩쿠르" | "레슨" | "교양";
}

export const POPULAR_PIECES: PopularPiece[] = [
  // ─── Chopin (쇼팽) ───
  { composer: "F. Chopin", title: "Ballade No.1 in G minor, Op.23", category: "입시" },
  { composer: "F. Chopin", title: "Ballade No.2 in F major, Op.38", category: "입시" },
  { composer: "F. Chopin", title: "Ballade No.3 in A-flat major, Op.47", category: "입시" },
  { composer: "F. Chopin", title: "Ballade No.4 in F minor, Op.52", category: "입시" },
  { composer: "F. Chopin", title: "Scherzo No.1 in B minor, Op.20", category: "입시" },
  { composer: "F. Chopin", title: "Scherzo No.2 in B-flat minor, Op.31", category: "입시" },
  { composer: "F. Chopin", title: "Scherzo No.3 in C-sharp minor, Op.39", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.10 No.1 in C major", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.10 No.3 in E major", category: "레슨" },
  { composer: "F. Chopin", title: "Etude Op.10 No.4 in C-sharp minor", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.10 No.5 in G-flat major", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.10 No.12 in C minor", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.25 No.5 in E minor", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.25 No.6 in G-sharp minor", category: "입시" },
  { composer: "F. Chopin", title: "Etude Op.25 No.11 in A minor", category: "입시" },
  { composer: "F. Chopin", title: "Nocturne Op.9 No.2 in E-flat major", category: "레슨" },
  { composer: "F. Chopin", title: "Nocturne Op.48 No.1 in C minor", category: "입시" },
  { composer: "F. Chopin", title: "Polonaise Op.53 in A-flat major", category: "입시" },
  { composer: "F. Chopin", title: "Fantaisie-Impromptu Op.66", category: "레슨" },
  { composer: "F. Chopin", title: "Piano Sonata No.2 in B-flat minor, Op.35", category: "입시" },
  { composer: "F. Chopin", title: "Piano Sonata No.3 in B minor, Op.58", category: "입시" },
  { composer: "F. Chopin", title: "Piano Concerto No.1 in E minor, Op.11", category: "콩쿠르" },

  // ─── Beethoven (베토벤) ───
  { composer: "L. v. Beethoven", title: "Piano Sonata No.8 in C minor, Op.13 'Pathétique'", category: "레슨" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.14 in C-sharp minor, Op.27-2 'Moonlight'", category: "레슨" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.21 in C major, Op.53 'Waldstein'", category: "입시" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.23 in F minor, Op.57 'Appassionata'", category: "입시" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.26 in E-flat major, Op.81a 'Les Adieux'", category: "입시" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.30 in E major, Op.109", category: "입시" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.31 in A-flat major, Op.110", category: "입시" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.32 in C minor, Op.111", category: "입시" },
  { composer: "L. v. Beethoven", title: "Piano Concerto No.5 in E-flat major, Op.73 'Emperor'", category: "콩쿠르" },
  { composer: "L. v. Beethoven", title: "32 Variations in C minor, WoO 80", category: "입시" },

  // ─── Mozart (모차르트) ───
  { composer: "W. A. Mozart", title: "Piano Sonata No.11 in A major, K.331", category: "레슨" },
  { composer: "W. A. Mozart", title: "Piano Sonata No.14 in C minor, K.457", category: "입시" },
  { composer: "W. A. Mozart", title: "Piano Sonata No.16 in C major, K.545", category: "교양" },
  { composer: "W. A. Mozart", title: "Piano Concerto No.20 in D minor, K.466", category: "콩쿠르" },
  { composer: "W. A. Mozart", title: "Piano Concerto No.21 in C major, K.467", category: "콩쿠르" },
  { composer: "W. A. Mozart", title: "Piano Concerto No.23 in A major, K.488", category: "콩쿠르" },
  { composer: "W. A. Mozart", title: "Fantasia in D minor, K.397", category: "레슨" },

  // ─── Liszt (리스트) ───
  { composer: "F. Liszt", title: "Hungarian Rhapsody No.2 in C-sharp minor", category: "입시" },
  { composer: "F. Liszt", title: "Transcendental Etude No.10 in F minor", category: "입시" },
  { composer: "F. Liszt", title: "Transcendental Etude No.4 'Mazeppa'", category: "입시" },
  { composer: "F. Liszt", title: "Liebesträume No.3 in A-flat major", category: "레슨" },
  { composer: "F. Liszt", title: "Mephisto Waltz No.1", category: "입시" },
  { composer: "F. Liszt", title: "Piano Sonata in B minor, S.178", category: "입시" },
  { composer: "F. Liszt", title: "Consolation No.3 in D-flat major", category: "레슨" },
  { composer: "F. Liszt", title: "La Campanella", category: "콩쿠르" },

  // ─── Bach (바흐) ───
  { composer: "J. S. Bach", title: "Well-Tempered Clavier Book 1, Prelude and Fugue No.1 in C major, BWV 846", category: "레슨" },
  { composer: "J. S. Bach", title: "Well-Tempered Clavier Book 1, Prelude and Fugue No.2 in C minor, BWV 847", category: "입시" },
  { composer: "J. S. Bach", title: "Well-Tempered Clavier Book 1, Prelude and Fugue No.5 in D major, BWV 850", category: "입시" },
  { composer: "J. S. Bach", title: "Italian Concerto in F major, BWV 971", category: "입시" },
  { composer: "J. S. Bach", title: "French Suite No.5 in G major, BWV 816", category: "입시" },
  { composer: "J. S. Bach", title: "Partita No.2 in C minor, BWV 826", category: "입시" },
  { composer: "J. S. Bach", title: "Chromatic Fantasia and Fugue in D minor, BWV 903", category: "입시" },

  // ─── Schumann (슈만) ───
  { composer: "R. Schumann", title: "Kreisleriana, Op.16", category: "입시" },
  { composer: "R. Schumann", title: "Carnaval, Op.9", category: "입시" },
  { composer: "R. Schumann", title: "Symphonic Etudes, Op.13", category: "입시" },
  { composer: "R. Schumann", title: "Fantasie in C major, Op.17", category: "입시" },
  { composer: "R. Schumann", title: "Kinderszenen, Op.15", category: "레슨" },

  // ─── Brahms (브람스) ───
  { composer: "J. Brahms", title: "Rhapsody in B minor, Op.79 No.1", category: "입시" },
  { composer: "J. Brahms", title: "Rhapsody in G minor, Op.79 No.2", category: "입시" },
  { composer: "J. Brahms", title: "Piano Sonata No.3 in F minor, Op.5", category: "입시" },
  { composer: "J. Brahms", title: "Variations on a Theme by Paganini, Op.35", category: "입시" },
  { composer: "J. Brahms", title: "Intermezzo in A major, Op.118 No.2", category: "레슨" },
  { composer: "J. Brahms", title: "Piano Concerto No.2 in B-flat major, Op.83", category: "콩쿠르" },

  // ─── Debussy (드뷔시) ───
  { composer: "C. Debussy", title: "Clair de Lune (Suite bergamasque)", category: "레슨" },
  { composer: "C. Debussy", title: "Arabesque No.1", category: "레슨" },
  { composer: "C. Debussy", title: "Pour le Piano", category: "입시" },
  { composer: "C. Debussy", title: "Images Book 1", category: "입시" },
  { composer: "C. Debussy", title: "Estampes", category: "입시" },
  { composer: "C. Debussy", title: "L'isle joyeuse", category: "입시" },
  { composer: "C. Debussy", title: "Preludes Book 1", category: "입시" },

  // ─── Ravel (라벨) ───
  { composer: "M. Ravel", title: "Jeux d'eau", category: "입시" },
  { composer: "M. Ravel", title: "Sonatine", category: "입시" },
  { composer: "M. Ravel", title: "Gaspard de la nuit", category: "입시" },
  { composer: "M. Ravel", title: "Piano Concerto in G major", category: "콩쿠르" },

  // ─── Rachmaninoff (라흐마니노프) ───
  { composer: "S. Rachmaninoff", title: "Piano Concerto No.2 in C minor, Op.18", category: "콩쿠르" },
  { composer: "S. Rachmaninoff", title: "Piano Concerto No.3 in D minor, Op.30", category: "콩쿠르" },
  { composer: "S. Rachmaninoff", title: "Prelude in C-sharp minor, Op.3 No.2", category: "레슨" },
  { composer: "S. Rachmaninoff", title: "Prelude in G minor, Op.23 No.5", category: "입시" },
  { composer: "S. Rachmaninoff", title: "Etude-Tableau in E-flat minor, Op.39 No.5", category: "입시" },
  { composer: "S. Rachmaninoff", title: "Piano Sonata No.2 in B-flat minor, Op.36", category: "입시" },

  // ─── Schubert (슈베르트) ───
  { composer: "F. Schubert", title: "Impromptu in G-flat major, Op.90 No.3, D.899", category: "레슨" },
  { composer: "F. Schubert", title: "Impromptu in A-flat major, Op.142 No.2, D.935", category: "레슨" },
  { composer: "F. Schubert", title: "Piano Sonata No.21 in B-flat major, D.960", category: "입시" },
  { composer: "F. Schubert", title: "Wanderer Fantasy in C major, D.760", category: "입시" },

  // ─── Prokofiev (프로코피예프) ───
  { composer: "S. Prokofiev", title: "Piano Sonata No.7 in B-flat major, Op.83", category: "입시" },
  { composer: "S. Prokofiev", title: "Piano Concerto No.3 in C major, Op.26", category: "콩쿠르" },
  { composer: "S. Prokofiev", title: "Toccata in D minor, Op.11", category: "입시" },

  // ─── Scriabin (스크리아빈) ───
  { composer: "A. Scriabin", title: "Etude in D-sharp minor, Op.8 No.12", category: "입시" },
  { composer: "A. Scriabin", title: "Piano Sonata No.5, Op.53", category: "입시" },

  // ─── Haydn (하이든) ───
  { composer: "J. Haydn", title: "Piano Sonata in E-flat major, Hob.XVI:52", category: "입시" },
  { composer: "J. Haydn", title: "Piano Sonata in C major, Hob.XVI:50", category: "입시" },

  // ─── Mendelssohn (멘델스존) ───
  { composer: "F. Mendelssohn", title: "Variations Sérieuses, Op.54", category: "입시" },
  { composer: "F. Mendelssohn", title: "Rondo Capriccioso, Op.14", category: "레슨" },

  // ─── Tchaikovsky (차이콥스키) ───
  { composer: "P. I. Tchaikovsky", title: "Piano Concerto No.1 in B-flat minor, Op.23", category: "콩쿠르" },
  { composer: "P. I. Tchaikovsky", title: "The Seasons, Op.37a", category: "레슨" },

  // ─── Grieg (그리그) ───
  { composer: "E. Grieg", title: "Piano Concerto in A minor, Op.16", category: "콩쿠르" },
];
