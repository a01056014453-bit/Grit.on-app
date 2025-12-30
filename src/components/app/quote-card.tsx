import { Sparkles } from "lucide-react";

const quotes = [
  {
    text: "음악가에게 휴식은 없다. 쉬는 날도 연습하는 날이다.",
    author: "파블로 카잘스",
  },
  {
    text: "연습은 거짓말을 하지 않는다.",
    author: "호로비츠",
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
];

export function QuoteCard() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const quote = quotes[dayOfYear % quotes.length];

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group hover:shadow-soft transition-shadow duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-primary/10" />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase text-primary/60">Daily Inspiration</span>
        </div>
        
        <blockquote className="relative">
          <p className="text-lg font-serif text-slate-800 leading-relaxed break-keep">
            &quot;{quote.text}&quot;
          </p>
          <footer className="mt-3 flex items-center gap-2">
            <div className="h-px w-8 bg-slate-200" />
            <cite className="text-xs font-medium text-slate-500 not-italic">
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
