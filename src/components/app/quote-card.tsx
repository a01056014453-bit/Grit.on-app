import { Sparkles } from "lucide-react";

const quotes = [
  {
    text: "음악가에게 휴식은 없다. 쉬는 날도 연습하는 날이다.",
    author: "파블로 카잘스",
  },
  {
    text: "연습은 거짓말을 하지 않는다.",
    author: "블라디미르 호로비츠",
  },
  {
    text: "음악은 말로 표현할 수 없는 것을 표현한다.",
    author: "빅토르 위고",
  },
  {
    text: "천재성이란 1%의 영감과 99%의 노력이다.",
    author: "토마스 에디슨",
  },
  {
    text: "하루라도 연습을 거르면 나 자신이 알고, 이틀을 거르면 비평가가 알고, 사흘을 거르면 청중이 안다.",
    author: "이그나치 파데레프스키",
  },
  {
    text: "음악은 영혼의 언어이다.",
    author: "칼릴 지브란",
  },
  {
    text: "천천히, 그러나 확실하게. 그것이 연습의 비밀이다.",
    author: "프란츠 리스트",
  },
  {
    text: "피아노를 치는 것은 쉽다. 올바른 건반을 올바른 순간에 누르기만 하면 된다.",
    author: "요한 세바스찬 바흐",
  },
  {
    text: "음악 없는 삶은 실수다.",
    author: "프리드리히 니체",
  },
  {
    text: "연습할 때는 완벽을 목표로, 무대에서는 음악을 목표로.",
    author: "아르투르 루빈스타인",
  },
  {
    text: "가장 어려운 부분을 먼저 연습하라. 그러면 나머지는 쉬워진다.",
    author: "클라라 슈만",
  },
  {
    text: "음악은 시간 속의 건축이다.",
    author: "이고르 스트라빈스키",
  },
  {
    text: "완벽한 연습만이 완벽을 만든다.",
    author: "빈스 롬바르디",
  },
  {
    text: "음악은 느끼는 것이지, 이해하는 것이 아니다.",
    author: "레너드 번스타인",
  },
  {
    text: "매일 조금씩, 그것이 위대함으로 가는 길이다.",
    author: "로베르트 슈만",
  },
];

export function QuoteCard() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const quote = quotes[dayOfYear % quotes.length];

  return (
    <div className="relative overflow-hidden bg-card rounded-2xl p-6 shadow-sm border border-border group hover:shadow-soft transition-shadow duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-primary/10" />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase text-primary/60">Daily Inspiration</span>
        </div>
        
        <blockquote className="relative">
          <p className="text-lg font-serif text-card-foreground leading-relaxed break-keep">
            &quot;{quote.text}&quot;
          </p>
          <footer className="mt-3 flex items-center gap-2">
            <div className="h-px w-8 bg-border" />
            <cite className="text-xs font-medium text-muted-foreground not-italic">
              {quote.author}
            </cite>
          </footer>
        </blockquote>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
    </div>
  );
}