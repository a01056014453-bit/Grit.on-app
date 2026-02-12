import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import librosa
import pandas as pd

# 1. 구글의 사전 학습된 소리 분류 모델(YAMNet) 로드
# 이 모델은 521가지 소리를 구분할 수 있습니다.
model = hub.load('https://tfhub.dev/google/yamnet/1')

# 클래스 이름 매핑 파일 다운로드 (무엇이 목소리고 무엇이 악기인지 알기 위함)
class_map_path = model.class_map_path().numpy().decode('utf-8')
class_names = pd.read_csv(class_map_path)['display_name'].values

def analyze_practice_time(file_path):
    print(f"[{file_path}] 분석을 시작합니다...")

    # 2. 오디오 로드 (YAMNet 규격인 16kHz로 변환)
    wav_data, sr = librosa.load(file_path, sr=16000)

    # 3. 모델 추론 (소리 분석)
    # scores는 각 구간별(약 0.48초 단위) 521개 클래스의 확률값입니다.
    scores, embeddings, spectrogram = model(wav_data)

    # 결과값 변환
    scores_np = scores.numpy()
    inferred_class_indices = scores_np.argmax(axis=1)

    # 시간 계산용 변수
    segment_duration = 0.48  # YAMNet의 한 세그먼트 당 시간(초)
    total_instrument_time = 0
    total_speech_time = 0

    print("\n--- 분석 결과 상세 ---")
    for i, class_idx in enumerate(inferred_class_indices):
        class_name = class_names[class_idx]
        current_time = i * segment_duration

        # 'Music'이나 특정 악기 관련 키워드가 포함되면 악기 소리로 간주
        is_instrument = any(keyword in class_name for keyword in ['Music', 'Instrument', 'Piano', 'Guitar', 'Violin'])
        is_speech = 'Speech' in class_name or 'Conversation' in class_name

        if is_instrument:
            total_instrument_time += segment_duration
        elif is_speech:
            total_speech_time += segment_duration

    print(f"\n최종 요약:")
    print(f"실제 악기 연습 시간: {total_instrument_time:.2f}초")
    print(f"단순 대화/목소리 시간: {total_speech_time:.2f}초")
    print(f"기타 잡음/무음 시간: {len(inferred_class_indices)*segment_duration - total_instrument_time - total_speech_time:.2f}초")

# 실행 (본인의 녹음 파일 경로를 넣으세요)
# analyze_practice_time('my_practice_audio.wav')
