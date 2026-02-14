"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, BookOpen, Music, Volume2, Gauge, Hand } from "lucide-react";

interface MusicTerm {
  term: string;
  korean: string;
  meaning: string;
  category: "tempo" | "dynamics" | "articulation" | "expression" | "technique" | "form" | "ornament";
  language?: "it" | "de" | "fr" | "en";  // 이태리어, 독일어, 프랑스어, 영어
  pronunciation?: string;
}

const musicTerms: MusicTerm[] = [
  // ============ TEMPO - 이태리어 (빠르기) ============
  { term: "Grave", korean: "그라베", meaning: "매우 느리고 장중하게 (25-45 BPM)", category: "tempo", language: "it" },
  { term: "Largo", korean: "라르고", meaning: "매우 느리게 (40-60 BPM)", category: "tempo", language: "it" },
  { term: "Larghetto", korean: "라르게토", meaning: "라르고보다 조금 빠르게 (60-66 BPM)", category: "tempo", language: "it" },
  { term: "Lento", korean: "렌토", meaning: "느리게 (45-60 BPM)", category: "tempo", language: "it" },
  { term: "Adagio", korean: "아다지오", meaning: "느리고 편안하게 (66-76 BPM)", category: "tempo", language: "it" },
  { term: "Adagietto", korean: "아다지에토", meaning: "아다지오보다 조금 빠르게", category: "tempo", language: "it" },
  { term: "Andante", korean: "안단테", meaning: "걷는 빠르기로 (76-108 BPM)", category: "tempo", language: "it" },
  { term: "Andantino", korean: "안단티노", meaning: "안단테보다 조금 빠르게", category: "tempo", language: "it" },
  { term: "Moderato", korean: "모데라토", meaning: "보통 빠르기로 (108-120 BPM)", category: "tempo", language: "it" },
  { term: "Allegretto", korean: "알레그레토", meaning: "조금 빠르게 (112-120 BPM)", category: "tempo", language: "it" },
  { term: "Allegro", korean: "알레그로", meaning: "빠르게 (120-168 BPM)", category: "tempo", language: "it" },
  { term: "Allegro moderato", korean: "알레그로 모데라토", meaning: "적당히 빠르게", category: "tempo", language: "it" },
  { term: "Allegro vivace", korean: "알레그로 비바체", meaning: "빠르고 생기있게", category: "tempo", language: "it" },
  { term: "Vivace", korean: "비바체", meaning: "빠르고 생기있게 (168-176 BPM)", category: "tempo", language: "it" },
  { term: "Vivacissimo", korean: "비바치시모", meaning: "매우 빠르고 생기있게", category: "tempo", language: "it" },
  { term: "Presto", korean: "프레스토", meaning: "매우 빠르게 (168-200 BPM)", category: "tempo", language: "it" },
  { term: "Prestissimo", korean: "프레스티시모", meaning: "가능한 한 빠르게 (200+ BPM)", category: "tempo", language: "it" },
  { term: "Accelerando", korean: "아첼레란도", meaning: "점점 빠르게 (accel.)", category: "tempo", language: "it" },
  { term: "Stringendo", korean: "스트린젠도", meaning: "긴장감 있게 점점 빠르게", category: "tempo", language: "it" },
  { term: "Affrettando", korean: "아프레탄도", meaning: "서둘러 빠르게", category: "tempo", language: "it" },
  { term: "Incalzando", korean: "인칼잔도", meaning: "긴박하게 몰아가며", category: "tempo", language: "it" },
  { term: "Stretto", korean: "스트레토", meaning: "점점 빠르게 (푸가에서 주제 압축)", category: "tempo", language: "it" },
  { term: "Ritardando", korean: "리타르단도", meaning: "점점 느리게 (rit.)", category: "tempo", language: "it" },
  { term: "Rallentando", korean: "랄렌탄도", meaning: "점점 느리게 (rall.)", category: "tempo", language: "it" },
  { term: "Ritenuto", korean: "리테누토", meaning: "곧바로 느리게 (riten.)", category: "tempo", language: "it" },
  { term: "Slentando", korean: "슬렌탄도", meaning: "점점 느려지며", category: "tempo", language: "it" },
  { term: "Allargando", korean: "알라르간도", meaning: "점점 느려지며 세게", category: "tempo", language: "it" },
  { term: "Calando", korean: "칼란도", meaning: "점점 느리고 여리게", category: "tempo", language: "it" },
  { term: "Morendo", korean: "모렌도", meaning: "사라지듯이 점점 느리고 여리게", category: "tempo", language: "it" },
  { term: "Smorzando", korean: "스모르잔도", meaning: "사그라지듯이", category: "tempo", language: "it" },
  { term: "Svanendo", korean: "스바넨도", meaning: "사라지듯이 (희미해지며)", category: "tempo", language: "it" },
  { term: "Estinto", korean: "에스틴토", meaning: "완전히 사라지듯이, 거의 들리지 않게", category: "tempo", language: "it" },
  { term: "A tempo", korean: "아 템포", meaning: "원래 빠르기로", category: "tempo", language: "it" },
  { term: "Tempo primo", korean: "템포 프리모", meaning: "처음 빠르기로", category: "tempo", language: "it" },
  { term: "Tempo giusto", korean: "템포 주스토", meaning: "정확한 템포로", category: "tempo", language: "it" },
  { term: "Tempo rubato", korean: "템포 루바토", meaning: "자유롭게 템포를 변화시키며", category: "tempo", language: "it" },
  { term: "L'istesso tempo", korean: "리스테소 템포", meaning: "같은 빠르기로", category: "tempo", language: "it" },
  { term: "Tempo comodo", korean: "템포 코모도", meaning: "편안한 빠르기로", category: "tempo", language: "it" },
  { term: "Meno mosso", korean: "메노 모소", meaning: "덜 빠르게 (더 느리게)", category: "tempo", language: "it" },
  { term: "Più mosso", korean: "피우 모소", meaning: "더 빠르게", category: "tempo", language: "it" },
  { term: "Doppio movimento", korean: "도피오 모비멘토", meaning: "두 배의 빠르기로", category: "tempo", language: "it" },

  // ============ TEMPO - 독일어 ============
  { term: "Langsam", korean: "랑잠", meaning: "느리게", category: "tempo", language: "de" },
  { term: "Sehr langsam", korean: "제어 랑잠", meaning: "매우 느리게", category: "tempo", language: "de" },
  { term: "Mäßig", korean: "메시히", meaning: "보통 빠르기로", category: "tempo", language: "de" },
  { term: "Mäßig bewegt", korean: "메시히 베벡트", meaning: "적당히 움직여서", category: "tempo", language: "de" },
  { term: "Bewegt", korean: "베벡트", meaning: "움직여서, 활기차게", category: "tempo", language: "de" },
  { term: "Schnell", korean: "슈넬", meaning: "빠르게", category: "tempo", language: "de" },
  { term: "Sehr schnell", korean: "제어 슈넬", meaning: "매우 빠르게", category: "tempo", language: "de" },
  { term: "Lebhaft", korean: "렙하프트", meaning: "생기있게, 활발하게", category: "tempo", language: "de" },
  { term: "Rasch", korean: "라쉬", meaning: "빠르게, 재빠르게", category: "tempo", language: "de" },
  { term: "Fließend", korean: "플리센트", meaning: "흐르듯이", category: "tempo", language: "de" },
  { term: "Schleppend", korean: "슐레펜트", meaning: "질질 끌듯이 (느리게)", category: "tempo", language: "de" },
  { term: "Nicht schleppend", korean: "니히트 슐레펜트", meaning: "질질 끌지 말고", category: "tempo", language: "de" },
  { term: "Ruhig", korean: "루히히", meaning: "조용히, 차분하게", category: "tempo", language: "de" },
  { term: "Etwas bewegt", korean: "에트바스 베벡트", meaning: "약간 움직여서", category: "tempo", language: "de" },
  { term: "Im Tempo", korean: "임 템포", meaning: "원래 빠르기로", category: "tempo", language: "de" },
  { term: "Zurückhaltend", korean: "추뤽할텐트", meaning: "억제하며, 점점 느리게", category: "tempo", language: "de" },
  { term: "Zögernd", korean: "초게른트", meaning: "머뭇거리며, 점점 느리게", category: "tempo", language: "de" },
  { term: "Breit", korean: "브라이트", meaning: "넓게, 장대하게", category: "tempo", language: "de" },
  { term: "Gehend", korean: "게엔트", meaning: "걸어가듯이 (안단테)", category: "tempo", language: "de" },
  { term: "Eilig", korean: "아일리히", meaning: "서둘러, 급하게", category: "tempo", language: "de" },

  // ============ TEMPO - 프랑스어 ============
  { term: "Lent", korean: "랑", meaning: "느리게", category: "tempo", language: "fr" },
  { term: "Très lent", korean: "트레 랑", meaning: "매우 느리게", category: "tempo", language: "fr" },
  { term: "Modéré", korean: "모데레", meaning: "보통 빠르기로", category: "tempo", language: "fr" },
  { term: "Vite", korean: "비트", meaning: "빠르게", category: "tempo", language: "fr" },
  { term: "Très vite", korean: "트레 비트", meaning: "매우 빠르게", category: "tempo", language: "fr" },
  { term: "Animé", korean: "아니메", meaning: "활기차게", category: "tempo", language: "fr" },
  { term: "Vif", korean: "비프", meaning: "생생하게, 빠르게", category: "tempo", language: "fr" },
  { term: "Mouvement", korean: "무브망", meaning: "템포, 악장", category: "tempo", language: "fr" },
  { term: "Cédez", korean: "세데", meaning: "양보하며, 점점 느리게", category: "tempo", language: "fr" },
  { term: "En retenant", korean: "앙 르트낭", meaning: "억제하며, 점점 느리게", category: "tempo", language: "fr" },
  { term: "Retenu", korean: "르트뉘", meaning: "억제된, 느려진", category: "tempo", language: "fr" },
  { term: "Pressez", korean: "프레세", meaning: "서둘러, 점점 빠르게", category: "tempo", language: "fr" },
  { term: "En serrant", korean: "앙 세랑", meaning: "긴박하게, 점점 빠르게", category: "tempo", language: "fr" },
  { term: "Au mouvement", korean: "오 무브망", meaning: "원래 빠르기로", category: "tempo", language: "fr" },
  { term: "Sans presser", korean: "상 프레세", meaning: "서두르지 말고", category: "tempo", language: "fr" },
  { term: "Sans traîner", korean: "상 트레네", meaning: "질질 끌지 말고", category: "tempo", language: "fr" },

  // ============ DYNAMICS - 이태리어 (셈여림) ============
  { term: "ppp (pianississimo)", korean: "피아니시시모", meaning: "가능한 한 여리게", category: "dynamics", language: "it" },
  { term: "pp (pianissimo)", korean: "피아니시모", meaning: "매우 여리게", category: "dynamics", language: "it" },
  { term: "p (piano)", korean: "피아노", meaning: "여리게", category: "dynamics", language: "it" },
  { term: "mp (mezzo piano)", korean: "메조 피아노", meaning: "조금 여리게", category: "dynamics", language: "it" },
  { term: "mf (mezzo forte)", korean: "메조 포르테", meaning: "조금 세게", category: "dynamics", language: "it" },
  { term: "f (forte)", korean: "포르테", meaning: "세게", category: "dynamics", language: "it" },
  { term: "ff (fortissimo)", korean: "포르티시모", meaning: "매우 세게", category: "dynamics", language: "it" },
  { term: "fff (fortississimo)", korean: "포르티시시모", meaning: "가능한 한 세게", category: "dynamics", language: "it" },
  { term: "ffff", korean: "콰트로 포르테", meaning: "극도로 세게 (알캉, 리스트 등)", category: "dynamics", language: "it" },
  { term: "pppp", korean: "콰트로 피아노", meaning: "극도로 여리게", category: "dynamics", language: "it" },
  { term: "sfz (sforzando)", korean: "스포르잔도", meaning: "갑자기 세게 강조", category: "dynamics", language: "it" },
  { term: "sf (sforzato)", korean: "스포르차토", meaning: "세게 강조하여", category: "dynamics", language: "it" },
  { term: "fz (forzando)", korean: "포르잔도", meaning: "강하게 강조", category: "dynamics", language: "it" },
  { term: "rf / rfz (rinforzando)", korean: "린포르잔도", meaning: "갑자기 강조", category: "dynamics", language: "it" },
  { term: "fp (forte piano)", korean: "포르테 피아노", meaning: "세게 후 바로 여리게", category: "dynamics", language: "it" },
  { term: "sfp", korean: "스포르잔도 피아노", meaning: "강조 후 바로 여리게", category: "dynamics", language: "it" },
  { term: "pf (piano forte)", korean: "피아노 포르테", meaning: "여리게 후 세게", category: "dynamics", language: "it" },
  { term: "sffz", korean: "스포르찬디시모", meaning: "매우 강하게 강조 (비르투오소 곡)", category: "dynamics", language: "it" },
  { term: "ffp", korean: "포르티시모 피아노", meaning: "매우 세게 후 바로 여리게", category: "dynamics", language: "it" },
  { term: "Crescendo", korean: "크레센도", meaning: "점점 세게 (cresc.)", category: "dynamics", language: "it" },
  { term: "Crescendo molto", korean: "크레센도 몰토", meaning: "많이 점점 세게", category: "dynamics", language: "it" },
  { term: "Crescendo poco a poco", korean: "크레센도 포코 아 포코", meaning: "조금씩 점점 세게", category: "dynamics", language: "it" },
  { term: "Decrescendo", korean: "데크레센도", meaning: "점점 여리게 (decresc.)", category: "dynamics", language: "it" },
  { term: "Diminuendo", korean: "디미누엔도", meaning: "점점 여리게 (dim.)", category: "dynamics", language: "it" },
  { term: "Perdendosi", korean: "페르덴도시", meaning: "사라지듯이 점점 여리게", category: "dynamics", language: "it" },
  { term: "Mancando", korean: "만칸도", meaning: "사라지듯이, 점점 여리게", category: "dynamics", language: "it" },
  { term: "Sotto voce", korean: "소토 보체", meaning: "속삭이듯이 작은 소리로", category: "dynamics", language: "it" },
  { term: "Mezza voce", korean: "메짜 보체", meaning: "절반의 소리로, 부드럽게", category: "dynamics", language: "it" },
  { term: "A mezza voce", korean: "아 메짜 보체", meaning: "절반의 음량으로", category: "dynamics", language: "it" },
  { term: "Forte possibile", korean: "포르테 포시빌레", meaning: "가능한 한 세게", category: "dynamics", language: "it" },
  { term: "Il più forte possibile", korean: "일 피우 포르테 포시빌레", meaning: "가능한 최대로 세게", category: "dynamics", language: "it" },
  { term: "Più forte", korean: "피우 포르테", meaning: "더 세게", category: "dynamics", language: "it" },
  { term: "Meno forte", korean: "메노 포르테", meaning: "덜 세게", category: "dynamics", language: "it" },
  { term: "Più piano", korean: "피우 피아노", meaning: "더 여리게", category: "dynamics", language: "it" },
  { term: "Mezzo voce", korean: "메조 보체", meaning: "절반의 소리로", category: "dynamics", language: "it" },
  { term: "Voce", korean: "보체", meaning: "목소리, 성부", category: "dynamics", language: "it" },
  { term: "Tutta forza", korean: "투타 포르차", meaning: "전력을 다해", category: "dynamics", language: "it" },
  { term: "Con tutta la forza", korean: "콘 투타 라 포르차", meaning: "온 힘을 다해", category: "dynamics", language: "it" },

  // ============ DYNAMICS - 독일어 ============
  { term: "Stark", korean: "슈타르크", meaning: "세게, 강하게", category: "dynamics", language: "de" },
  { term: "Sehr stark", korean: "제어 슈타르크", meaning: "매우 세게", category: "dynamics", language: "de" },
  { term: "Schwach", korean: "슈바흐", meaning: "여리게, 약하게", category: "dynamics", language: "de" },
  { term: "Leise", korean: "라이제", meaning: "조용히, 여리게", category: "dynamics", language: "de" },
  { term: "Sehr leise", korean: "제어 라이제", meaning: "매우 여리게", category: "dynamics", language: "de" },
  { term: "Kräftig", korean: "크레프티히", meaning: "힘차게, 강하게", category: "dynamics", language: "de" },
  { term: "Zart", korean: "차르트", meaning: "부드럽게, 섬세하게", category: "dynamics", language: "de" },
  { term: "Sanft", korean: "잔프트", meaning: "부드럽게, 온화하게", category: "dynamics", language: "de" },
  { term: "Verstärkt", korean: "페어슈테르크트", meaning: "강화하여", category: "dynamics", language: "de" },
  { term: "Abnehmend", korean: "압네멘트", meaning: "점점 여리게", category: "dynamics", language: "de" },
  { term: "Zunehmend", korean: "추네멘트", meaning: "점점 세게", category: "dynamics", language: "de" },
  { term: "Hervortretend", korean: "헤어포어트레텐트", meaning: "두드러지게, 강조하여", category: "dynamics", language: "de" },
  { term: "Markiert", korean: "마르키어트", meaning: "강조하여, 명확하게", category: "dynamics", language: "de" },

  // ============ DYNAMICS - 프랑스어 ============
  { term: "Fort", korean: "포르", meaning: "세게", category: "dynamics", language: "fr" },
  { term: "Très fort", korean: "트레 포르", meaning: "매우 세게", category: "dynamics", language: "fr" },
  { term: "Doux", korean: "두", meaning: "부드럽게, 여리게", category: "dynamics", language: "fr" },
  { term: "Très doux", korean: "트레 두", meaning: "매우 부드럽게", category: "dynamics", language: "fr" },
  { term: "En augmentant", korean: "앙 노그망탕", meaning: "점점 세게", category: "dynamics", language: "fr" },
  { term: "En diminuant", korean: "앙 디미뉘앙", meaning: "점점 여리게", category: "dynamics", language: "fr" },
  { term: "Demi-voix", korean: "드미 부아", meaning: "절반의 소리로", category: "dynamics", language: "fr" },
  { term: "À demi-voix", korean: "아 드미 부아", meaning: "절반의 음량으로", category: "dynamics", language: "fr" },
  { term: "Sourdine", korean: "수르딘", meaning: "약음기를 사용하여", category: "dynamics", language: "fr" },
  { term: "Sans sourdine", korean: "상 수르딘", meaning: "약음기 없이", category: "dynamics", language: "fr" },
  { term: "Éclatant", korean: "에클라탕", meaning: "빛나게, 화려하게", category: "dynamics", language: "fr" },

  // ============ ARTICULATION - 이태리어 (아티큘레이션) ============
  { term: "Legato", korean: "레가토", meaning: "음을 끊지 않고 부드럽게 연결하여", category: "articulation", language: "it" },
  { term: "Legatissimo", korean: "레가티시모", meaning: "매우 부드럽게 연결하여", category: "articulation", language: "it" },
  { term: "Staccato", korean: "스타카토", meaning: "음을 짧게 끊어서", category: "articulation", language: "it" },
  { term: "Staccatissimo", korean: "스타카티시모", meaning: "매우 짧게 끊어서", category: "articulation", language: "it" },
  { term: "Mezzo staccato", korean: "메조 스타카토", meaning: "보통 정도로 끊어서", category: "articulation", language: "it" },
  { term: "Tenuto", korean: "테누토", meaning: "음의 길이를 충분히 유지하며", category: "articulation", language: "it" },
  { term: "Marcato", korean: "마르카토", meaning: "강조하여, 또렷하게", category: "articulation", language: "it" },
  { term: "Marcatissimo", korean: "마르카티시모", meaning: "매우 강조하여", category: "articulation", language: "it" },
  { term: "Accent (>)", korean: "악센트", meaning: "해당 음을 강조하여", category: "articulation", language: "it" },
  { term: "Portato", korean: "포르타토", meaning: "레가토와 스타카토 사이로", category: "articulation", language: "it" },
  { term: "Portamento", korean: "포르타멘토", meaning: "음에서 음으로 미끄러지듯이", category: "articulation", language: "it" },
  { term: "Fermata", korean: "페르마타", meaning: "늘임표, 음을 적당히 늘여서", category: "articulation", language: "it" },
  { term: "Lunga", korean: "룽가", meaning: "길게 (페르마타와 함께)", category: "articulation", language: "it" },
  { term: "Lunga fermata", korean: "룽가 페르마타", meaning: "매우 길게 늘여서", category: "articulation", language: "it" },
  { term: "Breve", korean: "브레베", meaning: "짧게 (페르마타와 함께)", category: "articulation", language: "it" },
  { term: "Non legato", korean: "논 레가토", meaning: "레가토가 아니게, 약간 끊어서", category: "articulation", language: "it" },
  { term: "Ben marcato", korean: "벤 마르카토", meaning: "잘 강조하여", category: "articulation", language: "it" },
  { term: "Secco", korean: "세코", meaning: "건조하게, 날카롭게 끊어서", category: "articulation", language: "it" },
  { term: "Martellato", korean: "마르텔라토", meaning: "망치로 치듯이 강하고 날카롭게", category: "articulation", language: "it" },
  { term: "Pesante", korean: "페잔테", meaning: "무겁게, 힘차게", category: "articulation", language: "it" },
  { term: "Picchiettato", korean: "피키에타토", meaning: "점점이 찍듯이, 가볍게 끊어서", category: "articulation", language: "it" },

  // ============ ARTICULATION - 독일어 ============
  { term: "Gebunden", korean: "게분덴", meaning: "레가토로, 연결하여", category: "articulation", language: "de" },
  { term: "Getragen", korean: "게트라겐", meaning: "유지하며, 노래하듯이", category: "articulation", language: "de" },
  { term: "Gestoßen", korean: "게슈토센", meaning: "스타카토로", category: "articulation", language: "de" },
  { term: "Abgestoßen", korean: "압게슈토센", meaning: "끊어서", category: "articulation", language: "de" },
  { term: "Gehalten", korean: "게할텐", meaning: "유지하여", category: "articulation", language: "de" },
  { term: "Betont", korean: "베톤트", meaning: "강조하여", category: "articulation", language: "de" },
  { term: "Gut betont", korean: "구트 베톤트", meaning: "잘 강조하여", category: "articulation", language: "de" },
  { term: "Kurz", korean: "쿠르츠", meaning: "짧게", category: "articulation", language: "de" },
  { term: "Scharf", korean: "샤르프", meaning: "날카롭게", category: "articulation", language: "de" },
  { term: "Weich", korean: "바이히", meaning: "부드럽게", category: "articulation", language: "de" },

  // ============ ARTICULATION - 프랑스어 ============
  { term: "Détaché", korean: "데타셰", meaning: "음을 분리하여", category: "articulation", language: "fr" },
  { term: "Louré", korean: "루레", meaning: "각 음을 강조하며 연결", category: "articulation", language: "fr" },
  { term: "Lié", korean: "리에", meaning: "연결하여, 레가토로", category: "articulation", language: "fr" },
  { term: "Bien lié", korean: "비앙 리에", meaning: "잘 연결하여", category: "articulation", language: "fr" },
  { term: "Soutenu", korean: "수트뉘", meaning: "유지하며", category: "articulation", language: "fr" },
  { term: "Piqué", korean: "피케", meaning: "찌르듯이, 스타카토로", category: "articulation", language: "fr" },
  { term: "Sec", korean: "세크", meaning: "건조하게, 날카롭게", category: "articulation", language: "fr" },
  { term: "Marqué", korean: "마르케", meaning: "강조하여", category: "articulation", language: "fr" },
  { term: "Bien marqué", korean: "비앙 마르케", meaning: "잘 강조하여", category: "articulation", language: "fr" },
  { term: "Appuyé", korean: "아퓌이에", meaning: "눌러서, 강조하여", category: "articulation", language: "fr" },

  // ============ EXPRESSION - 이태리어 (표현) ============
  { term: "Dolce", korean: "돌체", meaning: "달콤하게, 부드럽게", category: "expression", language: "it" },
  { term: "Dolcissimo", korean: "돌치시모", meaning: "매우 달콤하게", category: "expression", language: "it" },
  { term: "Espressivo", korean: "에스프레시보", meaning: "표정 풍부하게 (espress.)", category: "expression", language: "it" },
  { term: "Molto espressivo", korean: "몰토 에스프레시보", meaning: "매우 표정 풍부하게", category: "expression", language: "it" },
  { term: "Cantabile", korean: "칸타빌레", meaning: "노래하듯이", category: "expression", language: "it" },
  { term: "Cantando", korean: "칸탄도", meaning: "노래하며", category: "expression", language: "it" },
  { term: "Con anima", korean: "콘 아니마", meaning: "영혼을 담아", category: "expression", language: "it" },
  { term: "Con brio", korean: "콘 브리오", meaning: "생기있게, 활기차게", category: "expression", language: "it" },
  { term: "Con fuoco", korean: "콘 푸오코", meaning: "불같이, 열정적으로", category: "expression", language: "it" },
  { term: "Con forza", korean: "콘 포르차", meaning: "힘차게", category: "expression", language: "it" },
  { term: "Con grazia", korean: "콘 그라치아", meaning: "우아함을 가지고", category: "expression", language: "it" },
  { term: "Con moto", korean: "콘 모토", meaning: "움직임을 가지고", category: "expression", language: "it" },
  { term: "Con spirito", korean: "콘 스피리토", meaning: "정신을 담아, 활기차게", category: "expression", language: "it" },
  { term: "Con calore", korean: "콘 칼로레", meaning: "따뜻하게, 열정적으로", category: "expression", language: "it" },
  { term: "Con amore", korean: "콘 아모레", meaning: "사랑을 담아", category: "expression", language: "it" },
  { term: "Con delicatezza", korean: "콘 델리카테짜", meaning: "섬세하게", category: "expression", language: "it" },
  { term: "Con eleganza", korean: "콘 엘레간차", meaning: "우아하게", category: "expression", language: "it" },
  { term: "Con abbandono", korean: "콘 아반도노", meaning: "자유분방하게, 몰입하여", category: "expression", language: "it" },
  { term: "Con slancio", korean: "콘 슬란치오", meaning: "추진력 있게, 돌진하듯", category: "expression", language: "it" },
  { term: "Con strepito", korean: "콘 스트레피토", meaning: "요란하게, 굉음과 함께", category: "expression", language: "it" },
  { term: "Agitato", korean: "아지타토", meaning: "격렬하게, 흥분하여", category: "expression", language: "it" },
  { term: "Agitatissimo", korean: "아지타티시모", meaning: "매우 격렬하게", category: "expression", language: "it" },
  { term: "Animato", korean: "아니마토", meaning: "생기있게, 활발하게", category: "expression", language: "it" },
  { term: "Appassionato", korean: "아파시오나토", meaning: "열정적으로", category: "expression", language: "it" },
  { term: "Affettuoso", korean: "아페투오소", meaning: "애정을 담아", category: "expression", language: "it" },
  { term: "Amoroso", korean: "아모로소", meaning: "사랑스럽게", category: "expression", language: "it" },
  { term: "Brillante", korean: "브릴란테", meaning: "화려하게, 빛나게", category: "expression", language: "it" },
  { term: "Capriccioso", korean: "카프리치오소", meaning: "변덕스럽게, 자유롭게", category: "expression", language: "it" },
  { term: "Comodo", korean: "코모도", meaning: "편안하게", category: "expression", language: "it" },
  { term: "Deciso", korean: "데치소", meaning: "단호하게, 결연하게", category: "expression", language: "it" },
  { term: "Delicato", korean: "델리카토", meaning: "섬세하게", category: "expression", language: "it" },
  { term: "Delicatissimo", korean: "델리카티시모", meaning: "매우 섬세하게", category: "expression", language: "it" },
  { term: "Disperato", korean: "디스페라토", meaning: "절망적으로", category: "expression", language: "it" },
  { term: "Drammatico", korean: "드람마티코", meaning: "극적으로", category: "expression", language: "it" },
  { term: "Energico", korean: "에네르지코", meaning: "에너지 넘치게", category: "expression", language: "it" },
  { term: "Eroico", korean: "에로이코", meaning: "영웅적으로", category: "expression", language: "it" },
  { term: "Feroce", korean: "페로체", meaning: "사납게, 격렬하게", category: "expression", language: "it" },
  { term: "Ferocissimo", korean: "페로치시모", meaning: "매우 사납게 (알캉)", category: "expression", language: "it" },
  { term: "Festivo", korean: "페스티보", meaning: "축제처럼, 경쾌하게", category: "expression", language: "it" },
  { term: "Flebile", korean: "플레빌레", meaning: "슬프게, 구슬프게", category: "expression", language: "it" },
  { term: "Furioso", korean: "푸리오소", meaning: "격노하여, 맹렬하게", category: "expression", language: "it" },
  { term: "Giocoso", korean: "지오코소", meaning: "유쾌하게, 장난스럽게", category: "expression", language: "it" },
  { term: "Grandioso", korean: "그란디오소", meaning: "웅장하게", category: "expression", language: "it" },
  { term: "Grazioso", korean: "그라치오소", meaning: "우아하게", category: "expression", language: "it" },
  { term: "Impetuoso", korean: "임페투오소", meaning: "격렬하게, 맹렬하게", category: "expression", language: "it" },
  { term: "Infernale", korean: "인페르날레", meaning: "지옥같이, 악마적으로 (알캉)", category: "expression", language: "it" },
  { term: "Innocente", korean: "인노첸테", meaning: "순수하게, 천진하게", category: "expression", language: "it" },
  { term: "Lamentoso", korean: "라멘토소", meaning: "슬프게, 애통하게", category: "expression", language: "it" },
  { term: "Languido", korean: "랑귀도", meaning: "나른하게", category: "expression", language: "it" },
  { term: "Leggiero", korean: "레지에로", meaning: "가볍게", category: "expression", language: "it" },
  { term: "Leggierissimo", korean: "레지에리시모", meaning: "매우 가볍게", category: "expression", language: "it" },
  { term: "Lugubre", korean: "루구브레", meaning: "음울하게, 침울하게", category: "expression", language: "it" },
  { term: "Lusingando", korean: "루싱간도", meaning: "아첨하듯이, 달콤하게", category: "expression", language: "it" },
  { term: "Maestoso", korean: "마에스토소", meaning: "장엄하게, 위엄있게", category: "expression", language: "it" },
  { term: "Malinconico", korean: "말린코니코", meaning: "우울하게", category: "expression", language: "it" },
  { term: "Marziale", korean: "마르치알레", meaning: "행진곡풍으로", category: "expression", language: "it" },
  { term: "Mesto", korean: "메스토", meaning: "슬프게", category: "expression", language: "it" },
  { term: "Misterioso", korean: "미스테리오소", meaning: "신비롭게", category: "expression", language: "it" },
  { term: "Nobile", korean: "노빌레", meaning: "고귀하게", category: "expression", language: "it" },
  { term: "Parlando", korean: "파를란도", meaning: "말하듯이", category: "expression", language: "it" },
  { term: "Pastorale", korean: "파스토랄레", meaning: "목가적으로", category: "expression", language: "it" },
  { term: "Patetico", korean: "파테티코", meaning: "비장하게, 감동적으로", category: "expression", language: "it" },
  { term: "Precipitato", korean: "프레치피타토", meaning: "급하게 쏟아지듯이 (비르투오소)", category: "expression", language: "it" },
  { term: "Tempestoso", korean: "템페스토소", meaning: "폭풍우같이, 격렬하게", category: "expression", language: "it" },
  { term: "Tenebroso", korean: "테네브로소", meaning: "어둡게, 음산하게", category: "expression", language: "it" },
  { term: "Terribile", korean: "테리빌레", meaning: "무섭게, 공포스럽게", category: "expression", language: "it" },
  { term: "Tonante", korean: "토난테", meaning: "천둥같이, 우레같이", category: "expression", language: "it" },
  { term: "Tumultuoso", korean: "투물투오소", meaning: "소란스럽게, 격동적으로", category: "expression", language: "it" },
  { term: "Velocissimo", korean: "벨로치시모", meaning: "매우 빠르게 (비르투오소)", category: "expression", language: "it" },
  { term: "Voluttuoso", korean: "볼루투오소", meaning: "관능적으로", category: "expression", language: "it" },
  { term: "Pesante", korean: "페잔테", meaning: "무겁게", category: "expression", language: "it" },
  { term: "Piacevole", korean: "피아체볼레", meaning: "즐겁게, 기분 좋게", category: "expression", language: "it" },
  { term: "Placido", korean: "플라치도", meaning: "평화롭게, 고요하게", category: "expression", language: "it" },
  { term: "Pomposo", korean: "폼포소", meaning: "화려하게, 장대하게", category: "expression", language: "it" },
  { term: "Religioso", korean: "렐리지오소", meaning: "경건하게, 종교적으로", category: "expression", language: "it" },
  { term: "Risoluto", korean: "리솔루토", meaning: "단호하게, 결연하게", category: "expression", language: "it" },
  { term: "Rustico", korean: "루스티코", meaning: "소박하게, 시골풍으로", category: "expression", language: "it" },
  { term: "Scherzando", korean: "스케르잔도", meaning: "장난스럽게, 해학적으로", category: "expression", language: "it" },
  { term: "Semplice", korean: "셈플리체", meaning: "단순하게, 소박하게", category: "expression", language: "it" },
  { term: "Sereno", korean: "세레노", meaning: "평온하게, 맑게", category: "expression", language: "it" },
  { term: "Soave", korean: "소아베", meaning: "부드럽게, 감미롭게", category: "expression", language: "it" },
  { term: "Solenne", korean: "솔렌네", meaning: "엄숙하게", category: "expression", language: "it" },
  { term: "Sonore", korean: "소노레", meaning: "울림 있게, 낭랑하게", category: "expression", language: "it" },
  { term: "Sostenuto", korean: "소스테누토", meaning: "음을 충분히 유지하며", category: "expression", language: "it" },
  { term: "Spiritoso", korean: "스피리토소", meaning: "재치있게, 정신적으로", category: "expression", language: "it" },
  { term: "Teneramente", korean: "테네라멘테", meaning: "부드럽게, 다정하게", category: "expression", language: "it" },
  { term: "Tranquillo", korean: "트란퀼로", meaning: "조용하게, 평화롭게", category: "expression", language: "it" },
  { term: "Trionfale", korean: "트리온팔레", meaning: "승리감 있게", category: "expression", language: "it" },
  { term: "Vivo", korean: "비보", meaning: "생기있게", category: "expression", language: "it" },

  // 수식어 (Modifiers) - 이태리어
  { term: "Molto", korean: "몰토", meaning: "매우", category: "expression", language: "it" },
  { term: "Poco", korean: "포코", meaning: "조금", category: "expression", language: "it" },
  { term: "Poco a poco", korean: "포코 아 포코", meaning: "조금씩", category: "expression", language: "it" },
  { term: "Più", korean: "피우", meaning: "더", category: "expression", language: "it" },
  { term: "Meno", korean: "메노", meaning: "덜", category: "expression", language: "it" },
  { term: "Sempre", korean: "셈프레", meaning: "항상, 계속", category: "expression", language: "it" },
  { term: "Subito", korean: "수비토", meaning: "갑자기", category: "expression", language: "it" },
  { term: "Assai", korean: "아사이", meaning: "매우, 대단히", category: "expression", language: "it" },
  { term: "Quasi", korean: "콰지", meaning: "거의, ~처럼", category: "expression", language: "it" },
  { term: "Non troppo", korean: "논 트로포", meaning: "지나치지 않게", category: "expression", language: "it" },
  { term: "Ma non troppo", korean: "마 논 트로포", meaning: "그러나 지나치지 않게", category: "expression", language: "it" },
  { term: "Ben", korean: "벤", meaning: "잘, 충분히", category: "expression", language: "it" },
  { term: "Come prima", korean: "코메 프리마", meaning: "처음처럼", category: "expression", language: "it" },
  { term: "Come sopra", korean: "코메 소프라", meaning: "위와 같이", category: "expression", language: "it" },
  { term: "Senza", korean: "센차", meaning: "~없이", category: "expression", language: "it" },
  { term: "Con", korean: "콘", meaning: "~와 함께, ~을 가지고", category: "expression", language: "it" },

  // ============ EXPRESSION - 독일어 ============
  { term: "Ausdrucksvoll", korean: "아우스드룩스폴", meaning: "표현력 있게", category: "expression", language: "de" },
  { term: "Mit Ausdruck", korean: "미트 아우스드룩", meaning: "표현을 담아", category: "expression", language: "de" },
  { term: "Mit Empfindung", korean: "미트 엠프핀둥", meaning: "감정을 담아", category: "expression", language: "de" },
  { term: "Mit Leidenschaft", korean: "미트 라이덴샤프트", meaning: "열정적으로", category: "expression", language: "de" },
  { term: "Leidenschaftlich", korean: "라이덴샤프틀리히", meaning: "열정적으로", category: "expression", language: "de" },
  { term: "Innig", korean: "이니히", meaning: "마음을 담아, 정성스럽게", category: "expression", language: "de" },
  { term: "Zärtlich", korean: "체르틀리히", meaning: "다정하게", category: "expression", language: "de" },
  { term: "Feierlich", korean: "파이얼리히", meaning: "장엄하게, 축제적으로", category: "expression", language: "de" },
  { term: "Feurig", korean: "포이리히", meaning: "불같이, 열정적으로", category: "expression", language: "de" },
  { term: "Frisch", korean: "프리쉬", meaning: "신선하게, 생기있게", category: "expression", language: "de" },
  { term: "Fröhlich", korean: "프뢸리히", meaning: "즐겁게", category: "expression", language: "de" },
  { term: "Gemütlich", korean: "게뮈틀리히", meaning: "편안하게, 아늑하게", category: "expression", language: "de" },
  { term: "Geschwind", korean: "게슈빈트", meaning: "빠르게", category: "expression", language: "de" },
  { term: "Heftig", korean: "헤프티히", meaning: "격렬하게, 세차게", category: "expression", language: "de" },
  { term: "Heiter", korean: "하이터", meaning: "밝게, 명랑하게", category: "expression", language: "de" },
  { term: "Klagend", korean: "클라겐트", meaning: "한탄하듯이", category: "expression", language: "de" },
  { term: "Kräftig", korean: "크레프티히", meaning: "힘차게", category: "expression", language: "de" },
  { term: "Munter", korean: "문터", meaning: "활발하게, 생기있게", category: "expression", language: "de" },
  { term: "Ruhig", korean: "루히히", meaning: "조용히, 평화롭게", category: "expression", language: "de" },
  { term: "Sanft", korean: "잔프트", meaning: "부드럽게", category: "expression", language: "de" },
  { term: "Schmerzlich", korean: "슈메어츨리히", meaning: "아프게, 고통스럽게", category: "expression", language: "de" },
  { term: "Sehnsuchtsvoll", korean: "젠주흐츠폴", meaning: "그리움을 담아", category: "expression", language: "de" },
  { term: "Stürmisch", korean: "슈튀르미쉬", meaning: "폭풍같이, 격렬하게", category: "expression", language: "de" },
  { term: "Süß", korean: "쥐스", meaning: "달콤하게", category: "expression", language: "de" },
  { term: "Traurig", korean: "트라우리히", meaning: "슬프게", category: "expression", language: "de" },
  { term: "Wuchtig", korean: "부흐티히", meaning: "무겁고 힘차게", category: "expression", language: "de" },
  { term: "Zögernd", korean: "초게른트", meaning: "머뭇거리며", category: "expression", language: "de" },

  // 수식어 (Modifiers) - 독일어
  { term: "Sehr", korean: "제어", meaning: "매우", category: "expression", language: "de" },
  { term: "Etwas", korean: "에트바스", meaning: "약간, 조금", category: "expression", language: "de" },
  { term: "Nicht", korean: "니히트", meaning: "~하지 않게", category: "expression", language: "de" },
  { term: "Mehr", korean: "메어", meaning: "더", category: "expression", language: "de" },
  { term: "Weniger", korean: "베니거", meaning: "덜", category: "expression", language: "de" },
  { term: "Immer", korean: "이머", meaning: "항상, 계속", category: "expression", language: "de" },
  { term: "Wieder", korean: "비더", meaning: "다시", category: "expression", language: "de" },
  { term: "Wie vorher", korean: "비 포어헤어", meaning: "전처럼", category: "expression", language: "de" },

  // ============ EXPRESSION - 프랑스어 ============
  { term: "Expressif", korean: "엑스프레시프", meaning: "표현력 있게", category: "expression", language: "fr" },
  { term: "Très expressif", korean: "트레 젝스프레시프", meaning: "매우 표현력 있게", category: "expression", language: "fr" },
  { term: "Avec âme", korean: "아벡 암", meaning: "영혼을 담아", category: "expression", language: "fr" },
  { term: "Avec passion", korean: "아벡 파시옹", meaning: "열정적으로", category: "expression", language: "fr" },
  { term: "Avec chaleur", korean: "아벡 샬뢰르", meaning: "따뜻하게", category: "expression", language: "fr" },
  { term: "Avec tendresse", korean: "아벡 탕드레스", meaning: "다정하게", category: "expression", language: "fr" },
  { term: "Avec élégance", korean: "아벡 엘레강스", meaning: "우아하게", category: "expression", language: "fr" },
  { term: "Gracieux", korean: "그라시외", meaning: "우아하게", category: "expression", language: "fr" },
  { term: "Léger", korean: "레제", meaning: "가볍게", category: "expression", language: "fr" },
  { term: "Très léger", korean: "트레 레제", meaning: "매우 가볍게", category: "expression", language: "fr" },
  { term: "Joyeux", korean: "주아이외", meaning: "즐겁게", category: "expression", language: "fr" },
  { term: "Triste", korean: "트리스트", meaning: "슬프게", category: "expression", language: "fr" },
  { term: "Douloureux", korean: "둘루르", meaning: "고통스럽게", category: "expression", language: "fr" },
  { term: "Mélancolique", korean: "멜랑콜리크", meaning: "우울하게", category: "expression", language: "fr" },
  { term: "Mystérieux", korean: "미스테리외", meaning: "신비롭게", category: "expression", language: "fr" },
  { term: "Calme", korean: "칼므", meaning: "고요하게", category: "expression", language: "fr" },
  { term: "Paisible", korean: "페지블", meaning: "평화롭게", category: "expression", language: "fr" },
  { term: "Souple", korean: "수플", meaning: "유연하게", category: "expression", language: "fr" },
  { term: "Sonore", korean: "소노르", meaning: "울림있게", category: "expression", language: "fr" },
  { term: "Brillant", korean: "브리양", meaning: "화려하게", category: "expression", language: "fr" },
  { term: "Éclatant", korean: "에클라탕", meaning: "빛나게, 화려하게", category: "expression", language: "fr" },
  { term: "Énergique", korean: "에네르지크", meaning: "에너지 넘치게", category: "expression", language: "fr" },
  { term: "Furieux", korean: "퓌리외", meaning: "격노하여", category: "expression", language: "fr" },
  { term: "Impétueux", korean: "앵페튀외", meaning: "격렬하게", category: "expression", language: "fr" },
  { term: "Majestueux", korean: "마제스튀외", meaning: "장엄하게", category: "expression", language: "fr" },
  { term: "Naïf", korean: "나이프", meaning: "순수하게", category: "expression", language: "fr" },
  { term: "Onduleux", korean: "옹뒬뢰", meaning: "물결치듯이", category: "expression", language: "fr" },
  { term: "Vaporeux", korean: "바포르", meaning: "안개처럼, 몽환적으로", category: "expression", language: "fr" },
  { term: "Voilé", korean: "부알레", meaning: "베일에 싸인 듯이", category: "expression", language: "fr" },

  // 수식어 (Modifiers) - 프랑스어
  { term: "Très", korean: "트레", meaning: "매우", category: "expression", language: "fr" },
  { term: "Peu", korean: "푀", meaning: "조금", category: "expression", language: "fr" },
  { term: "Peu à peu", korean: "푀 아 푀", meaning: "조금씩", category: "expression", language: "fr" },
  { term: "Plus", korean: "플뤼", meaning: "더", category: "expression", language: "fr" },
  { term: "Moins", korean: "무앙", meaning: "덜", category: "expression", language: "fr" },
  { term: "Toujours", korean: "투주르", meaning: "항상, 계속", category: "expression", language: "fr" },
  { term: "Sans", korean: "상", meaning: "~없이", category: "expression", language: "fr" },
  { term: "Avec", korean: "아벡", meaning: "~와 함께", category: "expression", language: "fr" },
  { term: "Comme", korean: "콤", meaning: "~처럼", category: "expression", language: "fr" },
  { term: "En dehors", korean: "앙 드오르", meaning: "두드러지게, 강조하여", category: "expression", language: "fr" },

  // ============ TECHNIQUE - 이태리어/일반 (테크닉) ============
  { term: "Arpeggio", korean: "아르페지오", meaning: "화음을 분산하여 차례로 연주", category: "technique", language: "it" },
  { term: "Glissando", korean: "글리산도", meaning: "건반을 미끄러지듯 연주", category: "technique", language: "it" },
  { term: "Tremolo", korean: "트레몰로", meaning: "같은 음을 빠르게 반복", category: "technique", language: "it" },
  { term: "Trill (tr)", korean: "트릴", meaning: "두 인접음을 빠르게 번갈아 연주", category: "technique", language: "it" },
  { term: "Mordent", korean: "모르덴트", meaning: "짧은 꾸밈음 (아래 음)", category: "technique", language: "it" },
  { term: "Inverted mordent", korean: "역모르덴트", meaning: "짧은 꾸밈음 (위 음)", category: "technique", language: "it" },
  { term: "Turn", korean: "턴", meaning: "돌려치기 (4개 음의 꾸밈음)", category: "technique", language: "en" },
  { term: "Inverted turn", korean: "역턴", meaning: "아래로 시작하는 턴", category: "technique", language: "en" },
  { term: "Grace note", korean: "장식음", meaning: "작은 음표로 표시된 꾸밈음", category: "technique", language: "en" },
  { term: "Acciaccatura", korean: "아치아카투라", meaning: "짧은 전타음 (빗금 있는 장식음)", category: "technique", language: "it" },
  { term: "Appoggiatura", korean: "아포지아투라", meaning: "긴 전타음", category: "technique", language: "it" },
  { term: "Cadenza", korean: "카덴차", meaning: "독주자의 자유로운 기교적 악구", category: "technique", language: "it" },
  { term: "Octave", korean: "옥타브", meaning: "8도 음정, 양손 또는 한손으로", category: "technique", language: "en" },
  { term: "Double octave", korean: "더블 옥타브", meaning: "15도 음정 (2옥타브)", category: "technique", language: "en" },
  { term: "Chord", korean: "코드/화음", meaning: "동시에 울리는 여러 음", category: "technique", language: "en" },
  { term: "Broken chord", korean: "분산화음", meaning: "화음을 순차적으로 연주", category: "technique", language: "en" },
  { term: "Alberti bass", korean: "알베르티 베이스", meaning: "분산화음 반주 패턴", category: "technique", language: "it" },
  { term: "Scale", korean: "스케일/음계", meaning: "순차적으로 오르내리는 음", category: "technique", language: "en" },
  { term: "Chromatic scale", korean: "반음계", meaning: "반음씩 오르내리는 음계", category: "technique", language: "en" },
  { term: "Cross hands", korean: "교차연주", meaning: "양손을 교차하여 연주", category: "technique", language: "en" },
  { term: "M.D. (mano destra)", korean: "마노 데스트라", meaning: "오른손으로", category: "technique", language: "it" },
  { term: "M.S. (mano sinistra)", korean: "마노 시니스트라", meaning: "왼손으로", category: "technique", language: "it" },
  { term: "R.H. (Right Hand)", korean: "오른손", meaning: "오른손으로", category: "technique", language: "en" },
  { term: "L.H. (Left Hand)", korean: "왼손", meaning: "왼손으로", category: "technique", language: "en" },
  { term: "Una corda", korean: "우나 코르다", meaning: "왼쪽 페달 (소프트 페달)", category: "technique", language: "it" },
  { term: "Tre corde", korean: "트레 코르데", meaning: "우나 코르다 해제", category: "technique", language: "it" },
  { term: "Tutte le corde", korean: "투테 레 코르데", meaning: "모든 현으로 (페달 해제)", category: "technique", language: "it" },
  { term: "Con pedale", korean: "콘 페달레", meaning: "페달을 사용하여", category: "technique", language: "it" },
  { term: "Senza pedale", korean: "센차 페달레", meaning: "페달 없이", category: "technique", language: "it" },
  { term: "Ped.", korean: "페달", meaning: "오른쪽 페달 (서스테인)", category: "technique", language: "it" },
  { term: "Sostenuto pedal", korean: "소스테누토 페달", meaning: "가운데 페달", category: "technique", language: "it" },
  { term: "Half pedal", korean: "하프 페달", meaning: "페달을 반만 밟아서", category: "technique", language: "en" },
  { term: "Flutter pedal", korean: "플러터 페달", meaning: "페달을 빠르게 연속 밟아서", category: "technique", language: "en" },
  { term: "Simile", korean: "시밀레", meaning: "앞과 같은 방식으로 계속", category: "technique", language: "it" },
  { term: "8va", korean: "옥타바 알타", meaning: "한 옥타브 높게", category: "technique", language: "it" },
  { term: "8vb (8va bassa)", korean: "옥타바 바싸", meaning: "한 옥타브 낮게", category: "technique", language: "it" },

  // 비르투오소 테크닉
  { term: "Double thirds", korean: "더블 서드", meaning: "3도 중복 음정 (양손)", category: "technique", language: "en" },
  { term: "Double sixths", korean: "더블 식스", meaning: "6도 중복 음정 (양손)", category: "technique", language: "en" },
  { term: "Double notes", korean: "더블 노트", meaning: "중복 음정 연주", category: "technique", language: "en" },
  { term: "Interlocking octaves", korean: "인터로킹 옥타브", meaning: "교차 옥타브 (알캉)", category: "technique", language: "en" },
  { term: "Hand stretches", korean: "핸드 스트레치", meaning: "손 늘리기 (10도 이상)", category: "technique", language: "en" },
  { term: "Thumb under", korean: "엄지 넘기기", meaning: "스케일에서 엄지 밑으로", category: "technique", language: "en" },
  { term: "Rotation", korean: "로테이션", meaning: "손목 회전 테크닉", category: "technique", language: "en" },
  { term: "Weight transfer", korean: "웨이트 트랜스퍼", meaning: "무게 이동 테크닉", category: "technique", language: "en" },
  { term: "Velocity", korean: "벨로시티", meaning: "건반 타건 속도/강도", category: "technique", language: "en" },
  { term: "Voicing", korean: "보이싱", meaning: "음향 균형 조절 (성부 강조)", category: "technique", language: "en" },
  { term: "Inner voice", korean: "이너 보이스", meaning: "내성 (중간 성부)", category: "technique", language: "en" },
  { term: "Finger substitution", korean: "핑거 서브스티튜션", meaning: "손가락 교체 (같은 음)", category: "technique", language: "en" },
  { term: "Repeated notes", korean: "리피티드 노트", meaning: "반복음 테크닉", category: "technique", language: "en" },
  { term: "Leaps", korean: "리프", meaning: "도약 (멀리 점프)", category: "technique", language: "en" },
  { term: "Blind octaves", korean: "블라인드 옥타브", meaning: "교차 옥타브 (보지 않고)", category: "technique", language: "en" },

  // 테크닉 - 독일어
  { term: "Oktaven", korean: "옥타벤", meaning: "옥타브", category: "technique", language: "de" },
  { term: "Doppelgriffe", korean: "도펠그리페", meaning: "중복 음정", category: "technique", language: "de" },
  { term: "Tonleiter", korean: "톤라이터", meaning: "음계", category: "technique", language: "de" },
  { term: "Akkord", korean: "아코르트", meaning: "화음", category: "technique", language: "de" },
  { term: "Gebrochener Akkord", korean: "게브로헤너 아코르트", meaning: "분산화음", category: "technique", language: "de" },
  { term: "Handkreuzung", korean: "한트크로이충", meaning: "손 교차", category: "technique", language: "de" },
  { term: "Fingersatz", korean: "핑거자츠", meaning: "운지법", category: "technique", language: "de" },
  { term: "Pedal", korean: "페달", meaning: "페달", category: "technique", language: "de" },
  { term: "Mit Pedal", korean: "미트 페달", meaning: "페달을 사용하여", category: "technique", language: "de" },
  { term: "Ohne Pedal", korean: "오네 페달", meaning: "페달 없이", category: "technique", language: "de" },

  // 테크닉 - 프랑스어
  { term: "Octaves", korean: "옥타브", meaning: "옥타브", category: "technique", language: "fr" },
  { term: "Gamme", korean: "감", meaning: "음계", category: "technique", language: "fr" },
  { term: "Gamme chromatique", korean: "감 크로마티크", meaning: "반음계", category: "technique", language: "fr" },
  { term: "Accord", korean: "아코르", meaning: "화음", category: "technique", language: "fr" },
  { term: "Arpège", korean: "아르페주", meaning: "아르페지오", category: "technique", language: "fr" },
  { term: "Doigté", korean: "두아테", meaning: "운지법", category: "technique", language: "fr" },
  { term: "Main droite (M.D.)", korean: "맹 드루아트", meaning: "오른손", category: "technique", language: "fr" },
  { term: "Main gauche (M.G.)", korean: "맹 고슈", meaning: "왼손", category: "technique", language: "fr" },
  { term: "Les deux mains", korean: "레 되 맹", meaning: "양손으로", category: "technique", language: "fr" },
  { term: "Pédale", korean: "페달", meaning: "페달", category: "technique", language: "fr" },
  { term: "Avec pédale", korean: "아벡 페달", meaning: "페달을 사용하여", category: "technique", language: "fr" },
  { term: "Sans pédale", korean: "상 페달", meaning: "페달 없이", category: "technique", language: "fr" },
  { term: "Jeu perlé", korean: "쥬 페를레", meaning: "진주알같이 고른 연주", category: "technique", language: "fr" },
  { term: "15ma", korean: "퀸디체시마", meaning: "두 옥타브 높게", category: "technique" },
  { term: "Loco", korean: "로코", meaning: "제자리로 (8va 해제)", category: "technique" },
  { term: "Ossia", korean: "오시아", meaning: "대안 악구 (다른 연주 방법)", category: "technique" },
  { term: "Ad libitum", korean: "아드 리비툼", meaning: "자유롭게 (ad lib.)", category: "technique" },
  { term: "Divisi", korean: "디비지", meaning: "나누어서 연주", category: "technique" },
  { term: "Unison", korean: "유니즌", meaning: "같은 음으로 함께", category: "technique" },

  // ============ FORM (형식/구조) ============
  { term: "D.C. (Da Capo)", korean: "다 카포", meaning: "처음으로 돌아가서", category: "form" },
  { term: "D.C. al Fine", korean: "다 카포 알 피네", meaning: "처음으로 돌아가 Fine까지", category: "form" },
  { term: "D.C. al Coda", korean: "다 카포 알 코다", meaning: "처음으로 돌아가 Coda로", category: "form" },
  { term: "D.S. (Dal Segno)", korean: "달 세뇨", meaning: "세뇨 표시로 돌아가서", category: "form" },
  { term: "D.S. al Fine", korean: "달 세뇨 알 피네", meaning: "세뇨로 돌아가 Fine까지", category: "form" },
  { term: "D.S. al Coda", korean: "달 세뇨 알 코다", meaning: "세뇨로 돌아가 Coda로", category: "form" },
  { term: "Segno (𝄋)", korean: "세뇨", meaning: "돌아갈 위치 표시", category: "form" },
  { term: "Fine", korean: "피네", meaning: "끝", category: "form" },
  { term: "Coda (𝄌)", korean: "코다", meaning: "종결부로 이동", category: "form" },
  { term: "To Coda", korean: "투 코다", meaning: "코다로 이동", category: "form" },
  { term: "Repeat (:|)", korean: "반복 기호", meaning: "반복하여 연주", category: "form" },
  { term: "1st ending", korean: "1번 괄호", meaning: "첫 번째 연주 시", category: "form" },
  { term: "2nd ending", korean: "2번 괄호", meaning: "두 번째 연주 시", category: "form" },
  { term: "Volta", korean: "볼타", meaning: "반복 괄호", category: "form" },
  { term: "Bis", korean: "비스", meaning: "두 번 반복", category: "form" },
  { term: "Attacca", korean: "아타카", meaning: "쉬지 않고 바로 다음 악장으로", category: "form" },
  { term: "Attacca subito", korean: "아타카 수비토", meaning: "즉시 다음으로", category: "form" },
  { term: "Segue", korean: "세게", meaning: "이어서 계속", category: "form" },
  { term: "Tacet", korean: "타체트", meaning: "연주하지 않음", category: "form" },
  { term: "G.P. (General Pause)", korean: "총휴지", meaning: "모든 파트 쉼", category: "form" },
  { term: "Caesura (//)", korean: "체수라", meaning: "짧은 휴지, 끊음", category: "form" },
  { term: "Introduction", korean: "서주", meaning: "곡의 도입부", category: "form" },
  { term: "Exposition", korean: "제시부", meaning: "주제를 제시하는 부분", category: "form" },
  { term: "Development", korean: "전개부", meaning: "주제를 발전시키는 부분", category: "form" },
  { term: "Recapitulation", korean: "재현부", meaning: "주제가 다시 나타나는 부분", category: "form" },
  { term: "Bridge", korean: "브릿지", meaning: "경과구, 연결부", category: "form" },
  { term: "Cadence", korean: "종지", meaning: "악구나 악절의 끝맺음", category: "form" },
  { term: "Sonata", korean: "소나타", meaning: "기악 독주곡 형식", category: "form" },
  { term: "Rondo", korean: "론도", meaning: "주제가 반복되는 형식 (A-B-A-C-A)", category: "form" },
  { term: "Variations", korean: "변주곡", meaning: "주제와 변주 형식", category: "form" },
  { term: "Étude", korean: "에튀드", meaning: "연습곡", category: "form" },
  { term: "Prelude", korean: "전주곡", meaning: "서곡, 도입 악곡", category: "form" },
  { term: "Fugue", korean: "푸가", meaning: "대위법적 악곡 형식", category: "form" },
  { term: "Nocturne", korean: "녹턴", meaning: "야상곡", category: "form" },
  { term: "Ballade", korean: "발라드", meaning: "서사적 악곡", category: "form" },
  { term: "Scherzo", korean: "스케르초", meaning: "해학적, 빠른 3박자 악곡", category: "form" },
  { term: "Impromptu", korean: "즉흥곡", meaning: "즉흥적 성격의 악곡", category: "form" },
  { term: "Waltz", korean: "왈츠", meaning: "3박자 춤곡", category: "form" },
  { term: "Mazurka", korean: "마주르카", meaning: "폴란드 민속 춤곡", category: "form" },
  { term: "Polonaise", korean: "폴로네이즈", meaning: "폴란드 궁정 춤곡", category: "form" },

  // ============ ORNAMENT (꾸밈음) ============
  { term: "Trill (tr)", korean: "트릴", meaning: "윗음과 빠르게 번갈아 연주", category: "ornament" },
  { term: "Trill with accidental", korean: "변화음 트릴", meaning: "임시표가 붙은 트릴", category: "ornament" },
  { term: "Upper mordent", korean: "윗모르덴트", meaning: "주음-윗음-주음", category: "ornament" },
  { term: "Lower mordent", korean: "아랫모르덴트", meaning: "주음-아랫음-주음", category: "ornament" },
  { term: "Turn", korean: "턴", meaning: "윗음-주음-아랫음-주음", category: "ornament" },
  { term: "Inverted turn", korean: "역턴", meaning: "아랫음-주음-윗음-주음", category: "ornament" },
  { term: "Delayed turn", korean: "지연 턴", meaning: "음표 뒤에 오는 턴", category: "ornament" },
  { term: "Acciaccatura", korean: "아치아카투라", meaning: "매우 짧은 앞꾸밈음", category: "ornament" },
  { term: "Appoggiatura", korean: "아포지아투라", meaning: "긴 앞꾸밈음 (박자 가짐)", category: "ornament" },
  { term: "Double appoggiatura", korean: "겹아포지아투라", meaning: "두 음의 앞꾸밈음", category: "ornament" },
  { term: "Slide", korean: "슬라이드", meaning: "2개 이상 음의 상행 장식음", category: "ornament" },
  { term: "Nachschlag", korean: "나흐슐라그", meaning: "뒷꾸밈음", category: "ornament" },
  { term: "Schleifer", korean: "슐라이퍼", meaning: "미끄러지듯 오르는 장식음", category: "ornament" },
  { term: "Arpeggiato", korean: "아르페지아토", meaning: "화음을 분산하여", category: "ornament" },
];

const categories = [
  { key: "all", label: "전체", icon: BookOpen },
  { key: "tempo", label: "빠르기", icon: Gauge },
  { key: "dynamics", label: "셈여림", icon: Volume2 },
  { key: "articulation", label: "아티큘레이션", icon: Music },
  { key: "expression", label: "표현", icon: Music },
  { key: "technique", label: "테크닉", icon: Hand },
  { key: "form", label: "형식", icon: BookOpen },
  { key: "ornament", label: "꾸밈음", icon: Music },
];

const languages = [
  { key: "all", label: "전체" },
  { key: "it", label: "이태리어" },
  { key: "de", label: "독일어" },
  { key: "fr", label: "프랑스어" },
  { key: "en", label: "영어" },
];

export default function MusicTermsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  const filteredTerms = useMemo(() => {
    return musicTerms.filter((term) => {
      const matchesCategory = selectedCategory === "all" || term.category === selectedCategory;
      const matchesLanguage = selectedLanguage === "all" || term.language === selectedLanguage || (!term.language && selectedLanguage === "it");
      const matchesSearch = searchQuery === "" ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.korean.includes(searchQuery) ||
        term.meaning.includes(searchQuery);
      return matchesCategory && matchesLanguage && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedLanguage]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "tempo": return "bg-blue-100 text-blue-700";
      case "dynamics": return "bg-orange-100 text-orange-700";
      case "articulation": return "bg-green-100 text-green-700";
      case "expression": return "bg-purple-100 text-purple-700";
      case "technique": return "bg-pink-100 text-pink-700";
      case "form": return "bg-amber-100 text-amber-700";
      case "ornament": return "bg-cyan-100 text-cyan-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "tempo": return "빠르기";
      case "dynamics": return "셈여림";
      case "articulation": return "아티큘레이션";
      case "expression": return "표현";
      case "technique": return "테크닉";
      case "form": return "형식";
      case "ornament": return "꾸밈음";
      default: return category;
    }
  };

  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case "it": return "🇮🇹";
      case "de": return "🇩🇪";
      case "fr": return "🇫🇷";
      case "en": return "🇬🇧";
      default: return "🇮🇹";
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-colors border border-white/50"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">음악용어 검색</h1>
          <p className="text-xs text-muted-foreground">악보 기호와 용어 뜻 알아보기</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="용어 검색 (예: allegro, 알레그로, 빠르게)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3.5 bg-white/60 backdrop-blur-xl rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 border border-white/60 shadow-sm"
        />
      </div>

      {/* Language Filter */}
      <div className="flex gap-2 mb-3">
        {languages.map((lang) => (
          <button
            key={lang.key}
            onClick={() => setSelectedLanguage(lang.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedLanguage === lang.key
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white/40 text-gray-600 hover:bg-white/60"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.key
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white/40 text-gray-600 hover:bg-white/60"
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-xs text-muted-foreground mb-3">
        {filteredTerms.length}개의 용어
      </p>

      {/* Terms List */}
      <div className="space-y-2">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : (
          filteredTerms.map((term, index) => (
            <div
              key={index}
              className="bg-white/50 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 border border-white/60 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  {term.term} <span className="font-medium text-violet-600">{term.korean}</span>
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${getCategoryColor(term.category)}`}>
                  {getCategoryLabel(term.category)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{term.meaning}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
