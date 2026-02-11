const quotes = [
  {
    text: "음악가에게 휴식은 없다. 쉬는 날도 연습하는 날이다.",
    author: "Pablo Casals",
  },
  {
    text: "연습은 거짓말을 하지 않는다.",
    author: "Vladimir Horowitz",
  },
  {
    text: "음악은 말로 표현할 수 없는 것을 표현한다.",
    author: "Victor Hugo",
  },
  {
    text: "천재성이란 1%의 영감과 99%의 노력이다.",
    author: "Thomas Edison",
  },
  {
    text: "하루라도 연습을 거르면 나 자신이 알고, 이틀을 거르면 비평가가 알고, 사흘을 거르면 청중이 안다.",
    author: "Ignacy Paderewski",
  },
  {
    text: "음악은 영혼의 언어이다.",
    author: "Kahlil Gibran",
  },
  {
    text: "천천히, 그러나 확실하게. 그것이 연습의 비밀이다.",
    author: "Franz Liszt",
  },
  {
    text: "피아노를 치는 것은 쉽다. 올바른 건반을 올바른 순간에 누르기만 하면 된다.",
    author: "J.S. Bach",
  },
  {
    text: "음악 없는 삶은 실수다.",
    author: "Friedrich Nietzsche",
  },
  {
    text: "연습할 때는 완벽을 목표로, 무대에서는 음악을 목표로.",
    author: "Arthur Rubinstein",
  },
  {
    text: "가장 어려운 부분을 먼저 연습하라. 그러면 나머지는 쉬워진다.",
    author: "Clara Schumann",
  },
  {
    text: "음악은 시간 속의 건축이다.",
    author: "Igor Stravinsky",
  },
  {
    text: "완벽한 연습만이 완벽을 만든다.",
    author: "Vince Lombardi",
  },
  {
    text: "음악은 느끼는 것이지, 이해하는 것이 아니다.",
    author: "Leonard Bernstein",
  },
  {
    text: "매일 조금씩, 그것이 위대함으로 가는 길이다.",
    author: "Robert Schumann",
  },
  {
    text: "재능은 타고나지만, 기술은 연습으로 만들어진다.",
    author: "Sergei Rachmaninoff",
  },
  {
    text: "음악을 연주하는 것은 말하는 것과 같다. 무엇을 말하고 싶은지 알아야 한다.",
    author: "Martha Argerich",
  },
  {
    text: "끊임없이 배우고, 끊임없이 연습하라.",
    author: "Ludwig van Beethoven",
  },
  {
    text: "단순함은 궁극의 정교함이다.",
    author: "F. Chopin",
  },
  {
    text: "음악은 더 높은 계시다. 어떤 지혜나 철학보다도.",
    author: "Ludwig van Beethoven",
  },
  {
    text: "하루 한 시간의 연습이 일주일의 후회를 없앤다.",
    author: "Chinese Proverb",
  },
  {
    text: "실수를 두려워하지 마라. 실수가 없으면 발전도 없다.",
    author: "Miles Davis",
  },
  {
    text: "연습은 당신이 원하는 사람이 되게 해준다.",
    author: "Julie Andrews",
  },
  {
    text: "느리게 연습하면, 빠르게 배운다.",
    author: "Yo-Yo Ma",
  },
];

export function QuoteCard() {
  // 1시간마다 명언이 바뀌도록 계산
  const now = new Date();
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60));
  const quote = quotes[hoursSinceEpoch % quotes.length];

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400">
          오늘의 명언
        </span>

        <blockquote>
          <p className="text-sm font-serif text-black leading-relaxed break-keep text-pretty">
            &quot;{quote.text}&quot;
          </p>
          <footer className="mt-2 flex items-center gap-2">
            <div className="h-px w-6 bg-gray-300" />
            <cite className="text-[10px] font-medium text-gray-500 not-italic">
              {quote.author}
            </cite>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
