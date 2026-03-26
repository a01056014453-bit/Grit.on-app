/**
 * 클래식 인기곡 — 사전 분석 대상
 * 입시/콩쿠르/레슨에서 가장 많이 연주되는 곡 위주
 */

export type InstrumentType = "piano" | "violin" | "cello" | "flute" | "clarinet" | "vocal";

export interface PopularPiece {
  composer: string;
  title: string;
  category: "입시" | "콩쿠르" | "레슨" | "교양";
  instrument: InstrumentType;
}

export const POPULAR_PIECES: PopularPiece[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎹 피아노
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─── Chopin ───
  { composer: "F. Chopin", title: "Ballade No.1 in G minor, Op.23", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Ballade No.2 in F major, Op.38", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Ballade No.3 in A-flat major, Op.47", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Ballade No.4 in F minor, Op.52", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Scherzo No.2 in B-flat minor, Op.31", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Scherzo No.3 in C-sharp minor, Op.39", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Etude Op.10 No.1 in C major", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Etude Op.10 No.4 in C-sharp minor", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Etude Op.10 No.12 in C minor", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Etude Op.25 No.11 in A minor", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Nocturne Op.9 No.2 in E-flat major", category: "레슨", instrument: "piano" },
  { composer: "F. Chopin", title: "Nocturne Op.48 No.1 in C minor", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Polonaise Op.53 in A-flat major", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Fantaisie-Impromptu Op.66", category: "레슨", instrument: "piano" },
  { composer: "F. Chopin", title: "Piano Sonata No.2 in B-flat minor, Op.35", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Piano Sonata No.3 in B minor, Op.58", category: "입시", instrument: "piano" },
  { composer: "F. Chopin", title: "Piano Concerto No.1 in E minor, Op.11", category: "콩쿠르", instrument: "piano" },

  // ─── Beethoven ───
  { composer: "L. v. Beethoven", title: "Piano Sonata No.8 'Pathétique', Op.13", category: "레슨", instrument: "piano" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.14 'Moonlight', Op.27-2", category: "레슨", instrument: "piano" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.21 'Waldstein', Op.53", category: "입시", instrument: "piano" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.23 'Appassionata', Op.57", category: "입시", instrument: "piano" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.31 in A-flat major, Op.110", category: "입시", instrument: "piano" },
  { composer: "L. v. Beethoven", title: "Piano Sonata No.32 in C minor, Op.111", category: "입시", instrument: "piano" },
  { composer: "L. v. Beethoven", title: "Piano Concerto No.5 'Emperor', Op.73", category: "콩쿠르", instrument: "piano" },

  // ─── Mozart ───
  { composer: "W. A. Mozart", title: "Piano Sonata No.11 in A major, K.331", category: "레슨", instrument: "piano" },
  { composer: "W. A. Mozart", title: "Piano Concerto No.20 in D minor, K.466", category: "콩쿠르", instrument: "piano" },
  { composer: "W. A. Mozart", title: "Piano Concerto No.23 in A major, K.488", category: "콩쿠르", instrument: "piano" },

  // ─── Liszt ───
  { composer: "F. Liszt", title: "Hungarian Rhapsody No.2", category: "입시", instrument: "piano" },
  { composer: "F. Liszt", title: "Liebesträume No.3 in A-flat major", category: "레슨", instrument: "piano" },
  { composer: "F. Liszt", title: "Mephisto Waltz No.1", category: "입시", instrument: "piano" },
  { composer: "F. Liszt", title: "Piano Sonata in B minor, S.178", category: "입시", instrument: "piano" },
  { composer: "F. Liszt", title: "La Campanella", category: "콩쿠르", instrument: "piano" },

  // ─── Bach ───
  { composer: "J. S. Bach", title: "WTC Book 1, Prelude and Fugue No.1 in C major, BWV 846", category: "레슨", instrument: "piano" },
  { composer: "J. S. Bach", title: "Italian Concerto in F major, BWV 971", category: "입시", instrument: "piano" },
  { composer: "J. S. Bach", title: "Chromatic Fantasia and Fugue, BWV 903", category: "입시", instrument: "piano" },
  { composer: "J. S. Bach", title: "Partita No.2 in C minor, BWV 826", category: "입시", instrument: "piano" },

  // ─── Schumann ───
  { composer: "R. Schumann", title: "Kreisleriana, Op.16", category: "입시", instrument: "piano" },
  { composer: "R. Schumann", title: "Fantasie in C major, Op.17", category: "입시", instrument: "piano" },
  { composer: "R. Schumann", title: "Kinderszenen, Op.15", category: "레슨", instrument: "piano" },

  // ─── Brahms ───
  { composer: "J. Brahms", title: "Rhapsody in B minor, Op.79 No.1", category: "입시", instrument: "piano" },
  { composer: "J. Brahms", title: "Piano Concerto No.2, Op.83", category: "콩쿠르", instrument: "piano" },
  { composer: "J. Brahms", title: "Intermezzo in A major, Op.118 No.2", category: "레슨", instrument: "piano" },

  // ─── Debussy ───
  { composer: "C. Debussy", title: "Clair de Lune", category: "레슨", instrument: "piano" },
  { composer: "C. Debussy", title: "L'isle joyeuse", category: "입시", instrument: "piano" },
  { composer: "C. Debussy", title: "Pour le Piano", category: "입시", instrument: "piano" },

  // ─── Ravel ───
  { composer: "M. Ravel", title: "Jeux d'eau", category: "입시", instrument: "piano" },
  { composer: "M. Ravel", title: "Gaspard de la nuit", category: "입시", instrument: "piano" },

  // ─── Rachmaninoff ───
  { composer: "S. Rachmaninoff", title: "Piano Concerto No.2, Op.18", category: "콩쿠르", instrument: "piano" },
  { composer: "S. Rachmaninoff", title: "Piano Concerto No.3, Op.30", category: "콩쿠르", instrument: "piano" },
  { composer: "S. Rachmaninoff", title: "Piano Sonata No.2, Op.36", category: "입시", instrument: "piano" },

  // ─── Prokofiev ───
  { composer: "S. Prokofiev", title: "Piano Sonata No.7, Op.83", category: "입시", instrument: "piano" },
  { composer: "S. Prokofiev", title: "Piano Concerto No.3, Op.26", category: "콩쿠르", instrument: "piano" },
  { composer: "S. Prokofiev", title: "Toccata in D minor, Op.11", category: "입시", instrument: "piano" },

  // ─── Schubert ───
  { composer: "F. Schubert", title: "Piano Sonata No.21, D.960", category: "입시", instrument: "piano" },
  { composer: "F. Schubert", title: "Wanderer Fantasy, D.760", category: "입시", instrument: "piano" },

  // ─── Tchaikovsky Piano ───
  { composer: "P. I. Tchaikovsky", title: "Piano Concerto No.1, Op.23", category: "콩쿠르", instrument: "piano" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎻 바이올린
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  { composer: "J. S. Bach", title: "Violin Partita No.2 in D minor, BWV 1004 (Chaconne)", category: "입시", instrument: "violin" },
  { composer: "J. S. Bach", title: "Violin Sonata No.1 in G minor, BWV 1001", category: "입시", instrument: "violin" },
  { composer: "L. v. Beethoven", title: "Violin Sonata No.5 'Spring', Op.24", category: "레슨", instrument: "violin" },
  { composer: "L. v. Beethoven", title: "Violin Sonata No.9 'Kreutzer', Op.47", category: "입시", instrument: "violin" },
  { composer: "L. v. Beethoven", title: "Violin Concerto in D major, Op.61", category: "콩쿠르", instrument: "violin" },
  { composer: "J. Brahms", title: "Violin Concerto in D major, Op.77", category: "콩쿠르", instrument: "violin" },
  { composer: "J. Brahms", title: "Violin Sonata No.1 in G major, Op.78", category: "입시", instrument: "violin" },
  { composer: "P. I. Tchaikovsky", title: "Violin Concerto in D major, Op.35", category: "콩쿠르", instrument: "violin" },
  { composer: "F. Mendelssohn", title: "Violin Concerto in E minor, Op.64", category: "콩쿠르", instrument: "violin" },
  { composer: "J. Sibelius", title: "Violin Concerto in D minor, Op.47", category: "콩쿠르", instrument: "violin" },
  { composer: "W. A. Mozart", title: "Violin Concerto No.5 in A major, K.219", category: "콩쿠르", instrument: "violin" },
  { composer: "C. Saint-Saëns", title: "Introduction and Rondo Capriccioso, Op.28", category: "콩쿠르", instrument: "violin" },
  { composer: "M. Bruch", title: "Violin Concerto No.1 in G minor, Op.26", category: "콩쿠르", instrument: "violin" },
  { composer: "N. Paganini", title: "Violin Concerto No.1 in D major, Op.6", category: "콩쿠르", instrument: "violin" },
  { composer: "C. Franck", title: "Violin Sonata in A major", category: "입시", instrument: "violin" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎻 첼로
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  { composer: "J. S. Bach", title: "Cello Suite No.1 in G major, BWV 1007", category: "레슨", instrument: "cello" },
  { composer: "J. S. Bach", title: "Cello Suite No.3 in C major, BWV 1009", category: "입시", instrument: "cello" },
  { composer: "J. S. Bach", title: "Cello Suite No.5 in C minor, BWV 1011", category: "입시", instrument: "cello" },
  { composer: "L. v. Beethoven", title: "Cello Sonata No.3 in A major, Op.69", category: "입시", instrument: "cello" },
  { composer: "A. Dvořák", title: "Cello Concerto in B minor, Op.104", category: "콩쿠르", instrument: "cello" },
  { composer: "R. Schumann", title: "Cello Concerto in A minor, Op.129", category: "콩쿠르", instrument: "cello" },
  { composer: "E. Elgar", title: "Cello Concerto in E minor, Op.85", category: "콩쿠르", instrument: "cello" },
  { composer: "C. Saint-Saëns", title: "Cello Concerto No.1 in A minor, Op.33", category: "콩쿠르", instrument: "cello" },
  { composer: "J. Haydn", title: "Cello Concerto No.1 in C major, Hob.VIIb:1", category: "콩쿠르", instrument: "cello" },
  { composer: "J. Brahms", title: "Cello Sonata No.1 in E minor, Op.38", category: "입시", instrument: "cello" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🪈 플루트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  { composer: "J. S. Bach", title: "Flute Sonata in B minor, BWV 1030", category: "입시", instrument: "flute" },
  { composer: "W. A. Mozart", title: "Flute Concerto No.1 in G major, K.313", category: "콩쿠르", instrument: "flute" },
  { composer: "W. A. Mozart", title: "Flute Concerto No.2 in D major, K.314", category: "콩쿠르", instrument: "flute" },
  { composer: "C. Debussy", title: "Syrinx for Solo Flute", category: "입시", instrument: "flute" },
  { composer: "J. Ibert", title: "Flute Concerto", category: "콩쿠르", instrument: "flute" },
  { composer: "F. Poulenc", title: "Flute Sonata", category: "입시", instrument: "flute" },
  { composer: "C. P. E. Bach", title: "Flute Concerto in D minor, Wq.22", category: "콩쿠르", instrument: "flute" },
  { composer: "P. Gaubert", title: "Fantaisie for Flute and Piano", category: "입시", instrument: "flute" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎵 클라리넷
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  { composer: "W. A. Mozart", title: "Clarinet Concerto in A major, K.622", category: "콩쿠르", instrument: "clarinet" },
  { composer: "C. M. v. Weber", title: "Clarinet Concerto No.1 in F minor, Op.73", category: "콩쿠르", instrument: "clarinet" },
  { composer: "C. M. v. Weber", title: "Clarinet Concerto No.2 in E-flat major, Op.74", category: "콩쿠르", instrument: "clarinet" },
  { composer: "J. Brahms", title: "Clarinet Sonata No.1 in F minor, Op.120-1", category: "입시", instrument: "clarinet" },
  { composer: "J. Brahms", title: "Clarinet Sonata No.2 in E-flat major, Op.120-2", category: "입시", instrument: "clarinet" },
  { composer: "C. Debussy", title: "Première Rhapsodie for Clarinet", category: "입시", instrument: "clarinet" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎤 성악
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  { composer: "F. Schubert", title: "Erlkönig, D.328", category: "입시", instrument: "vocal" },
  { composer: "F. Schubert", title: "Ave Maria, D.839", category: "레슨", instrument: "vocal" },
  { composer: "F. Schubert", title: "Die Forelle, D.550", category: "레슨", instrument: "vocal" },
  { composer: "R. Schumann", title: "Dichterliebe, Op.48", category: "입시", instrument: "vocal" },
  { composer: "G. Puccini", title: "O mio babbino caro (Gianni Schicchi)", category: "콩쿠르", instrument: "vocal" },
  { composer: "G. Puccini", title: "Nessun dorma (Turandot)", category: "콩쿠르", instrument: "vocal" },
  { composer: "W. A. Mozart", title: "Dove sono (Le nozze di Figaro)", category: "입시", instrument: "vocal" },
  { composer: "G. Verdi", title: "La donna è mobile (Rigoletto)", category: "콩쿠르", instrument: "vocal" },
];

/** 악기별 한글 라벨 */
export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  piano: "피아노",
  violin: "바이올린",
  cello: "첼로",
  flute: "플루트",
  clarinet: "클라리넷",
  vocal: "성악",
};
