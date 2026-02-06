"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, BookOpen, Music, Volume2, Gauge, Hand } from "lucide-react";

interface MusicTerm {
  term: string;
  korean: string;
  meaning: string;
  category: "tempo" | "dynamics" | "articulation" | "expression" | "technique" | "form" | "ornament";
  pronunciation?: string;
}

const musicTerms: MusicTerm[] = [
  // ============ TEMPO (빠르기) ============
  { term: "Grave", korean: "그라베", meaning: "매우 느리고 장중하게 (25-45 BPM)", category: "tempo" },
  { term: "Largo", korean: "라르고", meaning: "매우 느리게 (40-60 BPM)", category: "tempo" },
  { term: "Larghetto", korean: "라르게토", meaning: "라르고보다 조금 빠르게 (60-66 BPM)", category: "tempo" },
  { term: "Lento", korean: "렌토", meaning: "느리게 (45-60 BPM)", category: "tempo" },
  { term: "Adagio", korean: "아다지오", meaning: "느리고 편안하게 (66-76 BPM)", category: "tempo" },
  { term: "Adagietto", korean: "아다지에토", meaning: "아다지오보다 조금 빠르게", category: "tempo" },
  { term: "Andante", korean: "안단테", meaning: "걷는 빠르기로 (76-108 BPM)", category: "tempo" },
  { term: "Andantino", korean: "안단티노", meaning: "안단테보다 조금 빠르게", category: "tempo" },
  { term: "Moderato", korean: "모데라토", meaning: "보통 빠르기로 (108-120 BPM)", category: "tempo" },
  { term: "Allegretto", korean: "알레그레토", meaning: "조금 빠르게 (112-120 BPM)", category: "tempo" },
  { term: "Allegro", korean: "알레그로", meaning: "빠르게 (120-168 BPM)", category: "tempo" },
  { term: "Allegro moderato", korean: "알레그로 모데라토", meaning: "적당히 빠르게", category: "tempo" },
  { term: "Allegro vivace", korean: "알레그로 비바체", meaning: "빠르고 생기있게", category: "tempo" },
  { term: "Vivace", korean: "비바체", meaning: "빠르고 생기있게 (168-176 BPM)", category: "tempo" },
  { term: "Vivacissimo", korean: "비바치시모", meaning: "매우 빠르고 생기있게", category: "tempo" },
  { term: "Presto", korean: "프레스토", meaning: "매우 빠르게 (168-200 BPM)", category: "tempo" },
  { term: "Prestissimo", korean: "프레스티시모", meaning: "가능한 한 빠르게 (200+ BPM)", category: "tempo" },
  { term: "Accelerando", korean: "아첼레란도", meaning: "점점 빠르게 (accel.)", category: "tempo" },
  { term: "Stringendo", korean: "스트린젠도", meaning: "긴장감 있게 점점 빠르게", category: "tempo" },
  { term: "Affrettando", korean: "아프레탄도", meaning: "서둘러 빠르게", category: "tempo" },
  { term: "Ritardando", korean: "리타르단도", meaning: "점점 느리게 (rit.)", category: "tempo" },
  { term: "Rallentando", korean: "랄렌탄도", meaning: "점점 느리게 (rall.)", category: "tempo" },
  { term: "Ritenuto", korean: "리테누토", meaning: "곧바로 느리게 (riten.)", category: "tempo" },
  { term: "Slentando", korean: "슬렌탄도", meaning: "점점 느려지며", category: "tempo" },
  { term: "Allargando", korean: "알라르간도", meaning: "점점 느려지며 세게", category: "tempo" },
  { term: "Calando", korean: "칼란도", meaning: "점점 느리고 여리게", category: "tempo" },
  { term: "Morendo", korean: "모렌도", meaning: "사라지듯이 점점 느리고 여리게", category: "tempo" },
  { term: "Smorzando", korean: "스모르잔도", meaning: "사그라지듯이", category: "tempo" },
  { term: "A tempo", korean: "아 템포", meaning: "원래 빠르기로", category: "tempo" },
  { term: "Tempo primo", korean: "템포 프리모", meaning: "처음 빠르기로", category: "tempo" },
  { term: "Tempo giusto", korean: "템포 주스토", meaning: "정확한 템포로", category: "tempo" },
  { term: "Tempo rubato", korean: "템포 루바토", meaning: "자유롭게 템포를 변화시키며", category: "tempo" },
  { term: "L'istesso tempo", korean: "리스테소 템포", meaning: "같은 빠르기로", category: "tempo" },
  { term: "Tempo comodo", korean: "템포 코모도", meaning: "편안한 빠르기로", category: "tempo" },
  { term: "Meno mosso", korean: "메노 모소", meaning: "덜 빠르게 (더 느리게)", category: "tempo" },
  { term: "Più mosso", korean: "피우 모소", meaning: "더 빠르게", category: "tempo" },
  { term: "Doppio movimento", korean: "도피오 모비멘토", meaning: "두 배의 빠르기로", category: "tempo" },

  // ============ DYNAMICS (셈여림) ============
  { term: "ppp (pianississimo)", korean: "피아니시시모", meaning: "가능한 한 여리게", category: "dynamics" },
  { term: "pp (pianissimo)", korean: "피아니시모", meaning: "매우 여리게", category: "dynamics" },
  { term: "p (piano)", korean: "피아노", meaning: "여리게", category: "dynamics" },
  { term: "mp (mezzo piano)", korean: "메조 피아노", meaning: "조금 여리게", category: "dynamics" },
  { term: "mf (mezzo forte)", korean: "메조 포르테", meaning: "조금 세게", category: "dynamics" },
  { term: "f (forte)", korean: "포르테", meaning: "세게", category: "dynamics" },
  { term: "ff (fortissimo)", korean: "포르티시모", meaning: "매우 세게", category: "dynamics" },
  { term: "fff (fortississimo)", korean: "포르티시시모", meaning: "가능한 한 세게", category: "dynamics" },
  { term: "sfz (sforzando)", korean: "스포르잔도", meaning: "갑자기 세게 강조", category: "dynamics" },
  { term: "sf (sforzato)", korean: "스포르차토", meaning: "세게 강조하여", category: "dynamics" },
  { term: "fz (forzando)", korean: "포르잔도", meaning: "강하게 강조", category: "dynamics" },
  { term: "rf / rfz (rinforzando)", korean: "린포르잔도", meaning: "갑자기 강조", category: "dynamics" },
  { term: "fp (forte piano)", korean: "포르테 피아노", meaning: "세게 후 바로 여리게", category: "dynamics" },
  { term: "sfp", korean: "스포르잔도 피아노", meaning: "강조 후 바로 여리게", category: "dynamics" },
  { term: "pf (piano forte)", korean: "피아노 포르테", meaning: "여리게 후 세게", category: "dynamics" },
  { term: "Crescendo", korean: "크레센도", meaning: "점점 세게 (cresc.)", category: "dynamics" },
  { term: "Decrescendo", korean: "데크레센도", meaning: "점점 여리게 (decresc.)", category: "dynamics" },
  { term: "Diminuendo", korean: "디미누엔도", meaning: "점점 여리게 (dim.)", category: "dynamics" },
  { term: "Perdendosi", korean: "페르덴도시", meaning: "사라지듯이 점점 여리게", category: "dynamics" },
  { term: "Sotto voce", korean: "소토 보체", meaning: "속삭이듯이 작은 소리로", category: "dynamics" },
  { term: "Mezza voce", korean: "메짜 보체", meaning: "절반의 소리로, 부드럽게", category: "dynamics" },
  { term: "A mezza voce", korean: "아 메짜 보체", meaning: "절반의 음량으로", category: "dynamics" },
  { term: "Forte possibile", korean: "포르테 포시빌레", meaning: "가능한 한 세게", category: "dynamics" },
  { term: "Più forte", korean: "피우 포르테", meaning: "더 세게", category: "dynamics" },
  { term: "Meno forte", korean: "메노 포르테", meaning: "덜 세게", category: "dynamics" },
  { term: "Più piano", korean: "피우 피아노", meaning: "더 여리게", category: "dynamics" },
  { term: "Fortepiano (악기)", korean: "포르테피아노", meaning: "피아노의 옛 명칭 (악기)", category: "dynamics" },

  // ============ ARTICULATION (아티큘레이션) ============
  { term: "Legato", korean: "레가토", meaning: "음을 끊지 않고 부드럽게 연결하여", category: "articulation" },
  { term: "Legatissimo", korean: "레가티시모", meaning: "매우 부드럽게 연결하여", category: "articulation" },
  { term: "Staccato", korean: "스타카토", meaning: "음을 짧게 끊어서", category: "articulation" },
  { term: "Staccatissimo", korean: "스타카티시모", meaning: "매우 짧게 끊어서", category: "articulation" },
  { term: "Mezzo staccato", korean: "메조 스타카토", meaning: "보통 정도로 끊어서", category: "articulation" },
  { term: "Tenuto", korean: "테누토", meaning: "음의 길이를 충분히 유지하며", category: "articulation" },
  { term: "Marcato", korean: "마르카토", meaning: "강조하여, 또렷하게", category: "articulation" },
  { term: "Accent (>)", korean: "악센트", meaning: "해당 음을 강조하여", category: "articulation" },
  { term: "Portato", korean: "포르타토", meaning: "레가토와 스타카토 사이로", category: "articulation" },
  { term: "Portamento", korean: "포르타멘토", meaning: "음에서 음으로 미끄러지듯이", category: "articulation" },
  { term: "Fermata", korean: "페르마타", meaning: "늘임표, 음을 적당히 늘여서", category: "articulation" },
  { term: "Lunga", korean: "룽가", meaning: "길게 (페르마타와 함께)", category: "articulation" },
  { term: "Non legato", korean: "논 레가토", meaning: "레가토가 아니게, 약간 끊어서", category: "articulation" },
  { term: "Ben marcato", korean: "벤 마르카토", meaning: "잘 강조하여", category: "articulation" },
  { term: "Détaché", korean: "데타셰", meaning: "음을 분리하여 (프랑스어)", category: "articulation" },
  { term: "Louré", korean: "루레", meaning: "각 음을 강조하며 연결", category: "articulation" },

  // ============ EXPRESSION (표현) ============
  { term: "Dolce", korean: "돌체", meaning: "달콤하게, 부드럽게", category: "expression" },
  { term: "Dolcissimo", korean: "돌치시모", meaning: "매우 달콤하게", category: "expression" },
  { term: "Espressivo", korean: "에스프레시보", meaning: "표정 풍부하게 (espress.)", category: "expression" },
  { term: "Cantabile", korean: "칸타빌레", meaning: "노래하듯이", category: "expression" },
  { term: "Cantando", korean: "칸탄도", meaning: "노래하며", category: "expression" },
  { term: "Con anima", korean: "콘 아니마", meaning: "영혼을 담아", category: "expression" },
  { term: "Con brio", korean: "콘 브리오", meaning: "생기있게, 활기차게", category: "expression" },
  { term: "Con fuoco", korean: "콘 푸오코", meaning: "불같이, 열정적으로", category: "expression" },
  { term: "Con forza", korean: "콘 포르차", meaning: "힘차게", category: "expression" },
  { term: "Con grazia", korean: "콘 그라치아", meaning: "우아함을 가지고", category: "expression" },
  { term: "Con moto", korean: "콘 모토", meaning: "움직임을 가지고", category: "expression" },
  { term: "Con spirito", korean: "콘 스피리토", meaning: "정신을 담아, 활기차게", category: "expression" },
  { term: "Con calore", korean: "콘 칼로레", meaning: "따뜻하게, 열정적으로", category: "expression" },
  { term: "Con amore", korean: "콘 아모레", meaning: "사랑을 담아", category: "expression" },
  { term: "Con delicatezza", korean: "콘 델리카테짜", meaning: "섬세하게", category: "expression" },
  { term: "Con eleganza", korean: "콘 엘레간차", meaning: "우아하게", category: "expression" },
  { term: "Agitato", korean: "아지타토", meaning: "격렬하게, 흥분하여", category: "expression" },
  { term: "Animato", korean: "아니마토", meaning: "생기있게, 활발하게", category: "expression" },
  { term: "Appassionato", korean: "아파시오나토", meaning: "열정적으로", category: "expression" },
  { term: "Affettuoso", korean: "아페투오소", meaning: "애정을 담아", category: "expression" },
  { term: "Amoroso", korean: "아모로소", meaning: "사랑스럽게", category: "expression" },
  { term: "Brillante", korean: "브릴란테", meaning: "화려하게, 빛나게", category: "expression" },
  { term: "Capriccioso", korean: "카프리치오소", meaning: "변덕스럽게, 자유롭게", category: "expression" },
  { term: "Comodo", korean: "코모도", meaning: "편안하게", category: "expression" },
  { term: "Deciso", korean: "데치소", meaning: "단호하게, 결연하게", category: "expression" },
  { term: "Delicato", korean: "델리카토", meaning: "섬세하게", category: "expression" },
  { term: "Disperato", korean: "디스페라토", meaning: "절망적으로", category: "expression" },
  { term: "Drammatico", korean: "드람마티코", meaning: "극적으로", category: "expression" },
  { term: "Energico", korean: "에네르지코", meaning: "에너지 넘치게", category: "expression" },
  { term: "Eroico", korean: "에로이코", meaning: "영웅적으로", category: "expression" },
  { term: "Feroce", korean: "페로체", meaning: "사납게, 격렬하게", category: "expression" },
  { term: "Festivo", korean: "페스티보", meaning: "축제처럼, 경쾌하게", category: "expression" },
  { term: "Flebile", korean: "플레빌레", meaning: "슬프게, 구슬프게", category: "expression" },
  { term: "Furioso", korean: "푸리오소", meaning: "격노하여, 맹렬하게", category: "expression" },
  { term: "Giocoso", korean: "지오코소", meaning: "유쾌하게, 장난스럽게", category: "expression" },
  { term: "Grandioso", korean: "그란디오소", meaning: "웅장하게", category: "expression" },
  { term: "Grazioso", korean: "그라치오소", meaning: "우아하게", category: "expression" },
  { term: "Impetuoso", korean: "임페투오소", meaning: "격렬하게, 맹렬하게", category: "expression" },
  { term: "Innocente", korean: "인노첸테", meaning: "순수하게, 천진하게", category: "expression" },
  { term: "Lamentoso", korean: "라멘토소", meaning: "슬프게, 애통하게", category: "expression" },
  { term: "Languido", korean: "랑귀도", meaning: "나른하게", category: "expression" },
  { term: "Leggiero", korean: "레지에로", meaning: "가볍게", category: "expression" },
  { term: "Lugubre", korean: "루구브레", meaning: "음울하게, 침울하게", category: "expression" },
  { term: "Lusingando", korean: "루싱간도", meaning: "아첨하듯이, 달콤하게", category: "expression" },
  { term: "Maestoso", korean: "마에스토소", meaning: "장엄하게, 위엄있게", category: "expression" },
  { term: "Malinconico", korean: "말린코니코", meaning: "우울하게", category: "expression" },
  { term: "Martellato", korean: "마르텔라토", meaning: "망치로 치듯이 강하게", category: "expression" },
  { term: "Marziale", korean: "마르치알레", meaning: "행진곡풍으로", category: "expression" },
  { term: "Mesto", korean: "메스토", meaning: "슬프게", category: "expression" },
  { term: "Misterioso", korean: "미스테리오소", meaning: "신비롭게", category: "expression" },
  { term: "Nobile", korean: "노빌레", meaning: "고귀하게", category: "expression" },
  { term: "Parlando", korean: "파를란도", meaning: "말하듯이", category: "expression" },
  { term: "Pastorale", korean: "파스토랄레", meaning: "목가적으로", category: "expression" },
  { term: "Patetico", korean: "파테티코", meaning: "비장하게, 감동적으로", category: "expression" },
  { term: "Pesante", korean: "페잔테", meaning: "무겁게", category: "expression" },
  { term: "Piacevole", korean: "피아체볼레", meaning: "즐겁게, 기분 좋게", category: "expression" },
  { term: "Placido", korean: "플라치도", meaning: "평화롭게, 고요하게", category: "expression" },
  { term: "Pomposo", korean: "폼포소", meaning: "화려하게, 장대하게", category: "expression" },
  { term: "Religioso", korean: "렐리지오소", meaning: "경건하게, 종교적으로", category: "expression" },
  { term: "Risoluto", korean: "리솔루토", meaning: "단호하게, 결연하게", category: "expression" },
  { term: "Rustico", korean: "루스티코", meaning: "소박하게, 시골풍으로", category: "expression" },
  { term: "Scherzando", korean: "스케르잔도", meaning: "장난스럽게, 해학적으로", category: "expression" },
  { term: "Semplice", korean: "셈플리체", meaning: "단순하게, 소박하게", category: "expression" },
  { term: "Sereno", korean: "세레노", meaning: "평온하게, 맑게", category: "expression" },
  { term: "Soave", korean: "소아베", meaning: "부드럽게, 감미롭게", category: "expression" },
  { term: "Solenne", korean: "솔렌네", meaning: "엄숙하게", category: "expression" },
  { term: "Sonore", korean: "소노레", meaning: "울림 있게, 낭랑하게", category: "expression" },
  { term: "Sostenuto", korean: "소스테누토", meaning: "음을 충분히 유지하며", category: "expression" },
  { term: "Spiritoso", korean: "스피리토소", meaning: "재치있게, 정신적으로", category: "expression" },
  { term: "Teneramente", korean: "테네라멘테", meaning: "부드럽게, 다정하게", category: "expression" },
  { term: "Tranquillo", korean: "트란퀼로", meaning: "조용하게, 평화롭게", category: "expression" },
  { term: "Trionfale", korean: "트리온팔레", meaning: "승리감 있게", category: "expression" },
  { term: "Vivo", korean: "비보", meaning: "생기있게", category: "expression" },

  // 수식어 (Modifiers)
  { term: "Molto", korean: "몰토", meaning: "매우", category: "expression" },
  { term: "Poco", korean: "포코", meaning: "조금", category: "expression" },
  { term: "Poco a poco", korean: "포코 아 포코", meaning: "조금씩", category: "expression" },
  { term: "Più", korean: "피우", meaning: "더", category: "expression" },
  { term: "Meno", korean: "메노", meaning: "덜", category: "expression" },
  { term: "Sempre", korean: "셈프레", meaning: "항상, 계속", category: "expression" },
  { term: "Subito", korean: "수비토", meaning: "갑자기", category: "expression" },
  { term: "Assai", korean: "아사이", meaning: "매우, 대단히", category: "expression" },
  { term: "Quasi", korean: "콰지", meaning: "거의, ~처럼", category: "expression" },
  { term: "Non troppo", korean: "논 트로포", meaning: "지나치지 않게", category: "expression" },
  { term: "Ma non troppo", korean: "마 논 트로포", meaning: "그러나 지나치지 않게", category: "expression" },
  { term: "Ben", korean: "벤", meaning: "잘, 충분히", category: "expression" },
  { term: "Come prima", korean: "코메 프리마", meaning: "처음처럼", category: "expression" },
  { term: "Come sopra", korean: "코메 소프라", meaning: "위와 같이", category: "expression" },
  { term: "Senza", korean: "센차", meaning: "~없이", category: "expression" },
  { term: "Con", korean: "콘", meaning: "~와 함께, ~을 가지고", category: "expression" },

  // ============ TECHNIQUE (테크닉) ============
  { term: "Arpeggio", korean: "아르페지오", meaning: "화음을 분산하여 차례로 연주", category: "technique" },
  { term: "Glissando", korean: "글리산도", meaning: "건반을 미끄러지듯 연주", category: "technique" },
  { term: "Tremolo", korean: "트레몰로", meaning: "같은 음을 빠르게 반복", category: "technique" },
  { term: "Trill (tr)", korean: "트릴", meaning: "두 인접음을 빠르게 번갈아 연주", category: "technique" },
  { term: "Mordent", korean: "모르덴트", meaning: "짧은 꾸밈음 (아래 음)", category: "technique" },
  { term: "Inverted mordent", korean: "역모르덴트", meaning: "짧은 꾸밈음 (위 음)", category: "technique" },
  { term: "Turn", korean: "턴", meaning: "돌려치기 (4개 음의 꾸밈음)", category: "technique" },
  { term: "Inverted turn", korean: "역턴", meaning: "아래로 시작하는 턴", category: "technique" },
  { term: "Grace note", korean: "장식음", meaning: "작은 음표로 표시된 꾸밈음", category: "technique" },
  { term: "Acciaccatura", korean: "아치아카투라", meaning: "짧은 전타음 (빗금 있는 장식음)", category: "technique" },
  { term: "Appoggiatura", korean: "아포지아투라", meaning: "긴 전타음", category: "technique" },
  { term: "Cadenza", korean: "카덴차", meaning: "독주자의 자유로운 기교적 악구", category: "technique" },
  { term: "Octave", korean: "옥타브", meaning: "8도 음정, 양손 또는 한손으로", category: "technique" },
  { term: "Double octave", korean: "더블 옥타브", meaning: "15도 음정 (2옥타브)", category: "technique" },
  { term: "Chord", korean: "코드/화음", meaning: "동시에 울리는 여러 음", category: "technique" },
  { term: "Broken chord", korean: "분산화음", meaning: "화음을 순차적으로 연주", category: "technique" },
  { term: "Alberti bass", korean: "알베르티 베이스", meaning: "분산화음 반주 패턴", category: "technique" },
  { term: "Scale", korean: "스케일/음계", meaning: "순차적으로 오르내리는 음", category: "technique" },
  { term: "Chromatic scale", korean: "반음계", meaning: "반음씩 오르내리는 음계", category: "technique" },
  { term: "Cross hands", korean: "교차연주", meaning: "양손을 교차하여 연주", category: "technique" },
  { term: "M.D. (mano destra)", korean: "마노 데스트라", meaning: "오른손으로", category: "technique" },
  { term: "M.S. (mano sinistra)", korean: "마노 시니스트라", meaning: "왼손으로", category: "technique" },
  { term: "R.H. (Right Hand)", korean: "오른손", meaning: "오른손으로", category: "technique" },
  { term: "L.H. (Left Hand)", korean: "왼손", meaning: "왼손으로", category: "technique" },
  { term: "Una corda", korean: "우나 코르다", meaning: "왼쪽 페달 (소프트 페달)", category: "technique" },
  { term: "Tre corde", korean: "트레 코르데", meaning: "우나 코르다 해제", category: "technique" },
  { term: "Tutte le corde", korean: "투테 레 코르데", meaning: "모든 현으로 (페달 해제)", category: "technique" },
  { term: "Con pedale", korean: "콘 페달레", meaning: "페달을 사용하여", category: "technique" },
  { term: "Senza pedale", korean: "센차 페달레", meaning: "페달 없이", category: "technique" },
  { term: "Ped.", korean: "페달", meaning: "오른쪽 페달 (서스테인)", category: "technique" },
  { term: "Sostenuto pedal", korean: "소스테누토 페달", meaning: "가운데 페달", category: "technique" },
  { term: "Half pedal", korean: "하프 페달", meaning: "페달을 반만 밟아서", category: "technique" },
  { term: "Simile", korean: "시밀레", meaning: "앞과 같은 방식으로 계속", category: "technique" },
  { term: "8va", korean: "옥타바 알타", meaning: "한 옥타브 높게", category: "technique" },
  { term: "8vb (8va bassa)", korean: "옥타바 바싸", meaning: "한 옥타브 낮게", category: "technique" },
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

export default function MusicTermsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTerms = useMemo(() => {
    return musicTerms.filter((term) => {
      const matchesCategory = selectedCategory === "all" || term.category === selectedCategory;
      const matchesSearch = searchQuery === "" ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.korean.includes(searchQuery) ||
        term.meaning.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

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

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">음악용어 검색</h1>
          <p className="text-xs text-muted-foreground">악보 기호와 용어 뜻 알아보기</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
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
          className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.key
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
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
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : (
          filteredTerms.map((term, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-foreground">{term.term}</h3>
                  <p className="text-sm text-primary">{term.korean}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(term.category)}`}>
                  {getCategoryLabel(term.category)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{term.meaning}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
