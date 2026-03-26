/**
 * 서양음악 작곡가 전체 목록
 * 출처: 위키백과 서양음악 작곡가 목록 기반 + 보충
 */

export interface ComposerEntry {
  name: string;        // "F. Chopin" 형식
  fullName: string;    // 풀네임
  era: Era;
  birthYear: number | null;
  deathYear: number | null;
  nationality: string;
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
  { name: "Leonin", fullName: "Leonin (Léonin)", era: "medieval", birthYear: 1135, deathYear: 1201, nationality: "French" },
  { name: "Perotin", fullName: "Perotin (Pérotin)", era: "medieval", birthYear: 1160, deathYear: 1230, nationality: "French" },
  { name: "H. von Bingen", fullName: "Hildegard von Bingen", era: "medieval", birthYear: 1098, deathYear: 1179, nationality: "German" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Renaissance
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "J. des Prez", fullName: "Josquin des Prez", era: "renaissance", birthYear: 1450, deathYear: 1521, nationality: "Franco-Flemish" },
  { name: "G. P. da Palestrina", fullName: "Giovanni Pierluigi da Palestrina", era: "renaissance", birthYear: 1525, deathYear: 1594, nationality: "Italian" },
  { name: "J. Ockeghem", fullName: "Johannes Ockeghem", era: "renaissance", birthYear: 1420, deathYear: 1497, nationality: "Franco-Flemish" },
  { name: "T. L. de Victoria", fullName: "Tomás Luis de Victoria", era: "renaissance", birthYear: 1548, deathYear: 1611, nationality: "Spanish" },
  { name: "J. Dunstaple", fullName: "John Dunstaple", era: "renaissance", birthYear: 1390, deathYear: 1453, nationality: "English" },
  { name: "T. Tallis", fullName: "Thomas Tallis", era: "renaissance", birthYear: 1506, deathYear: 1585, nationality: "English" },
  { name: "O. di Lasso", fullName: "Orlando di Lasso", era: "renaissance", birthYear: 1532, deathYear: 1594, nationality: "Franco-Flemish" },
  { name: "G. Gabrieli", fullName: "Giovanni Gabrieli", era: "renaissance", birthYear: 1557, deathYear: 1612, nationality: "Italian" },
  { name: "C. Gesualdo", fullName: "Carlo Gesualdo", era: "renaissance", birthYear: 1566, deathYear: 1613, nationality: "Italian" },
  { name: "A. Brumel", fullName: "Antoine Brumel", era: "renaissance", birthYear: 1462, deathYear: 1513, nationality: "French" },
  { name: "H. Praetorius", fullName: "Hieronymus Praetorius", era: "renaissance", birthYear: 1560, deathYear: 1629, nationality: "German" },
  { name: "J. Shepherd", fullName: "John Shepherd", era: "renaissance", birthYear: 1515, deathYear: 1558, nationality: "English" },
  { name: "D. Ortiz", fullName: "Diego Ortiz", era: "renaissance", birthYear: 1510, deathYear: 1570, nationality: "Spanish" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Baroque
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "C. Monteverdi", fullName: "Claudio Monteverdi", era: "baroque", birthYear: 1567, deathYear: 1643, nationality: "Italian" },
  { name: "H. Schütz", fullName: "Heinrich Schütz", era: "baroque", birthYear: 1585, deathYear: 1672, nationality: "German" },
  { name: "J. Pachelbel", fullName: "Johann Pachelbel", era: "baroque", birthYear: 1653, deathYear: 1706, nationality: "German" },
  { name: "J.-P. Rameau", fullName: "Jean-Philippe Rameau", era: "baroque", birthYear: 1683, deathYear: 1764, nationality: "French" },
  { name: "J.-B. Lully", fullName: "Jean-Baptiste Lully", era: "baroque", birthYear: 1632, deathYear: 1687, nationality: "French-Italian" },
  { name: "T. A. Vitali", fullName: "Tomaso Antonio Vitali", era: "baroque", birthYear: 1663, deathYear: 1745, nationality: "Italian" },
  { name: "A. Vivaldi", fullName: "Antonio Vivaldi", era: "baroque", birthYear: 1678, deathYear: 1741, nationality: "Italian" },
  { name: "D. Scarlatti", fullName: "Domenico Scarlatti", era: "baroque", birthYear: 1685, deathYear: 1757, nationality: "Italian" },
  { name: "A. Scarlatti", fullName: "Alessandro Scarlatti", era: "baroque", birthYear: 1660, deathYear: 1725, nationality: "Italian" },
  { name: "T. Albinoni", fullName: "Tomaso Albinoni", era: "baroque", birthYear: 1671, deathYear: 1751, nationality: "Italian" },
  { name: "A. Corelli", fullName: "Arcangelo Corelli", era: "baroque", birthYear: 1653, deathYear: 1713, nationality: "Italian" },
  { name: "F. Couperin", fullName: "François Couperin", era: "baroque", birthYear: 1668, deathYear: 1733, nationality: "French" },
  { name: "G. Tartini", fullName: "Giuseppe Tartini", era: "baroque", birthYear: 1692, deathYear: 1770, nationality: "Italian" },
  { name: "G. P. Telemann", fullName: "Georg Philipp Telemann", era: "baroque", birthYear: 1681, deathYear: 1767, nationality: "German" },
  { name: "H. Purcell", fullName: "Henry Purcell", era: "baroque", birthYear: 1659, deathYear: 1695, nationality: "English" },
  { name: "J. S. Bach", fullName: "Johann Sebastian Bach", era: "baroque", birthYear: 1685, deathYear: 1750, nationality: "German" },
  { name: "G. F. Handel", fullName: "George Frideric Handel", era: "baroque", birthYear: 1685, deathYear: 1759, nationality: "German-English" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Classical
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "J. Stamitz", fullName: "Johann Stamitz", era: "classical", birthYear: 1717, deathYear: 1757, nationality: "Czech" },
  { name: "C. W. Gluck", fullName: "Christoph Willibald Gluck", era: "classical", birthYear: 1714, deathYear: 1787, nationality: "German" },
  { name: "C. P. E. Bach", fullName: "Carl Philipp Emanuel Bach", era: "classical", birthYear: 1714, deathYear: 1788, nationality: "German" },
  { name: "J. C. Bach", fullName: "Johann Christian Bach", era: "classical", birthYear: 1735, deathYear: 1782, nationality: "German" },
  { name: "L. Mozart", fullName: "Leopold Mozart", era: "classical", birthYear: 1719, deathYear: 1787, nationality: "Austrian" },
  { name: "L. Boccherini", fullName: "Luigi Boccherini", era: "classical", birthYear: 1743, deathYear: 1805, nationality: "Italian" },
  { name: "J. Haydn", fullName: "Franz Joseph Haydn", era: "classical", birthYear: 1732, deathYear: 1809, nationality: "Austrian" },
  { name: "F.-J. Gossec", fullName: "François-Joseph Gossec", era: "classical", birthYear: 1734, deathYear: 1829, nationality: "French" },
  { name: "W. A. Mozart", fullName: "Wolfgang Amadeus Mozart", era: "classical", birthYear: 1756, deathYear: 1791, nationality: "Austrian" },
  { name: "L. v. Beethoven", fullName: "Ludwig van Beethoven", era: "classical", birthYear: 1770, deathYear: 1827, nationality: "German" },
  { name: "A. Salieri", fullName: "Antonio Salieri", era: "classical", birthYear: 1750, deathYear: 1825, nationality: "Italian" },
  { name: "F. Sor", fullName: "Fernando Sor", era: "classical", birthYear: 1778, deathYear: 1839, nationality: "Spanish" },
  { name: "C. Czerny", fullName: "Carl Czerny", era: "classical", birthYear: 1791, deathYear: 1857, nationality: "Austrian" },
  { name: "J. N. Hummel", fullName: "Johann Nepomuk Hummel", era: "classical", birthYear: 1778, deathYear: 1837, nationality: "Austrian" },
  { name: "M. Clementi", fullName: "Muzio Clementi", era: "classical", birthYear: 1752, deathYear: 1832, nationality: "Italian" },
  { name: "F. Kuhlau", fullName: "Friedrich Kuhlau", era: "classical", birthYear: 1786, deathYear: 1832, nationality: "German-Danish" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Romantic
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "G. Rossini", fullName: "Gioachino Rossini", era: "romantic", birthYear: 1792, deathYear: 1868, nationality: "Italian" },
  { name: "C. Gounod", fullName: "Charles Gounod", era: "romantic", birthYear: 1818, deathYear: 1893, nationality: "French" },
  { name: "A. Glazunov", fullName: "Alexander Glazunov", era: "romantic", birthYear: 1865, deathYear: 1936, nationality: "Russian" },
  { name: "M. Glinka", fullName: "Mikhail Glinka", era: "romantic", birthYear: 1803, deathYear: 1857, nationality: "Russian" },
  { name: "S. Rachmaninoff", fullName: "Sergei Rachmaninoff", era: "romantic", birthYear: 1873, deathYear: 1943, nationality: "Russian" },
  { name: "M. Reger", fullName: "Max Reger", era: "romantic", birthYear: 1873, deathYear: 1916, nationality: "German" },
  { name: "R. Leoncavallo", fullName: "Ruggero Leoncavallo", era: "romantic", birthYear: 1857, deathYear: 1919, nationality: "Italian" },
  { name: "A. Rubinstein", fullName: "Anton Rubinstein", era: "romantic", birthYear: 1829, deathYear: 1894, nationality: "Russian" },
  { name: "F. Liszt", fullName: "Franz Liszt", era: "romantic", birthYear: 1811, deathYear: 1886, nationality: "Hungarian" },
  { name: "N. Rimsky-Korsakov", fullName: "Nikolai Rimsky-Korsakov", era: "romantic", birthYear: 1844, deathYear: 1908, nationality: "Russian" },
  { name: "J. Massenet", fullName: "Jules Massenet", era: "romantic", birthYear: 1842, deathYear: 1912, nationality: "French" },
  { name: "P. Mascagni", fullName: "Pietro Mascagni", era: "romantic", birthYear: 1863, deathYear: 1945, nationality: "Italian" },
  { name: "G. Mahler", fullName: "Gustav Mahler", era: "romantic", birthYear: 1860, deathYear: 1911, nationality: "Austrian" },
  { name: "F. Mendelssohn", fullName: "Felix Mendelssohn", era: "romantic", birthYear: 1809, deathYear: 1847, nationality: "German" },
  { name: "M. Mussorgsky", fullName: "Modest Mussorgsky", era: "romantic", birthYear: 1839, deathYear: 1881, nationality: "Russian" },
  { name: "R. Wagner", fullName: "Richard Wagner", era: "romantic", birthYear: 1813, deathYear: 1883, nationality: "German" },
  { name: "G. Verdi", fullName: "Giuseppe Verdi", era: "romantic", birthYear: 1813, deathYear: 1901, nationality: "Italian" },
  { name: "H. Berlioz", fullName: "Hector Berlioz", era: "romantic", birthYear: 1803, deathYear: 1869, nationality: "French" },
  { name: "C. M. v. Weber", fullName: "Carl Maria von Weber", era: "romantic", birthYear: 1786, deathYear: 1826, nationality: "German" },
  { name: "A. Borodin", fullName: "Alexander Borodin", era: "romantic", birthYear: 1833, deathYear: 1887, nationality: "Russian" },
  { name: "H. Wolf", fullName: "Hugo Wolf", era: "romantic", birthYear: 1860, deathYear: 1903, nationality: "Austrian" },
  { name: "J. Brahms", fullName: "Johannes Brahms", era: "romantic", birthYear: 1833, deathYear: 1897, nationality: "German" },
  { name: "A. Bruckner", fullName: "Anton Bruckner", era: "romantic", birthYear: 1824, deathYear: 1896, nationality: "Austrian" },
  { name: "M. Bruch", fullName: "Max Bruch", era: "romantic", birthYear: 1838, deathYear: 1920, nationality: "German" },
  { name: "H. Wieniawski", fullName: "Henryk Wieniawski", era: "romantic", birthYear: 1835, deathYear: 1880, nationality: "Polish" },
  { name: "G. Bizet", fullName: "Georges Bizet", era: "romantic", birthYear: 1838, deathYear: 1875, nationality: "French" },
  { name: "P. de Sarasate", fullName: "Pablo de Sarasate", era: "romantic", birthYear: 1844, deathYear: 1908, nationality: "Spanish" },
  { name: "F. Tárrega", fullName: "Francisco Tárrega", era: "romantic", birthYear: 1852, deathYear: 1909, nationality: "Spanish" },
  { name: "C. Saint-Saëns", fullName: "Camille Saint-Saëns", era: "romantic", birthYear: 1835, deathYear: 1921, nationality: "French" },
  { name: "F. Chopin", fullName: "Frédéric Chopin", era: "romantic", birthYear: 1810, deathYear: 1849, nationality: "Polish" },
  { name: "R. Schumann", fullName: "Robert Schumann", era: "romantic", birthYear: 1810, deathYear: 1856, nationality: "German" },
  { name: "C. Schumann", fullName: "Clara Schumann", era: "romantic", birthYear: 1819, deathYear: 1896, nationality: "German" },
  { name: "F. Schubert", fullName: "Franz Schubert", era: "romantic", birthYear: 1797, deathYear: 1828, nationality: "Austrian" },
  { name: "J. Strauss I", fullName: "Johann Strauss I", era: "romantic", birthYear: 1804, deathYear: 1849, nationality: "Austrian" },
  { name: "J. Strauss II", fullName: "Johann Strauss II", era: "romantic", birthYear: 1825, deathYear: 1899, nationality: "Austrian" },
  { name: "A. Adam", fullName: "Adolphe Adam", era: "romantic", birthYear: 1803, deathYear: 1856, nationality: "French" },
  { name: "I. Albéniz", fullName: "Isaac Albéniz", era: "romantic", birthYear: 1860, deathYear: 1909, nationality: "Spanish" },
  { name: "M. de Falla", fullName: "Manuel de Falla", era: "romantic", birthYear: 1876, deathYear: 1946, nationality: "Spanish" },
  { name: "J. Offenbach", fullName: "Jacques Offenbach", era: "romantic", birthYear: 1819, deathYear: 1880, nationality: "French-German" },
  { name: "E. Elgar", fullName: "Edward Elgar", era: "romantic", birthYear: 1857, deathYear: 1934, nationality: "English" },
  { name: "P. I. Tchaikovsky", fullName: "Pyotr Ilyich Tchaikovsky", era: "romantic", birthYear: 1840, deathYear: 1893, nationality: "Russian" },
  { name: "N. Paganini", fullName: "Niccolò Paganini", era: "romantic", birthYear: 1782, deathYear: 1840, nationality: "Italian" },
  { name: "G. Fauré", fullName: "Gabriel Fauré", era: "romantic", birthYear: 1845, deathYear: 1924, nationality: "French" },
  { name: "G. Puccini", fullName: "Giacomo Puccini", era: "romantic", birthYear: 1858, deathYear: 1924, nationality: "Italian" },
  { name: "C. Franck", fullName: "César Franck", era: "romantic", birthYear: 1822, deathYear: 1890, nationality: "Belgian-French" },
  { name: "E. Ysaÿe", fullName: "Eugène Ysaÿe", era: "romantic", birthYear: 1858, deathYear: 1931, nationality: "Belgian" },
  { name: "F. Burgmüller", fullName: "Friedrich Burgmüller", era: "romantic", birthYear: 1806, deathYear: 1874, nationality: "German" },
  { name: "R. Vaughan Williams", fullName: "Ralph Vaughan Williams", era: "romantic", birthYear: 1872, deathYear: 1958, nationality: "English" },
  { name: "G. Holst", fullName: "Gustav Holst", era: "romantic", birthYear: 1874, deathYear: 1934, nationality: "English" },
  { name: "C. Nielsen", fullName: "Carl Nielsen", era: "romantic", birthYear: 1865, deathYear: 1931, nationality: "Danish" },
  { name: "J. Sibelius", fullName: "Jean Sibelius", era: "romantic", birthYear: 1865, deathYear: 1957, nationality: "Finnish" },
  { name: "F. Kreisler", fullName: "Fritz Kreisler", era: "romantic", birthYear: 1875, deathYear: 1962, nationality: "Austrian" },
  { name: "A. Dvořák", fullName: "Antonín Dvořák", era: "romantic", birthYear: 1841, deathYear: 1904, nationality: "Czech" },
  { name: "B. Smetana", fullName: "Bedřich Smetana", era: "romantic", birthYear: 1824, deathYear: 1884, nationality: "Czech" },
  { name: "E. Grieg", fullName: "Edvard Grieg", era: "romantic", birthYear: 1843, deathYear: 1907, nationality: "Norwegian" },
  { name: "R. Strauss", fullName: "Richard Strauss", era: "romantic", birthYear: 1864, deathYear: 1949, nationality: "German" },
  { name: "A. Scriabin", fullName: "Alexander Scriabin", era: "romantic", birthYear: 1872, deathYear: 1915, nationality: "Russian" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Modern / 20th Century
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { name: "C. Debussy", fullName: "Claude Debussy", era: "modern", birthYear: 1862, deathYear: 1918, nationality: "French" },
  { name: "M. Ravel", fullName: "Maurice Ravel", era: "modern", birthYear: 1875, deathYear: 1937, nationality: "French" },
  { name: "O. Respighi", fullName: "Ottorino Respighi", era: "modern", birthYear: 1879, deathYear: 1936, nationality: "Italian" },
  { name: "S. Barber", fullName: "Samuel Barber", era: "modern", birthYear: 1910, deathYear: 1981, nationality: "American" },
  { name: "A. Schoenberg", fullName: "Arnold Schoenberg", era: "modern", birthYear: 1874, deathYear: 1951, nationality: "Austrian-American" },
  { name: "C. Ives", fullName: "Charles Ives", era: "modern", birthYear: 1874, deathYear: 1954, nationality: "American" },
  { name: "G. Gershwin", fullName: "George Gershwin", era: "modern", birthYear: 1898, deathYear: 1937, nationality: "American" },
  { name: "P. Glass", fullName: "Philip Glass", era: "modern", birthYear: 1937, deathYear: null, nationality: "American" },
  { name: "T. Takemitsu", fullName: "Tōru Takemitsu", era: "modern", birthYear: 1930, deathYear: 1996, nationality: "Japanese" },
  { name: "W. Lutosławski", fullName: "Witold Lutosławski", era: "modern", birthYear: 1913, deathYear: 1994, nationality: "Polish" },
  { name: "O. Messiaen", fullName: "Olivier Messiaen", era: "modern", birthYear: 1908, deathYear: 1992, nationality: "French" },
  { name: "D. Milhaud", fullName: "Darius Milhaud", era: "modern", birthYear: 1892, deathYear: 1974, nationality: "French" },
  { name: "B. Bartók", fullName: "Béla Bartók", era: "modern", birthYear: 1881, deathYear: 1945, nationality: "Hungarian" },
  { name: "L. Bernstein", fullName: "Leonard Bernstein", era: "modern", birthYear: 1918, deathYear: 1990, nationality: "American" },
  { name: "A. Berg", fullName: "Alban Berg", era: "modern", birthYear: 1885, deathYear: 1935, nationality: "Austrian" },
  { name: "L. Berio", fullName: "Luciano Berio", era: "modern", birthYear: 1925, deathYear: 2003, nationality: "Italian" },
  { name: "A. Webern", fullName: "Anton Webern", era: "modern", birthYear: 1883, deathYear: 1945, nationality: "Austrian" },
  { name: "B. Britten", fullName: "Benjamin Britten", era: "modern", birthYear: 1913, deathYear: 1976, nationality: "English" },
  { name: "A. Schnittke", fullName: "Alfred Schnittke", era: "modern", birthYear: 1934, deathYear: 1998, nationality: "Russian" },
  { name: "H. Villa-Lobos", fullName: "Heitor Villa-Lobos", era: "modern", birthYear: 1887, deathYear: 1959, nationality: "Brazilian" },
  { name: "E. Satie", fullName: "Erik Satie", era: "modern", birthYear: 1866, deathYear: 1925, nationality: "French" },
  { name: "D. Shostakovich", fullName: "Dmitri Shostakovich", era: "modern", birthYear: 1906, deathYear: 1975, nationality: "Russian" },
  { name: "K. Stockhausen", fullName: "Karlheinz Stockhausen", era: "modern", birthYear: 1928, deathYear: 2007, nationality: "German" },
  { name: "I. Stravinsky", fullName: "Igor Stravinsky", era: "modern", birthYear: 1882, deathYear: 1971, nationality: "Russian-American" },
  { name: "K. Szymanowski", fullName: "Karol Szymanowski", era: "modern", birthYear: 1882, deathYear: 1937, nationality: "Polish" },
  { name: "L. Janáček", fullName: "Leoš Janáček", era: "modern", birthYear: 1854, deathYear: 1928, nationality: "Czech" },
  { name: "C. Orff", fullName: "Carl Orff", era: "modern", birthYear: 1895, deathYear: 1982, nationality: "German" },
  { name: "J. Cage", fullName: "John Cage", era: "modern", birthYear: 1912, deathYear: 1992, nationality: "American" },
  { name: "F. Poulenc", fullName: "Francis Poulenc", era: "modern", birthYear: 1899, deathYear: 1963, nationality: "French" },
  { name: "S. Prokofiev", fullName: "Sergei Prokofiev", era: "modern", birthYear: 1891, deathYear: 1953, nationality: "Russian" },
  { name: "A. Piazzolla", fullName: "Astor Piazzolla", era: "modern", birthYear: 1921, deathYear: 1992, nationality: "Argentine" },
  { name: "A. Khachaturian", fullName: "Aram Khachaturian", era: "modern", birthYear: 1903, deathYear: 1978, nationality: "Armenian" },
  { name: "P. Hindemith", fullName: "Paul Hindemith", era: "modern", birthYear: 1895, deathYear: 1963, nationality: "German-American" },
  { name: "N. Rota", fullName: "Nino Rota", era: "modern", birthYear: 1911, deathYear: 1979, nationality: "Italian" },
  { name: "J. Ibert", fullName: "Jacques Ibert", era: "modern", birthYear: 1890, deathYear: 1962, nationality: "French" },
  { name: "P. Gaubert", fullName: "Philippe Gaubert", era: "modern", birthYear: 1879, deathYear: 1941, nationality: "French" },
  { name: "M. Nyman", fullName: "Michael Nyman", era: "modern", birthYear: 1944, deathYear: null, nationality: "English" },
  { name: "G. Finzi", fullName: "Gerald Finzi", era: "modern", birthYear: 1901, deathYear: 1956, nationality: "English" },

  // ─── Korean Composers ───
  { name: "Nan-pa Hong", fullName: "Hong Nan-pa (홍난파)", era: "modern", birthYear: 1897, deathYear: 1941, nationality: "Korean" },
  { name: "Isang Yun", fullName: "Isang Yun (윤이상)", era: "modern", birthYear: 1917, deathYear: 1995, nationality: "Korean" },
  { name: "Ik-tae Ahn", fullName: "Ahn Ik-tae (안익태)", era: "modern", birthYear: 1906, deathYear: 1965, nationality: "Korean" },
  { name: "Dong-jin Kim", fullName: "Kim Dong-jin (김동진)", era: "modern", birthYear: 1913, deathYear: 2009, nationality: "Korean" },
  { name: "Un-yung Na", fullName: "Na Un-yung (나운영)", era: "modern", birthYear: 1922, deathYear: 1993, nationality: "Korean" },
  { name: "Nam June Paik", fullName: "Nam June Paik (백남준)", era: "modern", birthYear: 1932, deathYear: 2006, nationality: "Korean" },
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
