"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-white text-black font-sans">
      {/* SECTION 1 — Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            GRIT.ON
          </h1>
          <p className="text-lg text-gray-500 mb-2">
            클래식 연습의 모든 것
          </p>
          <p className="text-base text-gray-600 mb-12 leading-relaxed">
            실시간 연습 녹음과 분석으로<br />
            어디를 어떻게 연습해야 하는지 명확하게
          </p>

          {/* iPhone Mockup */}
          <div className="relative mx-auto mb-12 max-w-xs">
            <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                {/* Mockup Content - Sheet Music with Highlight */}
                <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="text-center mb-6">
                    <p className="text-sm font-semibold text-black">쇼팽 발라드 1번</p>
                    <p className="text-xs text-gray-400">mm. 32-48</p>
                  </div>

                  {/* Sheet Music Lines (simplified) */}
                  <div className="flex-1 relative">
                    {/* Staff Lines */}
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="mb-6">
                        <div className="space-y-1">
                          {[0, 1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-px bg-gray-200"></div>
                          ))}
                        </div>
                        {/* Notes placeholder */}
                        <div className="flex gap-2 mt-1 px-2">
                          {[0, 1, 2, 3, 4, 5].map((k) => (
                            <div
                              key={k}
                              className={`w-2 h-2 rounded-full ${k === 2 || k === 3 ? 'bg-red-400' : 'bg-gray-400'}`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Highlight Overlay */}
                    <div className="absolute top-12 left-4 right-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-500">⏱</span>
                          <span className="text-red-600 font-medium">리듬이 흔들리는 구간</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          이 구간 집중 연습 · Tempo 76
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dynamic Island */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-gray-900 transition-colors"
          >
            시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* SECTION 2 — Problem */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black mb-8">
            연습은 많이 했는데,<br />
            <span className="text-gray-400">어디를 연습해야 하는지 모르겠나요?</span>
          </p>
          <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black mb-12">
            레슨 후,<br />
            <span className="text-gray-400">무엇을 연습하라고 했는지 기억나지 않나요?</span>
          </p>
          <p className="text-xl text-black font-semibold">
            GRIT.ON이 연습을 명확하게 만들어줍니다.
          </p>
        </div>
      </section>

      {/* SECTION 3 — Feature 1: 실시간 연습 녹음 및 분석 */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black">
                실시간으로 연습을 녹음하고
              </p>
              <p className="text-xl md:text-2xl text-gray-500 mt-4 leading-relaxed">
                AI가<br />
                가장 자주 틀리는 구간,<br />
                리듬이 흔들리는 구간,<br />
                양손이 어긋나는 구간을 찾아줍니다.
              </p>
            </div>

            {/* Mockup */}
            <div className="relative mx-auto max-w-xs">
              <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                      <span>9:41</span>
                    </div>
                    <div className="text-center mb-4">
                      <p className="text-sm font-semibold">AI 분석 결과</p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs font-medium text-red-600">자주 틀리는 구간</p>
                        <p className="text-xs text-gray-500 mt-1">mm. 32-36 · 3회 반복 오류</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <p className="text-xs font-medium text-orange-600">리듬 불안정</p>
                        <p className="text-xs text-gray-500 mt-1">mm. 45-48 · 템포 흔들림</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <p className="text-xs font-medium text-yellow-600">양손 타이밍</p>
                        <p className="text-xs text-gray-500 mt-1">mm. 52-54 · 0.1초 차이</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Feature 2: 순 연습시간 자동 기록 */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Mockup */}
            <div className="relative mx-auto max-w-xs order-2 md:order-1">
              <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col items-center justify-center">
                    <p className="text-xs text-gray-400 mb-2">오늘 순 연습시간</p>
                    <p className="text-5xl font-bold text-black mb-1">1:32</p>
                    <p className="text-sm text-gray-500">1시간 32분</p>
                    <div className="mt-6 w-full">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>전체 시간</span>
                        <span>2시간 15분</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-black rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">실제 연주 비율 68%</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 md:order-2">
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black">
                피아노 소리가 감지될 때만
              </p>
              <p className="text-xl md:text-2xl text-gray-500 mt-4 leading-relaxed">
                순 연습시간으로 기록됩니다.<br /><br />
                실제 연습한 시간만 정확하게.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Feature 3: 집중 연습 시스템 */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black">
                오늘 집중해야 할 구간을 알려주고
              </p>
              <p className="text-xl md:text-2xl text-gray-500 mt-4 leading-relaxed">
                바로 집중 연습을 시작할 수 있습니다.
              </p>
            </div>

            {/* Mockup */}
            <div className="relative mx-auto max-w-xs">
              <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col">
                    <div className="text-center mb-4 mt-8">
                      <p className="text-sm font-semibold">집중 연습</p>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <p className="text-xs font-medium">mm. 32-40</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">리듬 안정화 필요</p>
                        <button className="w-full bg-black text-white text-xs py-3 rounded-xl font-medium">
                          이 구간 집중 연습 · Tempo 72
                        </button>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <p className="text-xs font-medium">mm. 45-52</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">손가락 독립성</p>
                        <button className="w-full bg-gray-100 text-black text-xs py-3 rounded-xl font-medium">
                          이 구간 집중 연습 · Tempo 60
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Feature 4: 레슨 기반 연습 시스템 */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Mockup */}
            <div className="relative mx-auto max-w-xs order-2 md:order-1">
              <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col">
                    <div className="text-center mb-4 mt-8">
                      <p className="text-sm font-semibold">레슨 기반 연습 계획</p>
                      <p className="text-xs text-gray-400 mt-1">김선생님 · 1월 15일 레슨</p>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-medium">마디 32-40</p>
                          <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">중요</span>
                        </div>
                        <p className="text-xs text-gray-600">리듬 안정화</p>
                        <p className="text-xs text-gray-400 mt-1">Tempo 60 → 72</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <p className="text-xs font-medium mb-2">마디 52-58</p>
                        <p className="text-xs text-gray-600">왼손 독립성</p>
                        <p className="text-xs text-gray-400 mt-1">분리 연습</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <p className="text-xs font-medium mb-2">전체</p>
                        <p className="text-xs text-gray-600">페달링 정리</p>
                        <p className="text-xs text-gray-400 mt-1">깨끗하게</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 md:order-2">
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black">
                레슨 내용을 기반으로
              </p>
              <p className="text-xl md:text-2xl text-gray-500 mt-4 leading-relaxed">
                무엇을 연습해야 하는지 명확하게.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — Feature 5: 원포인트 레슨 요청 */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black">
                막히는 구간이 있다면
              </p>
              <p className="text-xl md:text-2xl text-gray-500 mt-4 leading-relaxed">
                원하는 선생님에게 직접 질문할 수 있습니다.
              </p>
            </div>

            {/* Mockup */}
            <div className="relative mx-auto max-w-xs">
              <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col">
                    <div className="text-center mb-4 mt-8">
                      <p className="text-sm font-semibold">원포인트 레슨</p>
                    </div>
                    <div className="flex-1">
                      {/* Teacher Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                            👩‍🏫
                          </div>
                          <div>
                            <p className="text-sm font-semibold">김서연 선생님</p>
                            <p className="text-xs text-gray-500">서울대 피아노 전공</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">쇼팽</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">드뷔시</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>⭐ 4.9 (127)</span>
                          <span>평균 2시간 응답</span>
                        </div>
                        <button className="w-full bg-black text-white text-xs py-3 rounded-xl font-medium">
                          이 선생님에게 요청하기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — Feature 6: 메트로놈 + 음악 용어 */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black">
            메트로놈과 음악 용어를
          </p>
          <p className="text-xl md:text-2xl text-gray-500 mt-4 leading-relaxed">
            한 곳에서 바로 확인하세요.
          </p>

          {/* Two Mockups Side by Side */}
          <div className="flex justify-center gap-6 mt-12">
            {/* Metronome Mockup */}
            <div className="relative max-w-[160px]">
              <div className="relative bg-black rounded-[2rem] p-2 shadow-xl">
                <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-3 flex flex-col items-center justify-center">
                    <p className="text-xs text-gray-400 mb-2">메트로놈</p>
                    <p className="text-4xl font-bold mb-1">120</p>
                    <p className="text-xs text-gray-500">BPM</p>
                    <div className="mt-4 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">▶</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full"></div>
              </div>
            </div>

            {/* Music Terms Mockup */}
            <div className="relative max-w-[160px]">
              <div className="relative bg-black rounded-[2rem] p-2 shadow-xl">
                <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                  <div className="h-full bg-gradient-to-b from-gray-50 to-white p-3 flex flex-col">
                    <p className="text-xs text-gray-400 mb-3 text-center">음악 용어</p>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-medium">Allegro</p>
                        <p className="text-xs text-gray-500">빠르게</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-medium">Legato</p>
                        <p className="text-xs text-gray-500">이어서</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-medium">Crescendo</p>
                        <p className="text-xs text-gray-500">점점 세게</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — Final CTA */}
      <section className="py-32 px-6 bg-black text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xl text-gray-400 mb-4">
            연습을 더 명확하게
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12">
            GRIT.ON
          </h2>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-black px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-black text-white border-t border-gray-800">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-500">
          <p>&copy; 2025 GRIT.ON. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
