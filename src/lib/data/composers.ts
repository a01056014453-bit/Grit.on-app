/**
 * 서양음악 작곡가 전체 목록
 * 출처: 위키백과 서양음악 작곡가 목록 기반 + 보충
 */

export type InstrumentCategory = "piano" | "violin" | "cello" | "flute" | "clarinet" | "vocal" | "organ" | "guitar" | "orchestra" | "opera" | "chamber";

export interface ComposerEntry {
  name: string;        // "F. Chopin" 형식
  fullName: string;    // 풀네임
  era: Era;
  birthYear: number | null;
  deathYear: number | null;
  nationality: string;
  instruments: InstrumentCategory[]; // 주요 악기/장르
}

export type Era = "medieval" | "renaissance" | "baroque" | "classical" | "romantic" | "modern";

export const ERA_LABELS: Record<Era, string> = {
  medieval: "Medieval",
  renaissance: "Renaissance",
  baroque: "Baroque",
  classical: "Classical",
  romantic: "Romantic",
  modern: "Modern / 20th Century",
};

export const COMPOSERS: ComposerEntry[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Medieval
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "Leonin", fullName: "Leonin (Léonin)", era: "medieval", birthYear: 1135, deathYear: 1201, nationality: "French", instruments: ["organ", "vocal"] },
  { name: "Perotin", fullName: "Perotin (Pérotin)", era: "medieval", birthYear: 1160, deathYear: 1230, nationality: "French", instruments: ["vocal"] },
  { name: "H. von Bingen", fullName: "Hildegard von Bingen", era: "medieval", birthYear: 1098, deathYear: 1179, nationality: "German", instruments: ["vocal"] },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Renaissance
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "J. des Prez", fullName: "Josquin des Prez", era: "renaissance", birthYear: 1450, deathYear: 1521, nationality: "Franco-Flemish", instruments: ["vocal"] },
  { name: "G. P. da Palestrina", fullName: "Giovanni Pierluigi da Palestrina", era: "renaissance", birthYear: 1525, deathYear: 1594, nationality: "Italian", instruments: ["vocal"] },
  { name: "J. Ockeghem", fullName: "Johannes Ockeghem", era: "renaissance", birthYear: 1420, deathYear: 1497, nationality: "Franco-Flemish", instruments: ["vocal"] },
  { name: "T. L. de Victoria", fullName: "Tomás Luis de Victoria", era: "renaissance", birthYear: 1548, deathYear: 1611, nationality: "Spanish", instruments: ["vocal"] },
  { name: "J. Dunstaple", fullName: "John Dunstaple", era: "renaissance", birthYear: 1390, deathYear: 1453, nationality: "English", instruments: ["vocal"] },
  { name: "T. Tallis", fullName: "Thomas Tallis", era: "renaissance", birthYear: 1506, deathYear: 1585, nationality: "English", instruments: ["organ", "vocal"] },
  { name: "O. di Lasso", fullName: "Orlando di Lasso", era: "renaissance", birthYear: 1532, deathYear: 1594, nationality: "Franco-Flemish", instruments: ["vocal"] },
  { name: "G. Gabrieli", fullName: "Giovanni Gabrieli", era: "renaissance", birthYear: 1557, deathYear: 1612, nationality: "Italian", instruments: ["organ", "vocal", "orchestra"] },
  { name: "C. Gesualdo", fullName: "Carlo Gesualdo", era: "renaissance", birthYear: 1566, deathYear: 1613, nationality: "Italian", instruments: ["vocal"] },
  { name: "A. Brumel", fullName: "Antoine Brumel", era: "renaissance", birthYear: 1462, deathYear: 1513, nationality: "French", instruments: ["vocal"] },
  { name: "H. Praetorius", fullName: "Hieronymus Praetorius", era: "renaissance", birthYear: 1560, deathYear: 1629, nationality: "German", instruments: ["organ", "vocal"] },
  { name: "J. Shepherd", fullName: "John Shepherd", era: "renaissance", birthYear: 1515, deathYear: 1558, nationality: "English", instruments: ["vocal"] },
  { name: "D. Ortiz", fullName: "Diego Ortiz", era: "renaissance", birthYear: 1510, deathYear: 1570, nationality: "Spanish", instruments: ["cello", "chamber"] },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Baroque
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "C. Monteverdi", fullName: "Claudio Monteverdi", era: "baroque", birthYear: 1567, deathYear: 1643, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "H. Schütz", fullName: "Heinrich Schütz", era: "baroque", birthYear: 1585, deathYear: 1672, nationality: "German", instruments: ["vocal", "organ"] },
  { name: "J. Pachelbel", fullName: "Johann Pachelbel", era: "baroque", birthYear: 1653, deathYear: 1706, nationality: "German", instruments: ["organ", "chamber"] },
  { name: "J.-P. Rameau", fullName: "Jean-Philippe Rameau", era: "baroque", birthYear: 1683, deathYear: 1764, nationality: "French", instruments: ["piano", "opera", "orchestra"] },
  { name: "J.-B. Lully", fullName: "Jean-Baptiste Lully", era: "baroque", birthYear: 1632, deathYear: 1687, nationality: "French-Italian", instruments: ["opera", "orchestra"] },
  { name: "T. A. Vitali", fullName: "Tomaso Antonio Vitali", era: "baroque", birthYear: 1663, deathYear: 1745, nationality: "Italian", instruments: ["violin"] },
  { name: "A. Vivaldi", fullName: "Antonio Vivaldi", era: "baroque", birthYear: 1678, deathYear: 1741, nationality: "Italian", instruments: ["violin", "orchestra"] },
  { name: "D. Scarlatti", fullName: "Domenico Scarlatti", era: "baroque", birthYear: 1685, deathYear: 1757, nationality: "Italian", instruments: ["piano"] },
  { name: "A. Scarlatti", fullName: "Alessandro Scarlatti", era: "baroque", birthYear: 1660, deathYear: 1725, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "T. Albinoni", fullName: "Tomaso Albinoni", era: "baroque", birthYear: 1671, deathYear: 1751, nationality: "Italian", instruments: ["violin", "orchestra", "opera"] },
  { name: "A. Corelli", fullName: "Arcangelo Corelli", era: "baroque", birthYear: 1653, deathYear: 1713, nationality: "Italian", instruments: ["violin", "chamber", "orchestra"] },
  { name: "F. Couperin", fullName: "François Couperin", era: "baroque", birthYear: 1668, deathYear: 1733, nationality: "French", instruments: ["piano", "organ"] },
  { name: "G. Tartini", fullName: "Giuseppe Tartini", era: "baroque", birthYear: 1692, deathYear: 1770, nationality: "Italian", instruments: ["violin"] },
  { name: "G. P. Telemann", fullName: "Georg Philipp Telemann", era: "baroque", birthYear: 1681, deathYear: 1767, nationality: "German", instruments: ["orchestra", "chamber", "flute", "vocal"] },
  { name: "H. Purcell", fullName: "Henry Purcell", era: "baroque", birthYear: 1659, deathYear: 1695, nationality: "English", instruments: ["opera", "vocal", "organ", "chamber"] },
  { name: "J. S. Bach", fullName: "Johann Sebastian Bach", era: "baroque", birthYear: 1685, deathYear: 1750, nationality: "German", instruments: ["piano", "organ", "orchestra", "chamber", "vocal"] },
  { name: "G. F. Handel", fullName: "George Frideric Handel", era: "baroque", birthYear: 1685, deathYear: 1759, nationality: "German-English", instruments: ["opera", "vocal", "organ", "orchestra"] },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Classical
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "J. Stamitz", fullName: "Johann Stamitz", era: "classical", birthYear: 1717, deathYear: 1757, nationality: "Czech", instruments: ["orchestra", "violin"] },
  { name: "C. W. Gluck", fullName: "Christoph Willibald Gluck", era: "classical", birthYear: 1714, deathYear: 1787, nationality: "German", instruments: ["opera"] },
  { name: "C. P. E. Bach", fullName: "Carl Philipp Emanuel Bach", era: "classical", birthYear: 1714, deathYear: 1788, nationality: "German", instruments: ["piano", "orchestra", "chamber"] },
  { name: "J. C. Bach", fullName: "Johann Christian Bach", era: "classical", birthYear: 1735, deathYear: 1782, nationality: "German", instruments: ["piano", "opera", "orchestra"] },
  { name: "L. Mozart", fullName: "Leopold Mozart", era: "classical", birthYear: 1719, deathYear: 1787, nationality: "Austrian", instruments: ["violin", "orchestra"] },
  { name: "L. Boccherini", fullName: "Luigi Boccherini", era: "classical", birthYear: 1743, deathYear: 1805, nationality: "Italian", instruments: ["cello", "chamber", "orchestra"] },
  { name: "J. Haydn", fullName: "Franz Joseph Haydn", era: "classical", birthYear: 1732, deathYear: 1809, nationality: "Austrian", instruments: ["piano", "orchestra", "chamber", "vocal"] },
  { name: "F.-J. Gossec", fullName: "François-Joseph Gossec", era: "classical", birthYear: 1734, deathYear: 1829, nationality: "French", instruments: ["orchestra"] },
  { name: "W. A. Mozart", fullName: "Wolfgang Amadeus Mozart", era: "classical", birthYear: 1756, deathYear: 1791, nationality: "Austrian", instruments: ["piano", "violin", "orchestra", "opera", "chamber", "vocal"] },
  { name: "L. v. Beethoven", fullName: "Ludwig van Beethoven", era: "classical", birthYear: 1770, deathYear: 1827, nationality: "German", instruments: ["piano", "violin", "cello", "orchestra", "chamber"] },
  { name: "A. Salieri", fullName: "Antonio Salieri", era: "classical", birthYear: 1750, deathYear: 1825, nationality: "Italian", instruments: ["opera", "orchestra"] },
  { name: "F. Sor", fullName: "Fernando Sor", era: "classical", birthYear: 1778, deathYear: 1839, nationality: "Spanish", instruments: ["guitar"] },
  { name: "C. Czerny", fullName: "Carl Czerny", era: "classical", birthYear: 1791, deathYear: 1857, nationality: "Austrian", instruments: ["piano"] },
  { name: "J. N. Hummel", fullName: "Johann Nepomuk Hummel", era: "classical", birthYear: 1778, deathYear: 1837, nationality: "Austrian", instruments: ["piano", "chamber"] },
  { name: "M. Clementi", fullName: "Muzio Clementi", era: "classical", birthYear: 1752, deathYear: 1832, nationality: "Italian", instruments: ["piano"] },
  { name: "F. Kuhlau", fullName: "Friedrich Kuhlau", era: "classical", birthYear: 1786, deathYear: 1832, nationality: "German-Danish", instruments: ["piano", "flute", "opera"] },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Romantic
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "G. Rossini", fullName: "Gioachino Rossini", era: "romantic", birthYear: 1792, deathYear: 1868, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "C. Gounod", fullName: "Charles Gounod", era: "romantic", birthYear: 1818, deathYear: 1893, nationality: "French", instruments: ["opera", "vocal"] },
  { name: "A. Glazunov", fullName: "Alexander Glazunov", era: "romantic", birthYear: 1865, deathYear: 1936, nationality: "Russian", instruments: ["orchestra", "violin", "piano"] },
  { name: "M. Glinka", fullName: "Mikhail Glinka", era: "romantic", birthYear: 1803, deathYear: 1857, nationality: "Russian", instruments: ["opera", "orchestra"] },
  { name: "S. Rachmaninoff", fullName: "Sergei Rachmaninoff", era: "romantic", birthYear: 1873, deathYear: 1943, nationality: "Russian", instruments: ["piano", "orchestra"] },
  { name: "M. Reger", fullName: "Max Reger", era: "romantic", birthYear: 1873, deathYear: 1916, nationality: "German", instruments: ["organ", "piano", "orchestra", "chamber"] },
  { name: "R. Leoncavallo", fullName: "Ruggero Leoncavallo", era: "romantic", birthYear: 1857, deathYear: 1919, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "A. Rubinstein", fullName: "Anton Rubinstein", era: "romantic", birthYear: 1829, deathYear: 1894, nationality: "Russian", instruments: ["piano", "opera", "orchestra"] },
  { name: "F. Liszt", fullName: "Franz Liszt", era: "romantic", birthYear: 1811, deathYear: 1886, nationality: "Hungarian", instruments: ["piano", "orchestra"] },
  { name: "N. Rimsky-Korsakov", fullName: "Nikolai Rimsky-Korsakov", era: "romantic", birthYear: 1844, deathYear: 1908, nationality: "Russian", instruments: ["orchestra", "opera"] },
  { name: "J. Massenet", fullName: "Jules Massenet", era: "romantic", birthYear: 1842, deathYear: 1912, nationality: "French", instruments: ["opera", "vocal", "orchestra"] },
  { name: "P. Mascagni", fullName: "Pietro Mascagni", era: "romantic", birthYear: 1863, deathYear: 1945, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "G. Mahler", fullName: "Gustav Mahler", era: "romantic", birthYear: 1860, deathYear: 1911, nationality: "Austrian", instruments: ["orchestra", "vocal"] },
  { name: "F. Mendelssohn", fullName: "Felix Mendelssohn", era: "romantic", birthYear: 1809, deathYear: 1847, nationality: "German", instruments: ["piano", "violin", "orchestra", "chamber", "vocal"] },
  { name: "M. Mussorgsky", fullName: "Modest Mussorgsky", era: "romantic", birthYear: 1839, deathYear: 1881, nationality: "Russian", instruments: ["piano", "opera", "orchestra"] },
  { name: "R. Wagner", fullName: "Richard Wagner", era: "romantic", birthYear: 1813, deathYear: 1883, nationality: "German", instruments: ["opera", "orchestra"] },
  { name: "G. Verdi", fullName: "Giuseppe Verdi", era: "romantic", birthYear: 1813, deathYear: 1901, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "H. Berlioz", fullName: "Hector Berlioz", era: "romantic", birthYear: 1803, deathYear: 1869, nationality: "French", instruments: ["orchestra", "opera", "vocal"] },
  { name: "C. M. v. Weber", fullName: "Carl Maria von Weber", era: "romantic", birthYear: 1786, deathYear: 1826, nationality: "German", instruments: ["opera", "piano", "orchestra", "clarinet"] },
  { name: "A. Borodin", fullName: "Alexander Borodin", era: "romantic", birthYear: 1833, deathYear: 1887, nationality: "Russian", instruments: ["orchestra", "opera", "chamber"] },
  { name: "H. Wolf", fullName: "Hugo Wolf", era: "romantic", birthYear: 1860, deathYear: 1903, nationality: "Austrian", instruments: ["vocal", "piano"] },
  { name: "J. Brahms", fullName: "Johannes Brahms", era: "romantic", birthYear: 1833, deathYear: 1897, nationality: "German", instruments: ["piano", "violin", "cello", "orchestra", "chamber", "vocal"] },
  { name: "A. Bruckner", fullName: "Anton Bruckner", era: "romantic", birthYear: 1824, deathYear: 1896, nationality: "Austrian", instruments: ["orchestra", "organ", "vocal"] },
  { name: "M. Bruch", fullName: "Max Bruch", era: "romantic", birthYear: 1838, deathYear: 1920, nationality: "German", instruments: ["violin", "orchestra", "vocal"] },
  { name: "H. Wieniawski", fullName: "Henryk Wieniawski", era: "romantic", birthYear: 1835, deathYear: 1880, nationality: "Polish", instruments: ["violin"] },
  { name: "G. Bizet", fullName: "Georges Bizet", era: "romantic", birthYear: 1838, deathYear: 1875, nationality: "French", instruments: ["opera", "orchestra", "piano"] },
  { name: "P. de Sarasate", fullName: "Pablo de Sarasate", era: "romantic", birthYear: 1844, deathYear: 1908, nationality: "Spanish", instruments: ["violin"] },
  { name: "F. Tárrega", fullName: "Francisco Tárrega", era: "romantic", birthYear: 1852, deathYear: 1909, nationality: "Spanish", instruments: ["guitar"] },
  { name: "C. Saint-Saëns", fullName: "Camille Saint-Saëns", era: "romantic", birthYear: 1835, deathYear: 1921, nationality: "French", instruments: ["piano", "organ", "orchestra", "opera", "chamber"] },
  { name: "F. Chopin", fullName: "Frédéric Chopin", era: "romantic", birthYear: 1810, deathYear: 1849, nationality: "Polish", instruments: ["piano"] },
  { name: "R. Schumann", fullName: "Robert Schumann", era: "romantic", birthYear: 1810, deathYear: 1856, nationality: "German", instruments: ["piano", "orchestra", "vocal", "chamber"] },
  { name: "C. Schumann", fullName: "Clara Schumann", era: "romantic", birthYear: 1819, deathYear: 1896, nationality: "German", instruments: ["piano"] },
  { name: "F. Schubert", fullName: "Franz Schubert", era: "romantic", birthYear: 1797, deathYear: 1828, nationality: "Austrian", instruments: ["piano", "vocal", "chamber", "orchestra"] },
  { name: "J. Strauss I", fullName: "Johann Strauss I", era: "romantic", birthYear: 1804, deathYear: 1849, nationality: "Austrian", instruments: ["orchestra"] },
  { name: "J. Strauss II", fullName: "Johann Strauss II", era: "romantic", birthYear: 1825, deathYear: 1899, nationality: "Austrian", instruments: ["orchestra", "opera"] },
  { name: "A. Adam", fullName: "Adolphe Adam", era: "romantic", birthYear: 1803, deathYear: 1856, nationality: "French", instruments: ["opera", "orchestra"] },
  { name: "I. Albéniz", fullName: "Isaac Albéniz", era: "romantic", birthYear: 1860, deathYear: 1909, nationality: "Spanish", instruments: ["piano", "opera"] },
  { name: "M. de Falla", fullName: "Manuel de Falla", era: "romantic", birthYear: 1876, deathYear: 1946, nationality: "Spanish", instruments: ["piano", "orchestra", "opera", "guitar"] },
  { name: "J. Offenbach", fullName: "Jacques Offenbach", era: "romantic", birthYear: 1819, deathYear: 1880, nationality: "French-German", instruments: ["opera", "cello"] },
  { name: "E. Elgar", fullName: "Edward Elgar", era: "romantic", birthYear: 1857, deathYear: 1934, nationality: "English", instruments: ["orchestra", "violin", "cello", "chamber"] },
  { name: "P. I. Tchaikovsky", fullName: "Pyotr Ilyich Tchaikovsky", era: "romantic", birthYear: 1840, deathYear: 1893, nationality: "Russian", instruments: ["piano", "violin", "orchestra", "opera"] },
  { name: "N. Paganini", fullName: "Niccolò Paganini", era: "romantic", birthYear: 1782, deathYear: 1840, nationality: "Italian", instruments: ["violin"] },
  { name: "G. Fauré", fullName: "Gabriel Fauré", era: "romantic", birthYear: 1845, deathYear: 1924, nationality: "French", instruments: ["piano", "vocal", "chamber", "orchestra"] },
  { name: "G. Puccini", fullName: "Giacomo Puccini", era: "romantic", birthYear: 1858, deathYear: 1924, nationality: "Italian", instruments: ["opera", "vocal"] },
  { name: "C. Franck", fullName: "César Franck", era: "romantic", birthYear: 1822, deathYear: 1890, nationality: "Belgian-French", instruments: ["organ", "piano", "orchestra", "chamber"] },
  { name: "E. Ysaÿe", fullName: "Eugène Ysaÿe", era: "romantic", birthYear: 1858, deathYear: 1931, nationality: "Belgian", instruments: ["violin"] },
  { name: "F. Burgmüller", fullName: "Friedrich Burgmüller", era: "romantic", birthYear: 1806, deathYear: 1874, nationality: "German", instruments: ["piano"] },
  { name: "R. Vaughan Williams", fullName: "Ralph Vaughan Williams", era: "romantic", birthYear: 1872, deathYear: 1958, nationality: "English", instruments: ["orchestra", "vocal", "opera", "chamber"] },
  { name: "G. Holst", fullName: "Gustav Holst", era: "romantic", birthYear: 1874, deathYear: 1934, nationality: "English", instruments: ["orchestra", "vocal"] },
  { name: "C. Nielsen", fullName: "Carl Nielsen", era: "romantic", birthYear: 1865, deathYear: 1931, nationality: "Danish", instruments: ["orchestra", "chamber", "opera", "flute", "clarinet"] },
  { name: "J. Sibelius", fullName: "Jean Sibelius", era: "romantic", birthYear: 1865, deathYear: 1957, nationality: "Finnish", instruments: ["orchestra", "violin", "chamber"] },
  { name: "F. Kreisler", fullName: "Fritz Kreisler", era: "romantic", birthYear: 1875, deathYear: 1962, nationality: "Austrian", instruments: ["violin"] },
  { name: "A. Dvořák", fullName: "Antonín Dvořák", era: "romantic", birthYear: 1841, deathYear: 1904, nationality: "Czech", instruments: ["orchestra", "chamber", "piano", "opera", "cello"] },
  { name: "B. Smetana", fullName: "Bedřich Smetana", era: "romantic", birthYear: 1824, deathYear: 1884, nationality: "Czech", instruments: ["orchestra", "opera", "piano"] },
  { name: "E. Grieg", fullName: "Edvard Grieg", era: "romantic", birthYear: 1843, deathYear: 1907, nationality: "Norwegian", instruments: ["piano", "orchestra", "vocal", "chamber"] },
  { name: "R. Strauss", fullName: "Richard Strauss", era: "romantic", birthYear: 1864, deathYear: 1949, nationality: "German", instruments: ["orchestra", "opera", "vocal"] },
  { name: "A. Scriabin", fullName: "Alexander Scriabin", era: "romantic", birthYear: 1872, deathYear: 1915, nationality: "Russian", instruments: ["piano", "orchestra"] },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Modern / 20th Century
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "C. Debussy", fullName: "Claude Debussy", era: "modern", birthYear: 1862, deathYear: 1918, nationality: "French", instruments: ["piano", "orchestra", "chamber", "vocal"] },
  { name: "M. Ravel", fullName: "Maurice Ravel", era: "modern", birthYear: 1875, deathYear: 1937, nationality: "French", instruments: ["piano", "orchestra", "chamber", "opera"] },
  { name: "O. Respighi", fullName: "Ottorino Respighi", era: "modern", birthYear: 1879, deathYear: 1936, nationality: "Italian", instruments: ["orchestra", "violin", "vocal"] },
  { name: "S. Barber", fullName: "Samuel Barber", era: "modern", birthYear: 1910, deathYear: 1981, nationality: "American", instruments: ["orchestra", "vocal", "piano", "opera"] },
  { name: "A. Schoenberg", fullName: "Arnold Schoenberg", era: "modern", birthYear: 1874, deathYear: 1951, nationality: "Austrian-American", instruments: ["orchestra", "chamber", "vocal", "piano"] },
  { name: "C. Ives", fullName: "Charles Ives", era: "modern", birthYear: 1874, deathYear: 1954, nationality: "American", instruments: ["orchestra", "piano", "chamber", "vocal"] },
  { name: "G. Gershwin", fullName: "George Gershwin", era: "modern", birthYear: 1898, deathYear: 1937, nationality: "American", instruments: ["piano", "orchestra", "opera"] },
  { name: "P. Glass", fullName: "Philip Glass", era: "modern", birthYear: 1937, deathYear: null, nationality: "American", instruments: ["piano", "orchestra", "opera", "chamber"] },
  { name: "T. Takemitsu", fullName: "Tōru Takemitsu", era: "modern", birthYear: 1930, deathYear: 1996, nationality: "Japanese", instruments: ["orchestra", "guitar", "piano", "chamber"] },
  { name: "W. Lutosławski", fullName: "Witold Lutosławski", era: "modern", birthYear: 1913, deathYear: 1994, nationality: "Polish", instruments: ["orchestra", "piano", "chamber"] },
  { name: "O. Messiaen", fullName: "Olivier Messiaen", era: "modern", birthYear: 1908, deathYear: 1992, nationality: "French", instruments: ["organ", "piano", "orchestra"] },
  { name: "D. Milhaud", fullName: "Darius Milhaud", era: "modern", birthYear: 1892, deathYear: 1974, nationality: "French", instruments: ["orchestra", "opera", "chamber", "piano"] },
  { name: "B. Bartók", fullName: "Béla Bartók", era: "modern", birthYear: 1881, deathYear: 1945, nationality: "Hungarian", instruments: ["piano", "orchestra", "chamber", "violin"] },
  { name: "L. Bernstein", fullName: "Leonard Bernstein", era: "modern", birthYear: 1918, deathYear: 1990, nationality: "American", instruments: ["orchestra", "opera", "piano", "vocal"] },
  { name: "A. Berg", fullName: "Alban Berg", era: "modern", birthYear: 1885, deathYear: 1935, nationality: "Austrian", instruments: ["opera", "orchestra", "chamber", "violin"] },
  { name: "L. Berio", fullName: "Luciano Berio", era: "modern", birthYear: 1925, deathYear: 2003, nationality: "Italian", instruments: ["orchestra", "vocal", "chamber"] },
  { name: "A. Webern", fullName: "Anton Webern", era: "modern", birthYear: 1883, deathYear: 1945, nationality: "Austrian", instruments: ["orchestra", "chamber", "vocal"] },
  { name: "B. Britten", fullName: "Benjamin Britten", era: "modern", birthYear: 1913, deathYear: 1976, nationality: "English", instruments: ["opera", "orchestra", "vocal", "chamber", "cello"] },
  { name: "A. Schnittke", fullName: "Alfred Schnittke", era: "modern", birthYear: 1934, deathYear: 1998, nationality: "Russian", instruments: ["orchestra", "chamber", "violin", "cello"] },
  { name: "H. Villa-Lobos", fullName: "Heitor Villa-Lobos", era: "modern", birthYear: 1887, deathYear: 1959, nationality: "Brazilian", instruments: ["guitar", "piano", "orchestra", "chamber", "cello"] },
  { name: "E. Satie", fullName: "Erik Satie", era: "modern", birthYear: 1866, deathYear: 1925, nationality: "French", instruments: ["piano"] },
  { name: "D. Shostakovich", fullName: "Dmitri Shostakovich", era: "modern", birthYear: 1906, deathYear: 1975, nationality: "Russian", instruments: ["orchestra", "piano", "chamber", "opera", "vocal"] },
  { name: "K. Stockhausen", fullName: "Karlheinz Stockhausen", era: "modern", birthYear: 1928, deathYear: 2007, nationality: "German", instruments: ["orchestra", "piano", "organ"] },
  { name: "I. Stravinsky", fullName: "Igor Stravinsky", era: "modern", birthYear: 1882, deathYear: 1971, nationality: "Russian-American", instruments: ["orchestra", "piano", "opera", "vocal", "chamber"] },
  { name: "K. Szymanowski", fullName: "Karol Szymanowski", era: "modern", birthYear: 1882, deathYear: 1937, nationality: "Polish", instruments: ["piano", "violin", "orchestra", "opera", "vocal"] },
  { name: "L. Janáček", fullName: "Leoš Janáček", era: "modern", birthYear: 1854, deathYear: 1928, nationality: "Czech", instruments: ["opera", "orchestra", "piano", "chamber", "vocal"] },
  { name: "C. Orff", fullName: "Carl Orff", era: "modern", birthYear: 1895, deathYear: 1982, nationality: "German", instruments: ["orchestra", "vocal", "opera"] },
  { name: "J. Cage", fullName: "John Cage", era: "modern", birthYear: 1912, deathYear: 1992, nationality: "American", instruments: ["piano", "orchestra", "chamber"] },
  { name: "F. Poulenc", fullName: "Francis Poulenc", era: "modern", birthYear: 1899, deathYear: 1963, nationality: "French", instruments: ["piano", "vocal", "opera", "chamber", "flute"] },
  { name: "S. Prokofiev", fullName: "Sergei Prokofiev", era: "modern", birthYear: 1891, deathYear: 1953, nationality: "Russian", instruments: ["piano", "orchestra", "opera", "violin", "cello"] },
  { name: "A. Piazzolla", fullName: "Astor Piazzolla", era: "modern", birthYear: 1921, deathYear: 1992, nationality: "Argentine", instruments: ["chamber", "orchestra"] },
  { name: "A. Khachaturian", fullName: "Aram Khachaturian", era: "modern", birthYear: 1903, deathYear: 1978, nationality: "Armenian", instruments: ["orchestra", "piano", "violin"] },
  { name: "P. Hindemith", fullName: "Paul Hindemith", era: "modern", birthYear: 1895, deathYear: 1963, nationality: "German-American", instruments: ["orchestra", "chamber", "violin", "opera", "piano"] },
  { name: "N. Rota", fullName: "Nino Rota", era: "modern", birthYear: 1911, deathYear: 1979, nationality: "Italian", instruments: ["orchestra", "opera", "chamber"] },
  { name: "J. Ibert", fullName: "Jacques Ibert", era: "modern", birthYear: 1890, deathYear: 1962, nationality: "French", instruments: ["orchestra", "flute", "opera", "chamber"] },
  { name: "P. Gaubert", fullName: "Philippe Gaubert", era: "modern", birthYear: 1879, deathYear: 1941, nationality: "French", instruments: ["flute", "orchestra"] },
  { name: "M. Nyman", fullName: "Michael Nyman", era: "modern", birthYear: 1944, deathYear: null, nationality: "English", instruments: ["piano", "orchestra", "chamber", "opera"] },
  { name: "G. Finzi", fullName: "Gerald Finzi", era: "modern", birthYear: 1901, deathYear: 1956, nationality: "English", instruments: ["orchestra", "vocal", "clarinet", "chamber"] },

  // ─── Korean Composers ───
  { name: "Nan-pa Hong", fullName: "Hong Nan-pa (홍난파)", era: "modern", birthYear: 1897, deathYear: 1941, nationality: "Korean", instruments: ["violin", "vocal"] },
  { name: "Isang Yun", fullName: "Isang Yun (윤이상)", era: "modern", birthYear: 1917, deathYear: 1995, nationality: "Korean", instruments: ["orchestra", "chamber", "opera"] },
  { name: "Ik-tae Ahn", fullName: "Ahn Ik-tae (안익태)", era: "modern", birthYear: 1906, deathYear: 1965, nationality: "Korean", instruments: ["orchestra"] },
  { name: "Dong-jin Kim", fullName: "Kim Dong-jin (김동진)", era: "modern", birthYear: 1913, deathYear: 2009, nationality: "Korean", instruments: ["vocal", "opera"] },
  { name: "Un-yung Na", fullName: "Na Un-yung (나운영)", era: "modern", birthYear: 1922, deathYear: 1993, nationality: "Korean", instruments: ["orchestra", "vocal"] },
  { name: "Nam June Paik", fullName: "Nam June Paik (백남준)", era: "modern", birthYear: 1932, deathYear: 2006, nationality: "Korean", instruments: ["piano", "orchestra"] },
];

/** 시대별로 그룹핑 */
export function getComposersByEra(): Record<Era, ComposerEntry[]> {
  const result: Record<Era, ComposerEntry[]> = {
    medieval: [], renaissance: [], baroque: [], classical: [], romantic: [], modern: [],
  };
  for (const c of COMPOSERS) {
    result[c.era].push(c);
  }
  return result;
}

/** 총 작곡가 수 */
export const TOTAL_COMPOSERS = COMPOSERS.length;
